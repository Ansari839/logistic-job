import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

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
    const accountId = searchParams.get('accountId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');

    if (!accountId) {
        return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    try {
        const from = fromDate ? new Date(fromDate) : new Date('2000-01-01');
        const to = toDate ? new Date(toDate) : new Date('2099-12-31');

        // 1. Calculate opening balance (all entries before fromDate)
        const openingBalanceEntries = await prisma.accountEntry.findMany({
            where: {
                accountId: Number(accountId),
                transaction: {
                    companyId: user.companyId,
                    date: { lt: from }
                }
            },
            select: { debit: true, credit: true }
        });

        const openingBalance = openingBalanceEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);

        // 2. Fetch all entries within range
        const entries = await prisma.accountEntry.findMany({
            where: {
                accountId: Number(accountId),
                transaction: {
                    companyId: user.companyId,
                    date: { gte: from, lte: to }
                }
            },
            include: {
                transaction: { select: { reference: true, date: true, description: true, type: true } }
            },
            orderBy: { transaction: { date: 'asc' } }
        });

        // 3. Transform to include running balance
        let currentBalance = openingBalance;
        const ledger = entries.map(e => {
            currentBalance += (e.debit - e.credit);
            return {
                ...e,
                balance: currentBalance
            };
        });

        return NextResponse.json({
            openingBalance,
            closingBalance: currentBalance,
            entries: ledger
        });
    } catch (error) {
        console.error('Ledger error:', error);
        return NextResponse.json({ error: 'Failed to generate ledger report' }, { status: 500 });
    }
}
