import prisma from '@/lib/prisma';

export async function generateInvoiceNumber(companyId: number, type: 'SERVICE' | 'FREIGHT', date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const prefix = type === 'SERVICE' ? 'SIN' : 'FIN';
    const searchPrefix = `${prefix}-${year}-`;

    let lastInvoice;
    if (type === 'SERVICE') {
        lastInvoice = await prisma.serviceInvoice.findFirst({
            where: {
                companyId,
                invoiceNumber: { startsWith: searchPrefix }
            },
            orderBy: { invoiceNumber: 'desc' }
        });
    } else {
        lastInvoice = await prisma.freightInvoice.findFirst({
            where: {
                companyId,
                invoiceNumber: { startsWith: searchPrefix }
            },
            orderBy: { invoiceNumber: 'desc' }
        });
    }

    let sequence = 1;
    if (lastInvoice) {
        const parts = lastInvoice.invoiceNumber.split('-');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }
    }

    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
}
