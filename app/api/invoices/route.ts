import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-default-secret-key-change-it'
);

import { getAuthUser } from '@/lib/auth';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId: user.companyId as number,
                ...(jobId && { jobId: parseInt(jobId) }),
            },
            include: {
                customer: { select: { name: true, code: true } },
                job: { select: { jobNumber: true } },
                items: { include: { product: { select: { name: true, unit: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error('Fetch invoices error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            invoiceNumber, jobId, customerId, type,
            totalAmount, taxAmount, grandTotal, currencyCode, items
        } = body;

        if (!invoiceNumber || !jobId || !customerId) {
            return NextResponse.json({ error: 'Invoice Number, Job, and Customer are required' }, { status: 400 });
        }

        const invoice = await prisma.$transaction(async (tx) => {
            const inv = await tx.invoice.create({
                data: {
                    invoiceNumber,
                    jobId: parseInt(jobId),
                    customerId: parseInt(customerId),
                    type: type || 'MASTER',
                    totalAmount: parseFloat(totalAmount) || 0,
                    taxAmount: parseFloat(taxAmount) || 0,
                    grandTotal: parseFloat(grandTotal) || 0,
                    currencyCode: currencyCode || 'PKR',
                    companyId: user.companyId as number,
                    items: {
                        create: items?.map((item: any) => ({
                            description: item.description,
                            quantity: parseFloat(item.quantity) || 1.0,
                            rate: parseFloat(item.rate) || 0.0,
                            amount: parseFloat(item.amount),
                            taxPercentage: parseFloat(item.taxPercentage) || 0,
                            taxAmount: parseFloat(item.taxAmount) || 0,
                            total: parseFloat(item.total),
                            productId: item.productId ? parseInt(item.productId) : null,
                        })) || []
                    }
                },
                include: { items: true }
            });

            // Handle Stock & COGS for products
            let totalCogs = 0;
            for (const item of inv.items) {
                if (item.productId) {
                    const product = await tx.product.findUnique({ where: { id: item.productId } });
                    if (product) {
                        await tx.stockMovement.create({
                            data: {
                                productId: product.id,
                                quantity: -item.quantity,
                                type: 'SALE',
                                reference: inv.invoiceNumber,
                                companyId: user.companyId as number,
                            }
                        });
                        totalCogs += item.quantity * product.purchasePrice;
                    }
                }
            }

            // Post to Accounting
            const receivableAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId as number, code: '1130' } }
            });
            const revenueAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId as number, code: '4100' } }
            });

            if (receivableAccount && revenueAccount && inv.grandTotal > 0) {
                const transaction = await tx.transaction.create({
                    data: {
                        reference: inv.invoiceNumber,
                        description: `Invoiced Job ${jobId}: ${inv.invoiceNumber}`,
                        type: 'INVOICE',
                        companyId: user.companyId as number,
                        entries: {
                            create: [
                                { accountId: receivableAccount.id, debit: inv.grandTotal, description: `Invoice ${inv.invoiceNumber}` },
                                { accountId: revenueAccount.id, credit: inv.grandTotal, description: `Service Revenue` }
                            ]
                        }
                    }
                });

                // Post COGS if products were sold
                if (totalCogs > 0) {
                    const cogsAccount = await tx.account.findUnique({
                        where: { companyId_code: { companyId: user.companyId as number, code: '5100' } }
                    });
                    const inventoryAccount = await tx.account.findUnique({
                        where: { companyId_code: { companyId: user.companyId as number, code: '1140' } }
                    });
                    if (cogsAccount && inventoryAccount) {
                        await tx.accountEntry.createMany({
                            data: [
                                { transactionId: transaction.id, accountId: cogsAccount.id, debit: totalCogs, description: 'Cost of Goods Sold' },
                                { transactionId: transaction.id, accountId: inventoryAccount.id, credit: totalCogs, description: 'Inventory Deduction' }
                            ]
                        });
                    }
                }

                await tx.invoice.update({
                    where: { id: inv.id },
                    data: { transactionId: transaction.id }
                });
            }

            return tx.invoice.findUnique({
                where: { id: inv.id },
                include: { items: true, customer: true, job: true }
            });
        });

        return NextResponse.json({ invoice });
    } catch (error: any) {
        console.error('Create invoice error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Invoice Number already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
