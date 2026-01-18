import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { logAction, isPeriodClosed } from '@/lib/security';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    try {
        const [serviceInvoices, freightInvoices] = await Promise.all([
            prisma.serviceInvoice.findMany({
                where: {
                    companyId: user.companyId as number,
                    division: user.division,
                    ...(jobId && { jobId: parseInt(jobId) }),
                },
                include: {
                    customer: { select: { name: true, code: true } },
                    job: { select: { jobNumber: true, containerNo: true, customer: { select: { name: true, code: true } } } },
                    items: { include: { product: { select: { name: true, unit: true } } } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.freightInvoice.findMany({
                where: {
                    companyId: user.companyId as number,
                    division: user.division,
                    ...(jobId && { jobId: parseInt(jobId) }),
                },
                include: {
                    customer: { select: { name: true, code: true, taxNumber: true, address: true } },
                    job: { select: { jobNumber: true, customer: { select: { name: true, code: true } } } },
                    items: { include: { vendor: { select: { name: true } } } },
                },
                orderBy: { createdAt: 'desc' },
            })
        ]);

        // Add a category field to distinguish them in the UI
        const combined = [
            ...serviceInvoices.map(inv => ({ ...inv, category: 'SERVICE' })),
            ...freightInvoices.map(inv => ({ ...inv, category: 'FREIGHT' }))
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ invoices: combined });
    } catch (error) {
        console.error('Fetch Combined Invoices error:', error);
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

        const result = await prisma.$transaction(async (tx) => {
            const inv = await tx.serviceInvoice.create({
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
                            productId: item.productId ? parseInt(item.productId) : null,
                        })) || []
                    }
                },
                include: {
                    items: true,
                    customer: true,
                    job: true
                }
            });

            // Handle Stock Movements
            for (const item of inv.items) {
                if (item.productId) {
                    await tx.stockMovement.create({
                        data: {
                            productId: item.productId,
                            quantity: -item.quantity,
                            type: 'SALE',
                            reference: inv.invoiceNumber,
                            companyId: user.companyId as number,
                        }
                    });
                }
            }

            return inv;
        });

        // Audit Logging (Outside Transaction)
        await logAction({
            user,
            action: 'CREATE',
            module: 'INVOICE',
            entityId: result.id,
            payload: { invoiceNumber: result.invoiceNumber, total: result.grandTotal }
        });

        return NextResponse.json({ invoice: result });
    } catch (error: any) {
        console.error('Create invoice error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'An invoice already exists for this job or number.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, action, ...updateData } = await request.json();

        const invoice = await prisma.serviceInvoice.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        if (action === 'UPDATE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Cannot update approved invoice' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx) => {
                await tx.serviceInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

                return await tx.serviceInvoice.update({
                    where: { id: invoice.id },
                    data: {
                        invoiceNumber: updateData.invoiceNumber,
                        status: updateData.status,
                        type: updateData.type,
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
                                productId: item.productId ? parseInt(item.productId) : null,
                            })) || []
                        }
                    },
                    include: { items: true }
                });
            });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'REVERT_TO_DRAFT') {
            if (!invoice.isApproved) return NextResponse.json({ error: 'Invoice is already in draft status' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx) => {
                if (invoice.transactionId) {
                    await tx.transaction.delete({ where: { id: invoice.transactionId } });
                }

                const expenses = await tx.expense.findMany({ where: { jobId: invoice.jobId } });
                const expRefs = expenses.map(e => `EXP-${e.id}`);
                await tx.transaction.deleteMany({
                    where: {
                        companyId: user.companyId as number,
                        reference: { in: expRefs }
                    }
                });

                const inv = await tx.serviceInvoice.update({
                    where: { id: invoice.id },
                    data: { isApproved: false, approvedById: null, transactionId: null, status: 'DRAFT' }
                });

                await tx.job.update({
                    where: { id: invoice.jobId },
                    data: { status: 'IN_PROGRESS' }
                });

                return inv;
            });

            await logAction({ user, action: 'REVERT_TO_DRAFT', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'APPROVE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Invoice is already approved' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx) => {
                const inv = await tx.serviceInvoice.update({
                    where: { id: parseInt(id) },
                    data: { isApproved: true, approvedById: user.id, status: 'SENT' },
                    include: {
                        customer: true,
                        job: { include: { customer: true } },
                        items: true
                    }
                });

                if (inv.grandTotal > 0) {
                    // 1. Fetch Key Accounts
                    const revenueAccount = await tx.account.findUnique({
                        where: { companyId_code: { companyId: user.companyId as number, code: '4100' } }
                    });

                    let customerAccount = null;
                    if (inv.customer.accountId) {
                        customerAccount = await tx.account.findUnique({ where: { id: inv.customer.accountId } });
                    }

                    if (!customerAccount) {
                        customerAccount = await tx.account.findFirst({
                            where: {
                                companyId: user.companyId as number,
                                name: inv.customer.name,
                                parentId: { not: null }
                            }
                        });
                    }

                    if (!customerAccount) {
                        customerAccount = await tx.account.findUnique({
                            where: { companyId_code: { companyId: user.companyId as number, code: '1230' } }
                        });
                    }

                    if (customerAccount && revenueAccount) {
                        const containerInfo = inv.job.containerNo ? ` | Cont: ${inv.job.containerNo}` : '';
                        const transaction = await tx.transaction.create({
                            data: {
                                reference: inv.invoiceNumber,
                                description: `Invoiced Job ${inv.job.jobNumber}: ${inv.invoiceNumber} for ${inv.customer.name}${containerInfo}`,
                                type: 'INVOICE',
                                companyId: user.companyId as number,
                                date: inv.date,
                                entries: {
                                    create: [
                                        {
                                            accountId: customerAccount.id,
                                            debit: inv.grandTotal,
                                            description: `Invoice ${inv.invoiceNumber}: Overall receivable amount for ${inv.job.jobNumber}`
                                        },
                                        ...inv.items.map(item => ({
                                            accountId: revenueAccount.id,
                                            credit: item.total,
                                            description: `Revenue: ${item.description} for ${inv.job.jobNumber}${containerInfo}`
                                        }))
                                    ]
                                }
                            }
                        });
                        await tx.serviceInvoice.update({
                            where: { id: inv.id },
                            data: { transactionId: transaction.id }
                        });
                    }
                }

                // 2. Handle Job Cost Posting (Expenses)
                const jobExpenses = await tx.expense.findMany({
                    where: { jobId: inv.jobId, companyId: user.companyId as number },
                    include: { vendor: true }
                });

                const costAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '5100' } }
                });

                for (const exp of jobExpenses) {
                    if (exp.costPrice > 0) {
                        let vendorAccount = null;
                        if (exp.vendor?.accountId) {
                            vendorAccount = await tx.account.findUnique({ where: { id: exp.vendor.accountId } });
                        }

                        if (!vendorAccount && exp.vendor) {
                            vendorAccount = await tx.account.findFirst({
                                where: {
                                    companyId: user.companyId as number,
                                    name: exp.vendor.name,
                                    parentId: { not: null }
                                }
                            });
                        }

                        if (!vendorAccount) {
                            vendorAccount = await tx.account.findUnique({
                                where: { companyId_code: { companyId: user.companyId as number, code: '2210' } }
                            });
                        }

                        if (costAccount && vendorAccount) {
                            const containerInfo = inv.job.containerNo ? ` | Cont: ${inv.job.containerNo}` : '';
                            await tx.transaction.create({
                                data: {
                                    reference: `EXP-${exp.id}`,
                                    description: `Expense Allocation - Job ${inv.job.jobNumber}: ${exp.description}${containerInfo}`,
                                    type: 'JOURNAL',
                                    companyId: user.companyId as number,
                                    date: inv.date,
                                    entries: {
                                        create: [
                                            {
                                                accountId: costAccount.id,
                                                debit: exp.costPrice,
                                                description: `Service Cost: ${exp.description} for Job ${inv.job.jobNumber}${containerInfo}`
                                            },
                                            {
                                                accountId: vendorAccount.id,
                                                credit: exp.costPrice,
                                                description: `Payable to ${exp.vendor?.name || 'Vendor'} for Job ${inv.job.jobNumber}`
                                            }
                                        ]
                                    }
                                }
                            });
                        }
                    }
                }

                await tx.job.update({
                    where: { id: inv.jobId },
                    data: { status: 'CLOSED' }
                });

                return inv;
            }, { timeout: 30000 });

            await logAction({ user, action: 'APPROVE', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'LOCK') {
            const updated = await prisma.serviceInvoice.update({
                where: { id: invoice.id },
                data: { isLocked: true, lockedAt: new Date() }
            });
            await logAction({ user, action: 'LOCK', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'DELETE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Approved invoice cannot be deleted' }, { status: 400 });
            if (invoice.isLocked) return NextResponse.json({ error: 'Locked document cannot be deleted' }, { status: 400 });

            // Ensure only admins can delete approved/locked or if they are not the owner (though draft check is primary)
            if (user.role !== 'ADMIN' && invoice.status !== 'DRAFT') {
                return NextResponse.json({ error: 'Only admins can delete non-draft invoices' }, { status: 403 });
            }

            await prisma.$transaction(async (tx) => {
                await tx.stockMovement.deleteMany({ where: { reference: invoice.invoiceNumber, companyId: user.companyId as number } });
                await tx.serviceInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
                await tx.serviceInvoice.delete({ where: { id: invoice.id } });
            });
            await logAction({ user, action: 'DELETE', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        console.error('Invoice action error detail:', JSON.stringify(error, null, 2));
        if (error.code === 'P2002') {
            const field = error.meta?.target || 'Record';
            return NextResponse.json({ error: `Conflict: ${field} already exists. (Each Job can have only ONE invoice).` }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        const invoice = await prisma.serviceInvoice.findUnique({ where: { id: parseInt(id) } });

        if (!invoice || invoice.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.isApproved) return NextResponse.json({ error: 'Approved invoice cannot be deleted' }, { status: 400 });
        if (invoice.isLocked) return NextResponse.json({ error: 'Locked document cannot be deleted' }, { status: 400 });

        if (user.role !== 'ADMIN' && invoice.status !== 'DRAFT') {
            return NextResponse.json({ error: 'Only admins can delete non-draft invoices' }, { status: 403 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.stockMovement.deleteMany({ where: { reference: invoice.invoiceNumber, companyId: user.companyId as number } });
            await tx.serviceInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
            await tx.serviceInvoice.delete({ where: { id: invoice.id } });
        });
        await logAction({ user, action: 'DELETE', module: 'INVOICE', entityId: invoice.id });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete invoice error detail:', error);
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
}
