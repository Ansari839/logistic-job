import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function check() {
    const company = await prisma.company.findUnique({ where: { uniqueId: 'LOGOS-001' } });
    if (!company) {
        console.log("Company not found");
        return;
    }
    const accounts = await prisma.account.findMany({
        where: { companyId: company.id, code: { in: ['1230', '2210'] } }
    });
    console.log("Accounts found:", accounts.map(a => ({ code: a.code, name: a.name })));
}

check().then(() => prisma.$disconnect());
