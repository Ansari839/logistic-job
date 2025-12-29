import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const paymentSchema = z.object({
    receiptNumber: z.string().min(1),
    date: z.string().optional(),
    amount: z.number().positive(),
    mode: z.enum(['CASH', 'BANK', 'CHEQUE', 'ONLINE']),
    reference: z.string().optional(),
    customerId: z.number().optional().nullable(),
    vendorId: z.number().optional().nullable(),
    bankAccountId: z.number(), // The specific Cash or Bank account
});

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const payments = await prisma.payment.findMany({
            where: { companyId: user.companyId },
            include: {
                customer: { select: { name: true } },
                vendor: { select: { name: true } },
                transaction: {
                    include: { entries: { include: { account: { select: { name: true, code: true } } } } }
                }
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({ payments });
    } catch (error) {
        console.error('Fetch payments error:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId || (user.role !== 'ADMIN' && user.role !== 'ACCOUNTS')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = paymentSchema.parse(body);

        if (!validatedData.customerId && !validatedData.vendorId) {
            return NextResponse.json({ error: 'Either Customer or Vendor must be specified' }, { status: 400 });
        }

        const payment = await prisma.$transaction(async (tx) => {
            // 1. Identify the contra account (Accounts Receivable or Accounts Payable)
            let contraAccountCode = '';
            if (validatedData.customerId) {
                contraAccountCode = '1130'; // Accounts Receivable
            } else {
                contraAccountCode = '2110'; // Accounts Payable
            }

            const contraAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId!, code: contraAccountCode } }
            });

            if (!contraAccount) {
                throw new Error(`System account ${contraAccountCode} not found. Please check COA.`);
            }

            // 2. Create the accounting transaction
            const transaction = await tx.transaction.create({
                data: {
                    reference: validatedData.receiptNumber,
                    date: validatedData.date ? new Date(validatedData.date) : new Date(),
                    description: `Payment ${validatedData.receiptNumber} - ${validatedData.customerId ? 'Customer' : 'Vendor'}`,
                    type: validatedData.customerId ? 'RECEIPT' : 'PAYMENT',
                    companyId: user.companyId!,
                    entries: {
                        create: [
                            {
                                accountId: validatedData.bankAccountId,
                                debit: validatedData.customerId ? validatedData.amount : 0,
                                credit: validatedData.customerId ? 0 : validatedData.amount,
                                description: validatedData.reference || 'Bank/Cash entry'
                            },
                            {
                                accountId: contraAccount.id,
                                debit: validatedData.customerId ? 0 : validatedData.amount,
                                credit: validatedData.customerId ? validatedData.amount : 0,
                                description: `Payment from ${validatedData.customerId ? 'Customer' : 'Vendor'}`
                            }
                        ]
                    }
                }
            });

            // 3. Create the payment record linked to the transaction
            const p = await tx.payment.create({
                data: {
                    receiptNumber: validatedData.receiptNumber,
                    date: validatedData.date ? new Date(validatedData.date) : new Date(),
                    amount: validatedData.amount,
                    mode: validatedData.mode,
                    reference: validatedData.reference,
                    customerId: validatedData.customerId,
                    vendorId: validatedData.vendorId,
                    transactionId: transaction.id,
                    companyId: user.companyId!,
                }
            });

            return p;
        });

        return NextResponse.json({ payment, message: 'Payment recorded and posted to ledger' });
    } catch (error: any) {
        console.error('Create payment error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
    }
}
