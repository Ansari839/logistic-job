import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';

const transactionSchema = z.object({
    reference: z.string().min(1),
    date: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['JOURNAL', 'RECEIPT', 'PAYMENT', 'INVOICE']),
    entries: z.array(z.object({
        accountId: z.number(),
        description: z.string().optional(),
        debit: z.number().default(0),
        credit: z.number().default(0),
    })).min(2),
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    try {
        const transactions = await prisma.transaction.findMany({
            where: {
                companyId: user.companyId,
                ...(type ? { type: type as any } : {})
            },
            include: {
                entries: {
                    include: { account: { select: { name: true, code: true } } }
                }
            },
            orderBy: { date: 'desc' },
        });

        return NextResponse.json({ transactions });
    } catch (error) {
        console.error('Fetch transactions error:', error);
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId || user.role !== 'ADMIN' && user.role !== 'ACCOUNTS') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = transactionSchema.parse(body);

        // Validate that debits equal credits
        const totalDebit = validatedData.entries.reduce((sum: any, e: any) => sum + e.debit, 0);
        const totalCredit = validatedData.entries.reduce((sum: any, e: any) => sum + e.credit, 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            return NextResponse.json({ error: 'Debits must equal Credits' }, { status: 400 });
        }

        const transaction = await prisma.$transaction(async (tx: any) => {
            let reference = validatedData.reference;

            // Auto-generate reference if not provided or if it's a JOURNAL type
            if (!reference || validatedData.type === 'JOURNAL') {
                const dateObj = validatedData.date ? new Date(validatedData.date) : new Date();
                const year = dateObj.getFullYear();
                const prefix = validatedData.type === 'JOURNAL' ? 'JV' : 'TX';

                const lastTx = await tx.transaction.findFirst({
                    where: {
                        companyId: user.companyId as number,
                        type: validatedData.type,
                        reference: { startsWith: `${prefix}-${year}-` }
                    },
                    orderBy: { reference: 'desc' }
                });

                let sequence = 1;
                if (lastTx) {
                    const parts = lastTx.reference.split('-');
                    if (parts.length === 3) {
                        const lastSeq = parseInt(parts[2]);
                        if (!isNaN(lastSeq)) sequence = lastSeq + 1;
                    }
                }
                reference = `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
            }

            const t = await tx.transaction.create({
                data: {
                    reference,
                    date: validatedData.date ? new Date(validatedData.date) : new Date(),
                    description: validatedData.description,
                    type: validatedData.type,
                    companyId: user.companyId!,
                    entries: {
                        create: validatedData.entries.map((e: any) => ({
                            accountId: e.accountId,
                            description: e.description,
                            debit: e.debit,
                            credit: e.credit,
                        }))
                    }
                },
                include: { entries: true }
            });
            return t;
        });

        return NextResponse.json({ transaction, message: 'Transaction posted successfully' });
    } catch (error) {
        console.error('Create transaction error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to post transaction' }, { status: 500 });
    }
}
