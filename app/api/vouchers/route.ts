import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';
import { generateVoucherNumber } from '@/lib/utils/voucher';
import { VoucherType } from '@prisma/client';
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
            if (isNaN(date.getTime())) throw new Error('Invalid voucher date');

            const voucherNumber = await generateVoucherNumber(user.companyId!, validatedData.voucherType as any, date, tx);
            console.log(`Generating voucher: ${voucherNumber} for type ${validatedData.voucherType}`);

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

            if (voucher.status === 'POSTED') {
                // Soft Delete (Void)
                // 1. Delete Financial Impact (Transaction)
                await tx.transaction.deleteMany({
                    where: { reference: voucher.voucherNumber, companyId: user.companyId! }
                });

                // 2. Mark Voucher as CANCELLED
                await tx.voucher.update({
                    where: { id: voucherId },
                    data: { status: 'CANCELLED' }
                });
            } else {
                // Hard Delete (Draft or Already Cancelled - Wait, if Cancelled, maybe just delete? Or strict?)
                // Assuming DRAFT or CANCELLED can be hard deleted if user really wants to remove it?
                // Plan said: DRAFT -> Hard Delete. POSTED -> Soft Delete.
                // If it's already CANCELLED, reusing delete again might mean "Cleanup".
                // For now, let's treat anything NOT POSTED as deletable, or strictly DRAFT.
                // But usually if it's Cancelled, it stays. The user button usually handles "Delete" vs "Cancel".
                // If user hits Delete on a Cancelled item, maybe allowed?
                // Let's stick to: If POSTED, Void it. If DRAFT (or others), Delete it.
                // Wait, if it is CANCELLED, and they click DELETE, should we hard delete?
                // User said: "It stays in the database... UI shows... as VOID".
                // So DELETE on a Cancelled item should probably be blocked or do nothing?
                // Or maybe the UI won't show a delete button for Cancelled?
                // Let's implement: If POSTED -> Cancel. If DRAFT -> Delete. If CANCELLED -> Error "Already Voided" or Allow Delete? 
                // "Reuse the number" logic implies Hard Delete frees it.
                // Let's assume standard behavior:
                // If status is POSTED: Void it.
                // If status is DRAFT: Delete it.
                // If status is CANCELLED: Delete it (Hard Delete) ? No, user said "Stays in DB".
                // So if status is CANCELLED, we should probably throw "Cannot delete voided voucher" or just return success (noop).
                // Let's allow Hard Delete only for DRAFT.

                if (voucher.status === 'DRAFT') {
                    // Delete linked transaction coverage (just in case)
                    await tx.transaction.deleteMany({
                        where: { reference: voucher.voucherNumber, companyId: user.companyId! }
                    });

                    await tx.voucher.delete({
                        where: { id: voucherId }
                    });
                } else if (voucher.status === 'CANCELLED') {
                    throw new Error('This voucher is already voided and cannot be deleted.');
                }
            }
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
