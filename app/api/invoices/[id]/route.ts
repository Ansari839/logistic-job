import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    try {
        let invoice: any = null;

        if (category === 'SERVICE' || !category) {
            invoice = await prisma.serviceInvoice.findUnique({
                where: { id: parseInt(id), companyId: user.companyId as number },
                include: {
                    customer: true,
                    job: true,
                    items: { include: { product: true } },
                    company: true
                }
            });
            if (invoice) invoice.category = 'SERVICE';
        }

        if (!invoice && (category === 'FREIGHT' || !category)) {
            invoice = await prisma.freightInvoice.findUnique({
                where: { id: parseInt(id), companyId: user.companyId as number },
                include: {
                    customer: true,
                    job: true,
                    items: { include: { vendor: true, costAccount: true } },
                    company: true
                }
            });
            if (invoice) invoice.category = 'FREIGHT';
        }

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Fetch invoice error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (body.action !== 'sync') {
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            let invoice: any = null;
            let type: 'SERVICE' | 'FREIGHT' = 'SERVICE';

            // 1. Detect and Fetch Invoice
            if (category === 'SERVICE' || !category) {
                invoice = await tx.serviceInvoice.findUnique({
                    where: { id: parseInt(id), companyId: user.companyId as number },
                    include: { job: { include: { expenses: true } } }
                });
                if (invoice) type = 'SERVICE';
            }

            if (!invoice && (category === 'FREIGHT' || !category)) {
                invoice = await tx.freightInvoice.findUnique({
                    where: { id: parseInt(id), companyId: user.companyId as number },
                    include: { job: { include: { expenses: { include: { vendor: true } } } } }
                });
                if (invoice) type = 'FREIGHT';
            }

            if (!invoice) throw new Error('Invoice not found');
            if (invoice.isApproved) throw new Error('Cannot sync an approved invoice');
            if (!invoice.job) throw new Error('Invoice is not linked to a job');

            // 2. Fetch Settings
            const settings = await tx.systemSetting.findMany({
                where: { companyId: user.companyId as number }
            });
            const settingsMap = settings.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});

            // 3. Re-calculate Items
            const newItems: any[] = [];
            const containerCount = invoice.job.containerNo ? invoice.job.containerNo.split(',').filter((x: string) => x.trim()).length : 0;
            const targetCategory = (type === 'SERVICE' && invoice.serviceCategory === 'SALES_TAX') ? 'SERVICE' : 'FREIGHT';

            if (type === 'SERVICE') {
                if (invoice.serviceCategory === 'SALES_TAX' && containerCount > 0) {
                    const rate = parseFloat(settingsMap.serviceCharges || '2000');
                    const taxPerc = parseFloat(settingsMap.serviceTaxRate || '13');
                    const amount = containerCount * rate;
                    const taxAmount = (amount * taxPerc) / 100;

                    newItems.push({
                        description: `Service Charges | ${containerCount} Containers`,
                        quantity: containerCount,
                        rate: rate,
                        amount: amount,
                        taxPercentage: taxPerc,
                        taxAmount: taxAmount,
                        total: amount + taxAmount
                    });
                }

                const relevantExpenses = invoice.job.expenses.filter((e: any) =>
                    e.invoiceCategory === targetCategory ||
                    (targetCategory === 'SERVICE' && !e.invoiceCategory)
                );
                relevantExpenses.forEach((exp: any) => {
                    newItems.push({
                        description: exp.description,
                        quantity: 1,
                        rate: exp.sellingPrice,
                        amount: exp.sellingPrice,
                        taxPercentage: 0,
                        taxAmount: 0,
                        total: exp.sellingPrice
                    });
                });

                await tx.serviceInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
            } else {
                const relevantExpenses = invoice.job.expenses.filter((e: any) => e.invoiceCategory === 'FREIGHT');
                relevantExpenses.forEach((exp: any) => {
                    newItems.push({
                        description: exp.description,
                        quantity: 1,
                        rate: exp.sellingPrice,
                        usdAmount: (exp as any).usdAmount || 0,
                        amount: exp.sellingPrice,
                        taxPercentage: 0,
                        taxAmount: 0,
                        total: exp.sellingPrice,
                        vendorId: exp.vendorId
                    });
                });

                await tx.freightInvoiceItem.deleteMany({ where: { invoiceId: invoice.id } });
            }

            const totalAmount = newItems.reduce((sum, item) => sum + item.amount, 0);
            const taxAmount = newItems.reduce((sum, item) => sum + item.taxAmount, 0);
            const grandTotal = totalAmount + taxAmount;

            const updateProps = {
                where: { id: invoice.id },
                data: {
                    totalAmount,
                    taxAmount,
                    grandTotal,
                    items: { create: newItems }
                },
                include: { items: true, customer: true, job: true, company: true }
            };

            const updatedInvoice = type === 'SERVICE'
                ? await tx.serviceInvoice.update(updateProps)
                : await tx.freightInvoice.update(updateProps);

            if (type === 'SERVICE') (updatedInvoice as any).category = 'SERVICE';
            else (updatedInvoice as any).category = 'FREIGHT';

            return updatedInvoice;
        });

        return NextResponse.json({ invoice: result });
    } catch (error: any) {
        console.error('Sync invoice error:', error);
        return NextResponse.json({ error: error.message || 'Failed to sync invoice' }, { status: 500 });
    }
}
