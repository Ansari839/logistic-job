import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- TESTING JOB CRUD ---');

    // 1. Setup Data
    const company = await prisma.company.findUnique({ where: { uniqueId: 'LOGOS-001' } });
    if (!company) throw new Error('Company not found');

    const customer = await prisma.customer.findUnique({ where: { code: 'CUST-001' } });
    if (!customer) throw new Error('Customer not found');

    const testJobNumber = 'JOB-TEST-CRUD-001';

    // Cleanup potential leftovers
    await prisma.expense.deleteMany({ where: { job: { jobNumber: testJobNumber } } });
    await prisma.job.delete({ where: { jobNumber: testJobNumber } }).catch(() => { });

    // 2. CREATE
    console.log('1. Testing CREATE...');
    const newJob = await prisma.job.create({
        data: {
            jobNumber: testJobNumber,
            jobType: 'EXPORT',
            status: 'DRAFT',
            date: new Date(),
            jobDate: new Date(),
            customerId: customer.id,
            companyId: company.id,
            commodity: 'Test Commodity',
            volume: '1x20GP',
        }
    });
    console.log(`   ✅ Created Job ID: ${newJob.id} (${newJob.jobNumber})`);

    // 3. READ
    console.log('2. Testing READ...');
    const fetchedJob = await prisma.job.findUnique({ where: { id: newJob.id } });
    if (!fetchedJob) throw new Error('Failed to fetch job');
    console.log(`   ✅ Fetched Job: ${fetchedJob.commodity}`);

    // 4. UPDATE
    console.log('3. Testing UPDATE...');
    const updatedJob = await prisma.job.update({
        where: { id: newJob.id },
        data: { status: 'IN_PROGRESS', vessel: 'TEST VESSEL' }
    });
    if (updatedJob.status !== 'IN_PROGRESS' || updatedJob.vessel !== 'TEST VESSEL') {
        throw new Error('Update failed');
    }
    console.log(`   ✅ Updated Status: ${updatedJob.status}, Vessel: ${updatedJob.vessel}`);

    // 5. DELETE
    console.log('4. Testing DELETE...');
    await prisma.job.delete({ where: { id: newJob.id } });

    const deletedJob = await prisma.job.findUnique({ where: { id: newJob.id } });
    if (deletedJob) throw new Error('Delete failed - Job still exists');
    console.log('   ✅ Deleted Job successfully');

}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ CRUD TEST FAILED:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
