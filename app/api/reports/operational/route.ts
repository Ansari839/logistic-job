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
    const customerId = searchParams.get('customerId');
    const vendorId = searchParams.get('vendorId');
    const branchId = searchParams.get('branchId');

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    try {
        switch (type) {
            case 'job-profitability': {
                const jobs = await prisma.job.findMany({
                    where: {
                        companyId: user.companyId,
                        ...(branchId && { branchId: parseInt(branchId) }),
                        ...(customerId && { customerId: parseInt(customerId) }),
                        ...dateFilter,
                    },
                    include: {
                        customer: { select: { name: true } },
                        expenses: { select: { costPrice: true, sellingPrice: true } },
                        serviceInvoices: { select: { totalAmount: true, status: true } },
                        freightInvoice: { select: { totalAmount: true, status: true } },
                    },
                });

                const report = jobs.map(job => {
                    const totalCost = job.expenses.reduce((sum, exp) => sum + exp.costPrice, 0);
                    const serviceRevenue = job.serviceInvoices.reduce((sum, inv) =>
                        inv.status !== 'CANCELLED' ? sum + inv.totalAmount : sum, 0);
                    const freightRevenue = job.freightInvoice && job.freightInvoice.status !== 'CANCELLED' ? job.freightInvoice.totalAmount : 0;
                    const totalRevenue = serviceRevenue + freightRevenue;

                    return {
                        id: job.id,
                        jobNumber: job.jobNumber,
                        customer: job.customer.name,
                        date: job.date,
                        revenue: totalRevenue,
                        cost: totalCost,
                        profit: totalRevenue - totalCost,
                        margin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0
                    };
                });

                return NextResponse.json({ report });
            }

            case 'job-status': {
                const statusCounts = await prisma.job.groupBy({
                    by: ['jobType'],
                    where: {
                        companyId: user.companyId,
                        ...dateFilter,
                    },
                    _count: { id: true }
                });
                return NextResponse.json({ report: statusCounts });
            }

            case 'customer-summary': {
                const customers = await prisma.customer.findMany({
                    where: {
                        companyId: user.companyId,
                        ...(customerId && { id: parseInt(customerId) })
                    },
                    include: {
                        jobs: {
                            where: { ...dateFilter },
                            include: {
                                serviceInvoices: { select: { totalAmount: true, status: true } },
                                freightInvoice: { select: { totalAmount: true, status: true } }
                            }
                        }
                    }
                });

                const report = customers.map(c => {
                    const totalJobs = c.jobs.length;
                    const totalRevenue = c.jobs.reduce((sum, job) => {
                        const serRev = job.serviceInvoices.reduce((sum: number, inv: any) =>
                            inv.status !== 'CANCELLED' ? sum + inv.totalAmount : sum, 0);
                        const freRev = job.freightInvoice && job.freightInvoice.status !== 'CANCELLED' ? job.freightInvoice.totalAmount : 0;
                        return sum + serRev + freRev;
                    }, 0);

                    return {
                        name: c.name,
                        code: c.code,
                        jobCount: totalJobs,
                        totalRevenue
                    };
                });

                return NextResponse.json({ report });
            }

            case 'vendor-analysis': {
                const vendors = await prisma.vendor.findMany({
                    where: {
                        companyId: user.companyId,
                        ...(vendorId && { id: parseInt(vendorId) })
                    },
                    include: {
                        expenses: {
                            where: { ...dateFilter },
                            select: { costPrice: true }
                        }
                    }
                });

                const report = vendors.map(v => ({
                    name: v.name,
                    code: v.code,
                    type: v.type,
                    expenseCount: v.expenses.length,
                    totalCost: v.expenses.reduce((sum, exp) => sum + exp.costPrice, 0)
                }));

                return NextResponse.json({ report });
            }

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Operational report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
