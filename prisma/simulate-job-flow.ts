import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const BASE_URL = 'http://localhost:3000';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function getAdminToken() {
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!adminUser) throw new Error('Admin user not found');

    const payload = {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        companyId: adminUser.companyId
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

async function main() {
    console.log('🚀 Starting Job/Invoice Simulation...');

    const token = await getAdminToken();
    const headers = {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${token}`
    };

    const customers = await prisma.customer.findMany({ take: 6 });
    const vendors = await prisma.vendor.findMany({ take: 3 });
    const branches = await prisma.branch.findMany({ take: 1 });

    if (customers.length < 3) throw new Error('Need at least 3 customers for simulation');

    const jobData = [
        { customer: customers[0], type: 'IMPORT', status: 'CONFIRM' },
        { customer: customers[1], type: 'EXPORT', status: 'CONFIRM' },
        { customer: customers[2], type: 'IMPORT', status: 'CONFIRM' },
        { customer: customers[0], type: 'EXPORT', status: 'DRAFT' },
        { customer: customers[1], type: 'IMPORT', status: 'DRAFT' },
        { customer: customers[2], type: 'EXPORT', status: 'DRAFT' },
    ];

    for (let i = 0; i < jobData.length; i++) {
        const item = jobData[i];
        console.log(`Creating Job ${i + 1} for ${item.customer.name}...`);

        // 1. Create Job with Expenses
        const jobRes = await fetch(`${BASE_URL}/api/jobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                jobType: item.type,
                customerId: item.customer.id,
                branchId: branches[0]?.id,
                commodity: 'Industrial Goods',
                vessel: 'MSC ORION',
                expenses: [
                    { name: 'Ocean Freight', cost: 50000, selling: 65000, vendorId: vendors[0]?.id },
                    { name: 'Port Charges', cost: 12000, selling: 15000, vendorId: vendors[1]?.id },
                    { name: 'THC', cost: 8000, selling: 10000, vendorId: vendors[2]?.id },
                ]
            })
        });

        const { job } = await jobRes.json();
        if (!job) {
            console.error(`❌ Failed to create Job ${i + 1}`);
            continue;
        }
        console.log(`✅ Job Created: ${job.jobNumber}`);

        // 2. Create Invoice
        const invRes = await fetch(`${BASE_URL}/api/invoices`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                invoiceNumber: `INV-SIM-${Date.now()}-${i}`,
                jobId: job.id,
                customerId: item.customer.id,
                totalAmount: 90000,
                grandTotal: 90000,
                items: [
                    { description: 'Logistics Services Bundle', quantity: 1, rate: 90000, amount: 90000, total: 90000 }
                ]
            })
        });

        const { invoice } = await invRes.json();
        if (!invoice) {
            console.error(`❌ Failed to create Invoice for ${job.jobNumber}`);
            continue;
        }
        console.log(`✅ Invoice Created: ${invoice.invoiceNumber} (Draft)`);

        // 3. Confirm if needed
        if (item.status === 'CONFIRM') {
            const confirmRes = await fetch(`${BASE_URL}/api/invoices`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({
                    id: invoice.id,
                    action: 'APPROVE'
                })
            });
            if (confirmRes.ok) {
                console.log(`✨ Invoice ${invoice.invoiceNumber} CONFIRMED & Ledger Posted.`);
            } else {
                const err = await confirmRes.json();
                console.error(`❌ Failed to confirm invoice: ${err.error}`);
            }
        }
    }

    console.log('✨ Simulation completed successfully.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
