import 'dotenv/config';
import prisma from '../lib/prisma';

async function main() {
    console.log('🚀 Starting data cleanup for Jobs and Invoices...');

    try {
        // 1. Delete Items and Expenses first (Child records)
        console.log('🗑️ Deleting Service Invoice Items...');
        await prisma.serviceInvoiceItem.deleteMany({});

        console.log('🗑️ Deleting Freight Invoice Items...');
        await prisma.freightInvoiceItem.deleteMany({});

        console.log('🗑️ Deleting Expenses...');
        await prisma.expense.deleteMany({});

        // 2. Delete Invoices
        console.log('🗑️ Deleting Service Invoices...');
        await prisma.serviceInvoice.deleteMany({});

        console.log('🗑️ Deleting Freight Invoices...');
        await prisma.freightInvoice.deleteMany({});

        // 3. Delete Jobs
        console.log('🗑️ Deleting Jobs...');
        await prisma.job.deleteMany({});

        // 4. Cleanup Transactions and Account Entries related to Invoices
        // Note: Since we are clearing ALL job data, we might want to clear 
        // transactions that were automatically generated for these invoices.
        // These usually have a reference to the invoice or a specific type.

        console.log('🗑️ Deleting Transactions related to Invoices/Jobs...');
        // We can target transactions where service/freight/purchase/payment relations are cleared or just by type
        await prisma.accountEntry.deleteMany({
            where: {
                transaction: {
                    OR: [
                        { type: 'JOURNAL' }, // Many job related transactions are JOUNAL type
                        { type: 'INVOICE' }
                    ]
                }
            }
        });

        await prisma.transaction.deleteMany({
            where: {
                OR: [
                    { type: 'JOURNAL' },
                    { type: 'INVOICE' }
                ]
            }
        });

        console.log('🗑️ Deleting Stock Movements...');
        await prisma.stockMovement.deleteMany({});

        console.log('✅ Cleanup completed successfully!');
    } catch (error) {
        console.error('❌ Error during cleanup:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
