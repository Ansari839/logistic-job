import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const companyId = user.companyId as number;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        // 1. Active Jobs Count (IN_PROGRESS + DRAFT)
        const activeJobsCount = await prisma.job.count({
            where: {
                companyId,
                status: { in: ['IN_PROGRESS', 'DRAFT'] },
                deletedAt: null
            }
        });

        // 2. Total Jobs This Month
        const totalJobsThisMonth = await prisma.job.count({
            where: {
                companyId,
                createdAt: { gte: startOfMonth, lte: endOfMonth },
                deletedAt: null,
                status: { not: 'CANCELLED' }
            }
        });

        // 3. Closed Jobs This Month
        const closedJobsThisMonth = await prisma.job.count({
            where: {
                companyId,
                createdAt: { gte: startOfMonth, lte: endOfMonth },
                status: 'CLOSED',
                deletedAt: null
            }
        });

        // 4. Completion Rate
        const completionRate = totalJobsThisMonth > 0
            ? Math.round((closedJobsThisMonth / totalJobsThisMonth) * 100)
            : 0;

        // 5. Monthly Revenue (Service + Freight Invoices)
        const serviceInvoices = await prisma.serviceInvoice.findMany({
            where: {
                companyId,
                status: 'PAID',
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            },
            select: { totalAmount: true }
        });

        const freightInvoices = await prisma.freightInvoice.findMany({
            where: {
                companyId,
                status: 'PAID',
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            },
            select: { totalAmount: true }
        });

        const monthlyRevenue =
            serviceInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0) +
            freightInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

        // 6. Pending Invoices Count (DRAFT + SENT)
        const pendingInvoicesCount = await prisma.serviceInvoice.count({
            where: {
                companyId,
                status: { in: ['DRAFT', 'SENT'] }
            }
        }) + await prisma.freightInvoice.count({
            where: {
                companyId,
                status: { in: ['DRAFT', 'SENT'] }
            }
        });

        // 7. Job Status Breakdown
        const jobsByStatus = await prisma.job.groupBy({
            by: ['status'],
            where: {
                companyId,
                deletedAt: null
            },
            _count: true
        });

        const statusBreakdown = jobsByStatus.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
        }, {} as Record<string, number>);

        // 8. Recent Activity (Last 10 jobs)
        const recentJobs = await prisma.job.findMany({
            where: {
                companyId,
                deletedAt: null
            },
            include: {
                customer: {
                    select: { name: true, code: true }
                },
                branch: {
                    select: { name: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // 9. Top Customers by Revenue (This Month)
        const customerRevenue = await prisma.serviceInvoice.groupBy({
            by: ['customerId'],
            where: {
                companyId,
                status: 'PAID',
                createdAt: { gte: startOfMonth, lte: endOfMonth }
            },
            _sum: {
                totalAmount: true
            },
            orderBy: {
                _sum: {
                    totalAmount: 'desc'
                }
            },
            take: 5
        });

        const topCustomers = await Promise.all(
            customerRevenue.map(async (item) => {
                const customer = await prisma.customer.findUnique({
                    where: { id: item.customerId },
                    select: { name: true, code: true }
                });
                return {
                    customer: customer?.name || 'Unknown',
                    code: customer?.code || '',
                    revenue: item._sum.totalAmount || 0
                };
            })
        );

        return NextResponse.json({
            stats: {
                activeJobs: activeJobsCount,
                monthlyRevenue: Math.round(monthlyRevenue),
                pendingInvoices: pendingInvoicesCount,
                completionRate
            },
            jobsByStatus: statusBreakdown,
            recentActivity: recentJobs.map(job => ({
                id: job.id,
                jobNumber: job.jobNumber,
                customer: job.customer?.name || 'N/A',
                status: job.status,
                branch: job.branch?.name || 'N/A',
                createdAt: job.createdAt
            })),
            topCustomers
        });

    } catch (error) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
