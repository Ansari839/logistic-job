import { PrismaClient, Prisma } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log(`Start seeding DEMO data...`);

    const mainCompany = await prisma.company.findUnique({ where: { uniqueId: 'LOGOS-001' } });
    if (!mainCompany) throw new Error("Main Company not found. Run seed-core first.");

    const headOffice = await prisma.branch.findFirst({ where: { companyId: mainCompany.id } });
    if (!headOffice) throw new Error("Head Office not found. Run seed-core first.");
    // Clean up
    await prisma.invoiceItem.deleteMany({ where: { invoice: { job: { jobNumber: 'JOB-2025-001' } } } });
    await prisma.invoice.deleteMany({ where: { job: { jobNumber: 'JOB-2025-001' } } });
    await prisma.expense.deleteMany({ where: { job: { jobNumber: 'JOB-2025-001' } } });
    await prisma.job.deleteMany({ where: { jobNumber: 'JOB-2025-001' } });
    await prisma.customer.deleteMany({ where: { code: 'CUST-001' } });
    await prisma.vendor.deleteMany({ where: { code: 'VND001' } });

    // 1. Seed Customer
    console.log('Seeding Customer...');
    let customer;
    try {
        customer = await prisma.customer.upsert({
            where: { code: 'CUST-001' },
            update: {},
            create: {
                name: 'Global Textiles Exports',
                code: 'CUST-001',
                email: 'logistics@globaltextiles.com',
                phone: '+92-21-34567890',
                address: 'Plot 45, Korangi Industrial Area',
                companyId: mainCompany.id,
            },
        });
        console.log('🤝 Customer created:', customer.name);
    } catch (e) {
        console.error('Error seeding Customer:', e);
    }

    // 2. Seed Vendors
    console.log('Seeding Vendor...');
    try {
        await prisma.vendor.upsert({
            where: { code: 'VND001' },
            update: {},
            create: {
                name: 'Fast Track Logistics',
                code: 'VND001',
                type: 'TRANSPORT',
                companyId: mainCompany.id,
            },
        });
    } catch (e) {
        console.error('Error seeding Vendor:', e);
    }

    // 3. Seed a Job
    console.log('Seeding Job...');
    let job;
    try {
        // Ensure customer exists
        if (!customer) {
            customer = await prisma.customer.findUnique({ where: { code: 'CUST-001' } });
        }

        if (customer) {
            job = await prisma.job.upsert({
                where: { jobNumber: 'JOB-2025-001' },
                update: {
                    customerId: customer.id,
                    companyId: mainCompany.id,
                    branchId: headOffice.id,
                },
                create: {
                    jobNumber: 'JOB-2025-001',
                    jobType: 'EXPORT',
                    status: 'IN_PROGRESS',
                    date: new Date(),
                    jobDate: new Date(),
                    customerId: customer.id,
                    companyId: mainCompany.id,
                    branchId: headOffice.id,
                    vessel: 'MSC ORION',
                    commodity: 'Textiles',
                    volume: '1x40HC',
                    containerNo: 'MSCU1234567',
                },
            });
            console.log('📦 Job created/found:', job.jobNumber);
        } else {
            console.error('Customer not found, skipping Job creation');
        }
    } catch (e) {
        console.error('Error seeding Job:', e);
    }

    // 4. Create Job Expenses
    if (!job) {
        job = await prisma.job.findUnique({ where: { jobNumber: 'JOB-2025-001' } });
    }

    if (job) {
        console.log('Seeding Expenses...');
        try {
            const existingExpenses = await prisma.expense.count({ where: { jobId: job.id } });
            if (existingExpenses === 0) {
                await prisma.expense.createMany({
                    data: [
                        {
                            jobId: job.id,
                            companyId: mainCompany.id,
                            description: 'Ocean Freight Charges',
                            costPrice: 250000,
                            sellingPrice: 285000,
                            currencyCode: 'PKR'
                        },
                        {
                            jobId: job.id,
                            companyId: mainCompany.id,
                            description: 'Terminal Handling Charges (THC)',
                            costPrice: 45000,
                            sellingPrice: 55000,
                            currencyCode: 'PKR'
                        },
                        {
                            jobId: job.id,
                            companyId: mainCompany.id,
                            description: 'Documentation Fee',
                            costPrice: 5000,
                            sellingPrice: 15000,
                            currencyCode: 'PKR'
                        },
                        {
                            jobId: job.id,
                            companyId: mainCompany.id,
                            description: 'Customs Clearance Service',
                            costPrice: 12000,
                            sellingPrice: 25000,
                            currencyCode: 'PKR'
                        }
                    ]
                });
                console.log('💰 Expenses added to job');
            }
        } catch (e) {
            console.error('Error seeding Expenses:', e);
        }
    }

    console.log('✅ DEMO Seed completed');
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
