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

        const result = await prisma.$transaction(async (tx) => {
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
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, action, ...updateData } = await request.json();

        const invoice = await prisma.invoice.findUnique({
            where: { id: parseInt(id) },
            include: { items: true }
        });
        if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

        if (action === 'UPDATE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Cannot update approved invoice' }, { status: 400 });

            const updated = await prisma.$transaction(async (tx) => {
                await tx.invoiceItem.deleteMany({ where: { invoiceId: invoice.id } });

                return await tx.invoice.update({
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

                const inv = await tx.invoice.update({
                    where: { id: invoice.id },
                    data: { isApproved: false, approvedById: null, transactionId: null }
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
                const inv = await tx.invoice.update({
                    where: { id: parseInt(id) },
                    data: { isApproved: true, approvedById: user.id },
                    include: { customer: true, job: true }
                });

                if (inv.grandTotal > 0) {
                    // 1. Find Customer Specific Account (e.g. "Customer Name (123x)")
                    // If not found, fall back to generic Accounts Receivable (1230)
                    let customerAccount = await tx.account.findFirst({
                        where: {
                            companyId: user.companyId as number,
                            name: inv.customer.name,
                            parentId: { not: null } // Should be under 1230
                        }
                    });

                    if (!customerAccount) {
                        customerAccount = await tx.account.findUnique({
                            where: { companyId_code: { companyId: user.companyId as number, code: '1230' } }
                        });
                    }

                    const revenueAccount = await tx.account.findUnique({
                        where: { companyId_code: { companyId: user.companyId as number, code: '4100' } }
                    });

                    if (customerAccount && revenueAccount) {
                        const transaction = await tx.transaction.create({
                            data: {
                                reference: inv.invoiceNumber,
                                description: `Invoiced Job ${inv.job.jobNumber}: ${inv.invoiceNumber} for ${inv.customer.name}`,
                                type: 'INVOICE',
                                companyId: user.companyId as number,
                                entries: {
                                    create: [
                                        { accountId: customerAccount.id, debit: inv.grandTotal, description: `Invoice ${inv.invoiceNumber} amount receivable` },
                                        { accountId: revenueAccount.id, credit: inv.grandTotal, description: `Service Revenue from Job ${inv.job.jobNumber}` }
                                    ]
                                }
                            }
                        });
                        await tx.invoice.update({
                            where: { id: inv.id },
                            data: { transactionId: transaction.id }
                        });
                    }
                }

                // 2. Handle Job Expenses (Cost of Service vs Vendor Payable)
                const jobExpenses = await tx.expense.findMany({
                    where: { jobId: inv.jobId, companyId: user.companyId as number },
                    include: { vendor: true }
                });

                const costAccount = await tx.account.findUnique({
                    where: { companyId_code: { companyId: user.companyId as number, code: '5100' } } // Direct Cost
                });

                for (const exp of jobExpenses) {
                    if (exp.costPrice > 0) {
                        // Find Vendor Specific Account (e.g. "Vendor Name (221x)")
                        // If not found, fall back to generic Accounts Payable (2210)
                        let vendorAccount;
                        if (exp.vendor) {
                            vendorAccount = await tx.account.findFirst({
                                where: {
                                    companyId: user.companyId as number,
                                    name: exp.vendor.name,
                                    parentId: { not: null } // Should be under 2210
                                }
                            });
                        }

                        if (!vendorAccount) {
                            vendorAccount = await tx.account.findUnique({
                                where: { companyId_code: { companyId: user.companyId as number, code: '2210' } }
                            });
                        }

                        if (costAccount && vendorAccount) {
                            await tx.transaction.create({
                                data: {
                                    reference: `EXP-${exp.id}`,
                                    description: `Job ${inv.job.jobNumber} Expense: ${exp.description}`,
                                    type: 'JOURNAL',
                                    companyId: user.companyId as number,
                                    entries: {
                                        create: [
                                            { accountId: costAccount.id, debit: exp.costPrice, description: `Direct Cost: ${exp.description} for Job ${inv.job.jobNumber}` },
                                            { accountId: vendorAccount.id, credit: exp.costPrice, description: `Payable to ${exp.vendor?.name || 'Vendor'} for ${exp.description}` }
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
            }, { timeout: 20000 });

            await logAction({ user, action: 'APPROVE', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'LOCK') {
            const updated = await prisma.invoice.update({
                where: { id: invoice.id },
                data: { isLocked: true, lockedAt: new Date() }
            });
            await logAction({ user, action: 'LOCK', module: 'INVOICE', entityId: invoice.id });
            return NextResponse.json({ invoice: updated });
        }

        if (action === 'DELETE') {
            if (invoice.isApproved) return NextResponse.json({ error: 'Approved invoice cannot be deleted' }, { status: 400 });
            if (invoice.isLocked) return NextResponse.json({ error: 'Locked document cannot be deleted' }, { status: 400 });

            await prisma.invoice.delete({ where: { id: invoice.id } });
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
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id } = await request.json();
        const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(id) } });

        if (!invoice || invoice.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.isApproved) return NextResponse.json({ error: 'Approved invoice cannot be deleted' }, { status: 400 });
        if (invoice.isLocked) return NextResponse.json({ error: 'Locked document cannot be deleted' }, { status: 400 });

        await prisma.invoice.delete({ where: { id: invoice.id } });
        await logAction({ user, action: 'DELETE', module: 'INVOICE', entityId: invoice.id });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete invoice error detail:', error);
        return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
}
