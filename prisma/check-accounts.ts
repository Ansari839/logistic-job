import { PrismaClient } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Checking Critical Accounts...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ Company not found');
        return;
    }

    const codesToCheck = ['1230', '1130', '2210', '2110', '4100', '5100', '5000'];

    for (const code of codesToCheck) {
        const acc = await prisma.account.findUnique({
            where: { companyId_code: { companyId: company.id, code } }
        });
        if (acc) {
            console.log(`✅ Found ${code}: ${acc.name}`);
        } else {
            console.log(`❌ MISSING ${code}`);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
