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
    const productId = searchParams.get('productId');

    const dateFilter: any = {};
    if (startDate || endDate) {
        dateFilter.createdAt = {};
        if (startDate) dateFilter.createdAt.gte = new Date(startDate);
        if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    try {
        switch (type) {
            case 'stock-movement': {
                const movements = await prisma.stockMovement.findMany({
                    where: {
                        companyId: user.companyId,
                        ...(productId && { productId: parseInt(productId) }),
                        ...dateFilter,
                    },
                    include: {
                        product: { select: { name: true, sku: true, unit: true } },
                        warehouse: { select: { name: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                });

                return NextResponse.json({ report: movements });
            }

            case 'business-summary': {
                // Monthly Purchase vs Sales
                const purchases = await prisma.purchaseInvoice.findMany({
                    where: { companyId: user.companyId, ...dateFilter },
                    select: { grandTotal: true, createdAt: true }
                });

                const [serviceInvoices, freightInvoices] = await Promise.all([
                    prisma.serviceInvoice.findMany({
                        where: { companyId: user.companyId, status: { not: 'CANCELLED' }, ...dateFilter },
                        select: { grandTotal: true }
                    }),
                    prisma.freightInvoice.findMany({
                        where: { companyId: user.companyId, status: { not: 'CANCELLED' }, ...dateFilter },
                        select: { grandTotal: true }
                    })
                ]);

                const totalSales = serviceInvoices.reduce((sum, s) => sum + s.grandTotal, 0) +
                    freightInvoices.reduce((sum, f) => sum + f.grandTotal, 0);

                return NextResponse.json({
                    report: {
                        totalPurchases: purchases.reduce((sum, p) => sum + p.grandTotal, 0),
                        totalSales: totalSales,
                        purchaseCount: purchases.length,
                        salesCount: serviceInvoices.length + freightInvoices.length
                    }
                });
            }

            default:
                return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
        }
    } catch (error) {
        console.error('Inventory report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
