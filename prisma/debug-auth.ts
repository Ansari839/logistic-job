import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log('--- DEBUG AUTH DATA ---');

    const company = await prisma.company.findUnique({
        where: { uniqueId: 'LOGOS-001' },
        include: { users: true, jobs: true }
    });

    if (company) {
        console.log(`Company: ${company.name} (ID: ${company.id})`);
        console.log(`- Linked Jobs: ${company.jobs.length}`);
        console.log(`- Linked Users: ${company.users.length}`);
        company.users.forEach(u => {
            console.log(`  > User: ${u.email} (ID: ${u.id}, Role: ${u.role})`);
        });
        if (company.jobs.length > 0) {
            console.log(`  > First Job: ${company.jobs[0].jobNumber} (ID: ${company.jobs[0].id})`);
        }
    } else {
        console.error('CRITICAL: Main Company LOGOS-001 NOT FOUND!');
    }
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
