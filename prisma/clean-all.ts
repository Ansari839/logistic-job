
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

async function main() {
    console.log('Starting TOTAL CLEANUP (preserving Company/Users)...');
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('Truncating tables...');
        // Truncate relevant tables with CASCADE to handle foreign keys automatically
        const tables = [
            '"InvoiceItem"', // ServiceInvoiceItem mapped to InvoiceItem
            '"FreightInvoiceItem"',
            '"PurchaseInvoiceItem"',
            '"StockMovement"',
            '"Invoice"', // ServiceInvoice mapped to Invoice
            '"FreightInvoice"',
            '"PurchaseInvoice"',
            '"VoucherEntry"',
            '"AccountEntry"',
            '"Voucher"',
            '"Transaction"',
            '"Payment"',
            '"Expense"',
            '"Job"',
            '"AuditLog"',
            // Master Data (User asked to create new accounts, so wipe these)
            '"Customer"',
            '"Vendor"',
            '"Account"'
        ];

        // Construct TRUNCATE command
        const query = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE;`;
        console.log('Running:', query);

        await client.query(query);

        await client.query('COMMIT');
        console.log('Total Cleanup finished successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error during cleanup:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
