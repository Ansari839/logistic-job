import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { logAction } from '@/lib/security';

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            invoiceNumber, jobId, customerId,
            totalAmount, taxAmount, grandTotal, currencyCode, items,
            usdRate, exchangeRate
        } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
        }

        let finalInvoiceNumber = invoiceNumber;

        if (!finalInvoiceNumber) {
            const date = new Date();
            const year = date.getFullYear();
            const lastInvoice = await prisma.freightInvoice.findFirst({
                where: {
                    companyId: user.companyId as number,
                    invoiceNumber: { startsWith: `FIN-${year}-` }
                },
                orderBy: { invoiceNumber: 'desc' }
            });

            let sequence = 1;
            if (lastInvoice) {
                const parts = lastInvoice.invoiceNumber.split('-');
                if (parts.length === 3) {
                    const seq = parseInt(parts[2]);
                    if (!isNaN(seq)) sequence = seq + 1;
                }
            }
            finalInvoiceNumber = `FIN-${year}-${sequence.toString().padStart(4, '0')}`;
        }

        const result = await prisma.$transaction(async (tx: any) => {
            const inv = await tx.freightInvoice.create({
                data: {
                    invoiceNumber: finalInvoiceNumber,
                    jobId: jobId ? parseInt(jobId) : null,
                    customerId: parseInt(customerId),
                    usdRate: parseFloat(usdRate) || 0,
                    exchangeRate: parseFloat(exchangeRate) || 1.0,
                    totalAmount: parseFloat(totalAmount) || 0,
                    taxAmount: parseFloat(taxAmount) || 0,
                    grandTotal: parseFloat(grandTotal) || 0,
                    currencyCode: currencyCode || 'PKR',
                    companyId: user.companyId as number,
                    division: user.division,
                    items: {
                        create: items?.map((item: any) => ({
                            description: item.description,
                            quantity: parseFloat(item.quantity) || 1.0,
                            rate: parseFloat(item.rate) || 0.0,
                            amount: parseFloat(item.amount),
                            taxPercentage: parseFloat(item.taxPercentage) || 0,
                            taxAmount: parseFloat(item.taxAmount) || 0,
                            total: parseFloat(item.total),
                            usdAmount: parseFloat(item.usdAmount) || 0,
                            vendorId: item.vendorId ? parseInt(item.vendorId) : null,
                            expenseMasterId: item.expenseMasterId ? parseInt(item.expenseMasterId) : null,
                            costAccountId: item.costAccountId ? parseInt(item.costAccountId) : null,
                        })) || []
                    }
                },
                include: {
                    items: true,
                    customer: true,
                }
            });

            return inv;
        });

        await logAction({
            user,
            action: 'CREATE',
            module: 'FREIGHT_INVOICE',
            entityId: result.id,
            payload: { invoiceNumber: result.invoiceNumber, total: result.grandTotal }
        });

        return NextResponse.json({ invoice: result });
    } catch (error: any) {
        console.error('Create freight invoice error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'An invoice already exists with this number.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create freight invoice' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, action, ...updateData } = await request.json();

        const invoice = await prisma.freightInvoice.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        if (action === 'UPDATE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Cannot update approved invoice' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx: any) => {
                await tx.freightInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

                return await tx.freightInvoice.update({
                    where: { id: invoice.id },
                    data: {
                        invoiceNumber: updateData.invoiceNumber,
                        customerId: parseInt(updateData.customerId),
                        usdRate: parseFloat(updateData.usdRate) || 0,
                        exchangeRate: parseFloat(updateData.exchangeRate) || 1.0,
                        totalAmount: parseFloat(updateData.totalAmount) || 0,
                        taxAmount: parseFloat(updateData.taxAmount) || 0,
                        grandTotal: parseFloat(updateData.grandTotal) || 0,
                        currencyCode: updateData.currencyCode,
                        items: {
                            create: updateData.items?.map((item: any) => ({
                                description: item.description,
                                quantity: parseFloat(item.quantity) || 1,
                                rate: parseFloat(item.rate) || 0,
                                amount: parseFloat(item.amount),
                                taxPercentage: parseFloat(item.taxPercentage) || 0,
                                taxAmount: parseFloat(item.taxAmount) || 0,
                                total: parseFloat(item.total),
                                usdAmount: parseFloat(item.usdAmount) || 0,
                                vendorId: item.vendorId ? parseInt(item.vendorId) : null,
                                expenseMasterId: item.expenseMasterId ? parseInt(item.expenseMasterId) : null,
                                costAccountId: item.costAccountId ? parseInt(item.costAccountId) : null,
                            })) || []
                        }
                    },
                    include: { items: true }
                });
            });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'APPROVE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Invoice already approved' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx: any) => {
                const inv = await tx.freightInvoice.update({
                    where: { id: invoice.id },
                    data: { isApproved: true, approvedById: user.id, status: 'SENT' },
                    include: {
                        items: {
                            include: { expenseMaster: true, costAccount: true }
                        },
                        customer: true
                    }
                });

                // Posting for Freight Invoice
                const revenueAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '4100' } }
                });
                const costAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '5100' } }
                });
                const defaultCustomerAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '1230' } }
                });
                const defaultVendorAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '2210' } }
                });

                if (inv.grandTotal > 0 && revenueAccount && (inv.customer.accountId || defaultCustomerAccount)) {
                    // 1. Post Customer Receivable
                    const transaction = await tx.transaction.create({
                        data: {
                            reference: inv.invoiceNumber,
                            description: `Freight Invoice: ${inv.invoiceNumber} for ${inv.customer.name}`,
                            type: 'INVOICE',
                            companyId: user.companyId as number,
                            date: inv.date,
                            entries: {
                                create: [
                                    {
                                        accountId: inv.customer.accountId || defaultCustomerAccount!.id,
                                        debit: inv.grandTotal,
                                        description: `Freight Receivable: ${inv.invoiceNumber}`
                                    },
                                    ...inv.items.map((item: any) => ({
                                        accountId: revenueAccount.id,
                                        credit: item.total,
                                        description: `Freight Revenue: ${item.description}`
                                    }))
                                ]
                            }
                        }
                    });
                    await tx.freightInvoice.update({
                        where: { id: inv.id },
                        data: { transactionId: transaction.id }
                    });
                }

                // 2. Handle Item-based Cost Posting (Vendors & Expenses)
                for (const item of inv.items) {
                    if (costAccount) {
                        let targetCostAccount = item.costAccount || costAccount;

                        // If no direct account mapping, try lookup legacy way
                        if (!item.costAccountId && (item.expenseMaster || item.description)) {
                            const lookupName = item.expenseMaster?.name || item.description;
                            const specificAccount = await tx.account.findFirst({
                                where: {
                                    companyId: user.companyId as number,
                                    name: { contains: lookupName, mode: 'insensitive' },
                                    type: 'EXPENSE'
                                }
                            });
                            if (specificAccount) targetCostAccount = specificAccount;
                        }

                        let vendorAccount = defaultVendorAccount;
                        if (item.vendorId) {
                            const vendor = await tx.vendor.findUnique({ where: { id: item.vendorId } });
                            if (vendor?.accountId) {
                                const va = await tx.account.findUnique({ where: { id: vendor.accountId } });
                                if (va) vendorAccount = va;
                            } else if (vendor) {
                                const va = await tx.account.findFirst({
                                    where: { companyId: user.companyId as number, name: vendor.name }
                                });
                                if (va) vendorAccount = va;
                            }
                        }

                        if (targetCostAccount && (item.vendorId ? vendorAccount : true)) {
                            await tx.transaction.create({
                                data: {
                                    reference: `${inv.invoiceNumber}-COST-${item.id}`,
                                    description: `Cost for ${inv.customer.name} | ${item.description}`,
                                    type: 'JOURNAL',
                                    companyId: user.companyId as number,
                                    date: inv.date,
                                    entries: {
                                        create: [
                                            {
                                                accountId: targetCostAccount.id,
                                                debit: item.amount,
                                                description: `${inv.customer.name} | Cost: ${item.description}`
                                            },
                                            {
                                                accountId: item.vendorId ? (vendorAccount?.id || defaultVendorAccount!.id) : defaultVendorAccount!.id,
                                                credit: item.amount,
                                                description: `Payable for ${inv.customer.name} | ${item.description}`
                                            }
                                        ]
                                    }
                                }
                            });
                        }
                    }
                }

                return inv;
            });

            await logAction({ user, action: 'APPROVE', module: 'FREIGHT_INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'DELETE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Approved invoice cannot be deleted' }, { status: 400 });

            if (user.role !== 'ADMIN' && invoice.status !== 'DRAFT') {
                return NextResponse.json({ error: 'Only admins can delete non-draft invoices' }, { status: 403 });
            }

            await prisma.$transaction(async (tx: any) => {
                await tx.freightInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
                await tx.freightInvoice.delete({ where: { id: invoice.id } });
            });
            await logAction({ user, action: 'DELETE', module: 'FREIGHT_INVOICE', entityId: invoice.id });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Freight invoice action error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
