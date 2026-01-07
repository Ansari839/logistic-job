import prisma from '@/lib/prisma';
import { VoucherType } from '@/app/generated/prisma';

export async function generateVoucherNumber(companyId: number, type: VoucherType, date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const prefixMap: Record<VoucherType, string> = {
        JOURNAL: 'JV',
        PAYMENT: 'PV',
        RECEIPT: 'RV',
        CONTRA: 'CV',
    };

    const prefix = prefixMap[type] || 'VO';
    const searchPrefix = `${prefix}-${year}-`;

    const lastVoucher = await prisma.voucher.findFirst({
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
