import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log(`Start seeding LOGISTICS EXPENSES...`);

    const company = await prisma.company.findFirst({
        where: { uniqueId: 'LOGOS-001' }
    });

    if (!company) {
        console.error('Company not found. Please run seed-core first.');
        process.exit(1);
    }

    const expenses = [
        { code: 'OF', name: 'Ocean Freight' },
        { code: 'THC', name: 'Terminal Handling Charges' },
        { code: 'CC', name: 'Customs Clearance' },
        { code: 'DOC', name: 'Documentation Fee' },
        { code: 'BL', name: 'Bill of Lading Fee' },
        { code: 'DO', name: 'Delivery Order Fee' },
        { code: 'STR', name: 'Port Storage' },
        { code: 'DEM', name: 'Demurrage' },
        { code: 'DET', name: 'Detention' },
        { code: 'TRK', name: 'Trucking / Transportation' },
        { code: 'SCN', name: 'Container Scanning' },
        { code: 'WGH', name: 'Weighbridge Charges' },
        { code: 'AGC', name: 'Agency Commission' },
        { code: 'FSC', name: 'Fuel Surcharge' },
        { code: 'LND', name: 'Loading / Unloading' },
    ];

    for (const exp of expenses) {
        await prisma.expenseMaster.upsert({
            where: {
                companyId_code: {
                    companyId: company.id,
                    code: exp.code
                }
            },
            update: { name: exp.name },
            create: {
                ...exp,
                companyId: company.id
            }
        });
        console.log(`Created/Updated expense: ${exp.name} (${exp.code})`);
    }

    console.log('✅ Logistics Expenses Seed completed');
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
