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
    const jobType = searchParams.get('jobType');

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

                const report = jobs.map((job: any) => {
                    const totalCost = job.expenses.reduce((sum: any, exp: any) => sum + exp.costPrice, 0);
                    const serviceRevenue = job.serviceInvoices.reduce((sum: any, inv: any) =>
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

                const report = customers.map((c: any) => {
                    const totalJobs = c.jobs.length;
                    const totalRevenue = c.jobs.reduce((sum: any, job: any) => {
                        const serRev = job.serviceInvoices.reduce((serSum: any, inv: any) =>
                            inv.status !== 'CANCELLED' ? serSum + inv.totalAmount : serSum, 0);
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

                const report = vendors.map((v: any) => ({
                    name: v.name,
                    code: v.code,
                    type: v.type,
                    expenseCount: v.expenses.length,
                    totalCost: v.expenses.reduce((sum: any, exp: any) => sum + exp.costPrice, 0)
                }));

                return NextResponse.json({ report });
            }

            case 'job-master': {
                const jobs = await prisma.job.findMany({
                    where: {
                        companyId: user.companyId,
                        ...(branchId && { branchId: parseInt(branchId) }),
                        ...(customerId && { customerId: parseInt(customerId) }),
                        ...(jobType && { jobType: jobType }),
                        ...dateFilter,
                    },
                    include: {
                        customer: { select: { name: true, code: true } },
                        expenses: {
                            include: {
                                vendor: { select: { name: true } }
                            }
                        },
                        serviceInvoices: { select: { totalAmount: true, status: true } },
                        freightInvoice: { select: { totalAmount: true, status: true } },
                    },
                    orderBy: { jobNumber: 'desc' }
                });

                const report = jobs.map((job: any) => {
                    const detailedExpenses = job.expenses.map((exp: any) => ({
                        id: exp.id,
                        description: exp.description,
                        cost: exp.costPrice,
                        sell: exp.sellingPrice,
                        profit: exp.sellingPrice - exp.costPrice,
                        vendor: exp.vendor?.name || 'N/A'
                    }));

                    const totalCost = job.expenses.reduce((sum: any, exp: any) => sum + exp.costPrice, 0);
                    const totalSellFromExpenses = job.expenses.reduce((sum: any, exp: any) => sum + exp.sellingPrice, 0);

                    // Invoices might have different totals than individual expense selling prices
                    const serviceRevenue = job.serviceInvoices.reduce((sum: any, inv: any) =>
                        inv.status !== 'CANCELLED' ? sum + inv.totalAmount : sum, 0);
                    const freightRevenue = job.freightInvoice && job.freightInvoice.status !== 'CANCELLED' ? job.freightInvoice.totalAmount : 0;
                    const invoiceRevenue = serviceRevenue + freightRevenue;

                    // Use selling price from expenses for margin analysis unless invoices are specified
                    const totalRevenue = invoiceRevenue > 0 ? invoiceRevenue : totalSellFromExpenses;

                    return {
                        id: job.id,
                        jobNumber: job.jobNumber,
                        date: job.jobDate || job.date,
                        customer: job.customer.name,
                        customerCode: job.customer.code,
                        vessel: job.vessel || 'N/A',
                        gdNo: job.gdNo || 'N/A',
                        sell: totalRevenue,
                        cost: totalCost,
                        profit: totalRevenue - totalCost,
                        expenses: detailedExpenses
                    };
                });

                // Calculate grand totals for the summary
                const totals = {
                    sell: report.reduce((sum, item) => sum + item.sell, 0),
                    cost: report.reduce((sum, item) => sum + item.cost, 0),
                    profit: report.reduce((sum, item) => sum + item.profit, 0)
                };

                return NextResponse.json({ report, totals });
            }

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Operational report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
