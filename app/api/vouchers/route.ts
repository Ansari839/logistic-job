import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { generateVoucherNumber } from '@/lib/utils/voucher';
import { VoucherType } from '@/app/generated/prisma';
import { z } from 'zod';

const voucherSchema = z.object({
    date: z.string().optional(),
    description: z.string().optional(),
    voucherType: z.enum(['JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA']),
    paymentMode: z.enum(['CASH', 'BANK', 'CHEQUE', 'ONLINE']).optional(),
    instrumentNo: z.string().optional(),
    instrumentDate: z.string().optional(),
    bankName: z.string().optional(),
    entries: z.array(z.object({
        accountId: z.number(),
        description: z.string().optional(),
        debit: z.number().default(0),
        credit: z.number().default(0),
    })).min(2),
});

export async function GET(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as any;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const whereClause: any = {
            companyId: user.companyId,
            ...(type && type !== 'ALL' ? { voucherType: type } : {}),
            ...(search ? {
                OR: [
                    { voucherNumber: { contains: search, mode: 'insensitive' } },
                    { narration: { contains: search, mode: 'insensitive' } }
                ]
            } : {})
        };

        const [vouchers, total] = await prisma.$transaction([
            prisma.voucher.findMany({
                where: whereClause,
                include: {
                    entries: {
                        include: { account: { select: { id: true, name: true, code: true } } }
                    },
                    postedBy: { select: { name: true } }
                },
                orderBy: { date: 'desc' },
                skip,
                take: limit,
            }),
            prisma.voucher.count({ where: whereClause })
        ]);

        return NextResponse.json({
            vouchers,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit
            }
        });
    } catch (error) {
        console.error('Fetch vouchers error:', error);
        return NextResponse.json({ error: 'Failed to fetch vouchers' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTS') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const validatedData = voucherSchema.parse(body);

        // Validate balance
        const totalDebit = validatedData.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = validatedData.entries.reduce((sum, e) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'Debits must equal Credits' }, { status: 400 });
        }

        const voucher = await prisma.$transaction(async (tx) => {
            const date = validatedData.date ? new Date(validatedData.date) : new Date();
            const voucherNumber = await generateVoucherNumber(user.companyId!, validatedData.voucherType as any, date);

            const newVoucher = await tx.voucher.create({
                data: {
                    voucherNumber,
                    voucherType: validatedData.voucherType as any,
                    date: date,
                    narration: validatedData.description,
                    instrumentNo: validatedData.instrumentNo,
                    instrumentDate: validatedData.instrumentDate ? new Date(validatedData.instrumentDate) : null,
                    bankName: validatedData.bankName,
                    paymentMode: validatedData.paymentMode as any,
                    companyId: user.companyId!,
                    status: 'POSTED',
                    postedById: user.id,
                    entries: {
                        create: validatedData.entries.map(e => ({
                            accountId: e.accountId,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit,
                        }))
                    }
                },
                include: { entries: true }
            });

            // Also create Transaction for Ledger effect
            await tx.transaction.create({
                data: {
                    reference: voucherNumber,
                    date: date,
                    description: validatedData.description,
                    type: validatedData.voucherType as any,
                    companyId: user.companyId!,
                    entries: {
                        create: validatedData.entries.map(e => ({
                            accountId: e.accountId,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit
                        }))
                    }
                }
            });

            return newVoucher;
        });

        return NextResponse.json(voucher, { status: 201 });
    } catch (error) {
        console.error('Create voucher error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create voucher' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTS') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 });
        }

        const voucherId = parseInt(id);

        await prisma.$transaction(async (tx) => {
            const voucher = await tx.voucher.findUnique({
                where: { id: voucherId, companyId: user.companyId! }
            });

            if (!voucher) throw new Error('Voucher not found');

            // Delete linked transaction
            await tx.transaction.deleteMany({
                where: { reference: voucher.voucherNumber, companyId: user.companyId! }
            });

            // Delete voucher (Cascade will handle VoucherEntry if configured, but we do it anyway for safety if not)
            await tx.voucher.delete({
                where: { id: voucherId }
            });
        });

        return NextResponse.json({ message: 'Voucher deleted successfully' });
    } catch (error: any) {
        console.error('Delete voucher error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete voucher' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user || !user.companyId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN' && user.role !== 'ACCOUNTS') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: 'Voucher ID is required' }, { status: 400 });
        }

        const validatedData = voucherSchema.parse(updateData);

        // Validate balance
        const totalDebit = validatedData.entries.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = validatedData.entries.reduce((sum, e) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'Debits must equal Credits' }, { status: 400 });
        }

        const voucher = await prisma.$transaction(async (tx) => {
            const existingVoucher = await tx.voucher.findUnique({
                where: { id: parseInt(id), companyId: user.companyId! }
            });

            if (!existingVoucher) throw new Error('Voucher not found');

            const date = validatedData.date ? new Date(validatedData.date) : existingVoucher.date;

            // 1. Update Voucher
            const updatedVoucher = await tx.voucher.update({
                where: { id: parseInt(id) },
                data: {
                    date: date,
                    narration: validatedData.description,
                    instrumentNo: validatedData.instrumentNo,
                    instrumentDate: validatedData.instrumentDate ? new Date(validatedData.instrumentDate) : null,
                    bankName: validatedData.bankName,
                    paymentMode: validatedData.paymentMode as any,
                    entries: {
                        deleteMany: {},
                        create: validatedData.entries.map(e => ({
                            accountId: e.accountId,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit,
                        }))
                    }
                },
                include: { entries: true }
            });

            // 2. Update Transaction
            await tx.transaction.update({
                where: {
                    companyId_reference: {
                        companyId: user.companyId!,
                        reference: existingVoucher.voucherNumber
                    }
                },
                data: {
                    date: date,
                    description: validatedData.description,
                    entries: {
                        deleteMany: {},
                        create: validatedData.entries.map(e => ({
                            accountId: e.accountId,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit
                        }))
                    }
                }
            });

            return updatedVoucher;
        });

        return NextResponse.json(voucher);
    } catch (error: any) {
        console.error('Update voucher error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to update voucher' }, { status: 500 });
    }
}
