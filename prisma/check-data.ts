
import { PrismaClient } from '../app/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Checking Data Counts...');

    const jobs = await prisma.job.count();
    const serviceInvoices = await prisma.serviceInvoice.count();
    const freightInvoices = await prisma.freightInvoice.count();
    const transactions = await prisma.transaction.count();

    console.log(`Jobs: ${jobs}`);
    console.log(`ServiceInvoices: ${serviceInvoices}`);
    console.log(`FreightInvoices: ${freightInvoices}`);
    console.log(`Transactions: ${transactions}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
