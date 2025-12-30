import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const purchaseSchema = z.object({
    purchaseNumber: z.string().min(1),
    date: z.string().optional(),
    vendorId: z.number(),
    currencyCode: z.string().default('PKR'),
    items: z.array(z.object({
        productId: z.number(),
        description: z.string().optional(),
        quantity: z.number().positive(),
        rate: z.number().nonnegative(),
        taxPercentage: z.number().default(0),
    })),
});

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');

    try {
        const purchases = await prisma.purchaseInvoice.findMany({
            where: {
                companyId: user.companyId,
                ...(vendorId && { vendorId: parseInt(vendorId) }),
            },
            include: {
                vendor: { select: { name: true, code: true } },
                items: { include: { product: { select: { name: true, unit: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ purchases });
    } catch (error) {
        console.error('Fetch purchases error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { purchaseNumber, date, vendorId, currencyCode, items } = purchaseSchema.parse(body);

        const purchase = await prisma.$transaction(async (tx) => {
            // 1. Calculate totals
            let totalAmount = 0;
            let totalTax = 0;
            const preparedItems = items.map(item => {
                const amount = item.quantity * item.rate;
                const taxAmount = (amount * item.taxPercentage) / 100;
                totalAmount += amount;
                totalTax += taxAmount;
                return {
                    productId: item.productId,
                    description: item.description,
                    quantity: item.quantity,
                    rate: item.rate,
                    amount: amount,
                    taxPercentage: item.taxPercentage,
                    taxAmount: taxAmount,
                    total: amount + taxAmount
                };
            });

            const grandTotal = totalAmount + totalTax;

            // 2. Create Purchase Invoice
            const pi = await tx.purchaseInvoice.create({
                data: {
                    purchaseNumber,
                    date: date ? new Date(date) : new Date(),
                    vendorId,
                    companyId: user.companyId as number,
                    totalAmount,
                    taxAmount: totalTax,
                    grandTotal,
                    currencyCode,
                    items: { create: preparedItems }
                }
            });

            // 3. Update Stock & record movements
            for (const item of preparedItems) {
                await tx.stockMovement.create({
                    data: {
                        productId: item.productId,
                        quantity: item.quantity,
                        type: 'PURCHASE',
                        reference: pi.purchaseNumber,
                        companyId: user.companyId as number,
                    }
                });
            }

            // 4. Post to Accounting
            const inventoryAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId as number, code: '1140' } }
            });
            const payableAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId as number, code: '2110' } }
            });

            if (inventoryAccount && payableAccount && grandTotal > 0) {
                const transaction = await tx.transaction.create({
                    data: {
                        reference: pi.purchaseNumber,
                        description: `Purchase from Vendor ID ${vendorId}: ${pi.purchaseNumber}`,
                        type: 'PURCHASE',
                        companyId: user.companyId as number,
                        entries: {
                            create: [
                                { accountId: inventoryAccount.id, debit: totalAmount, description: `Inventory Purchase ${pi.purchaseNumber}` },
                                { accountId: payableAccount.id, credit: grandTotal, description: `Payable to Vendor` }
                            ]
                        }
                    }
                });

                // Add tax entry if applicable
                if (totalTax > 0) {
                    const taxAccount = await tx.account.findUnique({
                        where: { companyId_code: { companyId: user.companyId as number, code: '2310' } } // Purchase Tax / Input Tax
                    });
                    if (taxAccount) {
                        await tx.accountEntry.create({
                            data: {
                                transactionId: transaction.id,
                                accountId: taxAccount.id,
                                debit: totalTax,
                                description: 'Input Tax on Purchase'
                            }
                        });
                    }
                }

                await tx.purchaseInvoice.update({
                    where: { id: pi.id },
                    data: { transactionId: transaction.id }
                });
            }

            return pi;
        });

        return NextResponse.json({ purchase });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: 'Purchase number already exists' }, { status: 400 });
        }
        console.error('Create purchase error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
