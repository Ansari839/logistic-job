import prisma from '@/lib/prisma';
import { VoucherType } from '@prisma/client';

export async function generateVoucherNumber(companyId: number, type: VoucherType, date: Date = new Date(), tx?: any): Promise<string> {
    const client = tx || prisma;
    const year = date.getFullYear();
    const prefixMap: Record<VoucherType, string> = {
        JOURNAL: 'JV',
        PAYMENT: 'PV',
        RECEIPT: 'RV',
        CONTRA: 'CV',
    };

    const prefix = prefixMap[type] || 'VO';
    const searchPrefix = `${prefix}-${year}-`;
    console.log(`Searching for last voucher with prefix: ${searchPrefix}`);

    const lastVoucher = await client.voucher.findFirst({
        where: {
            companyId,
            voucherNumber: { startsWith: searchPrefix }
        },
        orderBy: { voucherNumber: 'desc' }
    });

    let sequence = 1;
    if (lastVoucher) {
        const parts = lastVoucher.voucherNumber.split('-');
        if (parts.length === 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) sequence = lastSeq + 1;
        }
    }

    return `${prefix}-${year}-${sequence.toString().padStart(4, '0')}`;
}
