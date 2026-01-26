import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const warehouseId = searchParams.get('warehouseId');

    try {
        // 1. Fetch all products for the company
        const products = await prisma.product.findMany({
            where: { companyId: user.companyId },
            include: { category: { select: { name: true } } },
        });

        // 2. Fetch stock movements and aggregate
        const stockReport = await Promise.all(products.map(async (product: any) => {
            const movements = await prisma.stockMovement.aggregate({
                where: {
                    productId: product.id,
                    ...(warehouseId && { warehouseId: parseInt(warehouseId) }),
                },
                _sum: { quantity: true },
            });

            const currentStock = movements._sum.quantity || 0;
            const valuation = currentStock * product.purchasePrice;

            return {
                id: product.id,
                name: product.name,
                sku: product.sku,
                unit: product.unit,
                category: product.category.name,
                purchasePrice: product.purchasePrice,
                sellingPrice: product.sellingPrice,
                currentStock,
                valuation,
            };
        }));

        return NextResponse.json({
            report: stockReport,
            totalValuation: stockReport.reduce((sum: any, item: any) => sum + item.valuation, 0)
        });
    } catch (error) {
        console.error('Fetch stock report error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
