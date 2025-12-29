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
    const type = searchParams.get('type') || 'TRIAL_BALANCE'; // TRIAL_BALANCE, PL, BALANCE_SHEET
    const toDate = searchParams.get('toDate') ? new Date(searchParams.get('toDate')!) : new Date();

    try {
        // Fetch all accounts with aggregated balances
        const accounts = await prisma.account.findMany({
            where: { companyId: user.companyId },
            include: {
                entries: {
                    where: {
                        transaction: { date: { lte: toDate } }
                    },
                    select: { debit: true, credit: true }
                }
            }
        });

        const reportData = accounts.map(a => {
            const balance = a.entries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
            return {
                id: a.id,
                code: a.code,
                name: a.name,
                type: a.type,
                balance
            };
        }).filter(a => a.balance !== 0);

        if (type === 'PL') {
            const revenue = reportData.filter(a => a.type === 'REVENUE');
            const expenses = reportData.filter(a => a.type === 'EXPENSE');
            const totalRevenue = revenue.reduce((sum, a) => sum - a.balance, 0); // Revenue is usually credit (negative balance in my debit-credit sum)
            const totalExpenses = expenses.reduce((sum, a) => sum + a.balance, 0);
            return NextResponse.json({
                revenue,
                expenses,
                netProfit: totalRevenue - totalExpenses,
                totalRevenue,
                totalExpenses
            });
        }

        if (type === 'BALANCE_SHEET') {
            const assets = reportData.filter(a => a.type === 'ASSET');
            const liabilities = reportData.filter(a => a.type === 'LIABILITY');
            const equity = reportData.filter(a => a.type === 'EQUITY');

            // Add Net Profit to Retained Earnings (simplified)
            const pnlData = accounts.filter(a => a.type === 'REVENUE' || a.type === 'EXPENSE');
            const currentNetProfit = pnlData.reduce((sum, a) => {
                const bal = a.entries.reduce((s, e) => s + (e.debit - e.credit), 0);
                return sum + bal;
            }, 0);

            const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
            const totalLiabilities = liabilities.reduce((sum, a) => sum - a.balance, 0);
            const totalEquity = equity.reduce((sum, a) => sum - a.balance, 0) - currentNetProfit;

            return NextResponse.json({
                assets,
                liabilities,
                equity,
                totalAssets,
                totalLiabilities,
                totalEquity,
                currentNetProfit: -currentNetProfit,
                isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
            });
        }

        // Default: Trial Balance
        const totalDebit = reportData.filter(a => a.balance > 0).reduce((sum, a) => sum + a.balance, 0);
        const totalCredit = reportData.filter(a => a.balance < 0).reduce((sum, a) => sum - a.balance, 0);

        return NextResponse.json({
            report: reportData,
            totalDebit,
            totalCredit,
            isBalanced: Math.abs(totalDebit - totalCredit) < 0.01
        });

    } catch (error) {
        console.error('Financial report error:', error);
        return NextResponse.json({ error: 'Failed to generate financial report' }, { status: 500 });
    }
}
