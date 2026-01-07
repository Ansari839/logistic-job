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
                    items: { include: { vendor: true } },
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
