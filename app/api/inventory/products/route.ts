import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const productSchema = z.object({
    name: z.string().min(1),
    sku: z.string().optional(),
    description: z.string().optional(),
    unit: z.string(),
    purchasePrice: z.number().default(0),
    sellingPrice: z.number().default(0),
    categoryId: z.number(),
    initialStock: z.number().optional(),
    warehouseId: z.number().optional(),
});

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const products = await prisma.product.findMany({
            where: { companyId: user.companyId, deletedAt: null },
            include: {
                category: { select: { name: true } },
                _count: { select: { movements: true } }
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ products });
    } catch (error) {
        console.error('Fetch products error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, sku, description, unit, purchasePrice, sellingPrice, categoryId, initialStock, warehouseId } = productSchema.parse(body);

        const product = await prisma.$transaction(async (tx) => {
            const p = await tx.product.create({
                data: {
                    name, sku, description, unit, purchasePrice, sellingPrice, categoryId,
                    companyId: user.companyId as number,
                },
            });

            if (initialStock && initialStock > 0) {
                // 1. Record stock movement
                await tx.stockMovement.create({
                    data: {
                        productId: p.id,
                        warehouseId: warehouseId || null,
                        quantity: initialStock,
                        type: 'ADJUSTMENT',
                        reference: 'Opening Stock',
                        companyId: user.companyId as number,
                    }
                });

                // 2. Post to Accounting (Debit Inventory, Credit Opening Balance/Equity)
                const inventoryAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '1140' } }
                });
                const equityAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '3000' } } // Retained Earnings or Capital
                });

                if (inventoryAccount && equityAccount) {
                    const value = initialStock * purchasePrice;
                    if (value > 0) {
                        await tx.transaction.create({
                            data: {
                                reference: `OPN-${p.id}`,
                                description: `Opening Stock for ${p.name}`,
                                type: 'JOURNAL',
                                companyId: user.companyId as number,
                                entries: {
                                    create: [
                                        { accountId: inventoryAccount.id, debit: value, description: 'Opening Stock Value' },
                                        { accountId: equityAccount.id, credit: value, description: 'Opening Balance Offset' }
                                    ]
                                }
                            }
                        });
                    }
                }
            }

            return p;
        });

        return NextResponse.json({ product });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        console.error('Create product error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
export async function DELETE(request: Request) {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        await prisma.product.update({
            where: { id: parseInt(id), companyId: user.companyId as number },
            data: { deletedAt: new Date() }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete product error:', error);
        return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
}
