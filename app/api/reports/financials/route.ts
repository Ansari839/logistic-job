import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const branchId = searchParams.get('branchId');

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {}; // For transactions
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    try {
        switch (type) {
            case 'trial-balance': {
                const accounts = await prisma.account.findMany({
                    where: { companyId: user.companyId },
                    include: {
                        entries: {
                            where: {
                                transaction: {
                                    companyId: user.companyId,
                                    ...(endDate && { createdAt: { lte: new Date(endDate) } })
                                }
                            },
                            select: { debit: true, credit: true }
                        }
                    }
                });

                const report = accounts.map(acc => {
                    const totalDebit = acc.entries.reduce((sum, e) => sum + e.debit, 0);
                    const totalCredit = acc.entries.reduce((sum, e) => sum + e.credit, 0);
                    return {
                        code: acc.code,
                        name: acc.name,
                        type: acc.type,
                        debit: totalDebit,
                        credit: totalCredit,
                        balance: acc.type === 'ASSET' || acc.type === 'EXPENSE'
                            ? totalDebit - totalCredit
                            : totalCredit - totalDebit
                    };
                }).filter(r => r.debit !== 0 || r.credit !== 0);

                return NextResponse.json({ report });
            }

            case 'profit-loss': {
                const accounts = await prisma.account.findMany({
                    where: {
                        companyId: user.companyId,
                        type: { in: ['REVENUE', 'EXPENSE'] }
                    },
                    include: {
                        entries: {
                            where: {
                                transaction: {
                                    companyId: user.companyId,
                                    ...(startDate && { createdAt: { gte: new Date(startDate) } }),
                                    ...(endDate && { createdAt: { lte: new Date(endDate) } })
                                }
                            },
                            select: { debit: true, credit: true }
                        }
                    }
                });

                const revenue = accounts.filter(a => a.type === 'REVENUE').map(acc => ({
                    name: acc.name,
                    amount: acc.entries.reduce((sum, e) => sum + (e.credit - e.debit), 0)
                }));

                const expenses = accounts.filter(a => a.type === 'EXPENSE').map(acc => ({
                    name: acc.name,
                    amount: acc.entries.reduce((sum, e) => sum + (e.debit - e.credit), 0)
                }));

                const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
                const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

                return NextResponse.json({
                    report: {
                        revenue,
                        expenses,
                        totalRevenue,
                        totalExpenses,
                        netProfit: totalRevenue - totalExpenses
                    }
                });
            }

            case 'outstandings': {
                const subType = searchParams.get('subType'); // 'CUSTOMER' or 'VENDOR'

                if (subType === 'CUSTOMER') {
                    const customers = await prisma.customer.findMany({
                        where: { companyId: user.companyId },
                        include: {
                            invoices: {
                                where: { status: { not: 'CANCELLED' } },
                                select: { grandTotal: true, id: true }
                            },
                            payments: {
                                select: { amount: true }
                            }
                        }
                    });

                    const report = customers.map(c => {
                        const totalInvoiced = c.invoices.reduce((sum, i) => sum + i.grandTotal, 0);
                        const totalPaid = c.payments.reduce((sum, p) => sum + p.amount, 0);
                        return {
                            id: c.id,
                            name: c.name,
                            code: c.code,
                            totalInvoiced,
                            totalPaid,
                            balance: totalInvoiced - totalPaid
                        };
                    }).filter(r => r.balance !== 0);

                    return NextResponse.json({ report });
                } else {
                    // VENDOR
                    const vendors = await prisma.vendor.findMany({
                        where: { companyId: user.companyId },
                        include: {
                            purchaseInvoices: {
                                select: { grandTotal: true }
                            },
                            payments: {
                                select: { amount: true }
                            }
                        }
                    });

                    const report = vendors.map(v => {
                        const totalInvoiced = v.purchaseInvoices.reduce((sum, i) => sum + i.grandTotal, 0);
                        const totalPaid = v.payments.reduce((sum, p) => sum + p.amount, 0);
                        return {
                            id: v.id,
                            name: v.name,
                            code: v.code,
                            totalInvoiced,
                            totalPaid,
                            balance: totalInvoiced - totalPaid
                        };
                    }).filter(r => r.balance !== 0);

                    return NextResponse.json({ report });
                }
            }

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Financial report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
