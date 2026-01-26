import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// Import other seed functions would be complex due to how they are written
// Instead, I'll just run them as external processes or consolidate logic here.
// For now, I'll consolidate the MUST-HAVE logic to get both divisions working.

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log(`Start consolidation seed...`);

    // 1. Currencies
    const currenciesData = [
        { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
        { code: 'EUR', symbol: '€', name: 'Euro' },
    ];
    for (const c of currenciesData) {
        await prisma.currency.upsert({ where: { code: c.code }, update: {}, create: c });
    }

    // 2. Logistics Company
    const logos = await prisma.company.upsert({
        where: { uniqueId: 'LOGOS-001' },
        update: {},
        create: {
            name: "LogisticOS Corp",
            uniqueId: "LOGOS-001",
            email: "info@logisticsos.com",
            industry: "Logistics & Supply Chain",
            themeConfig: { primaryColor: '#3b82f6', darkMode: true },
        },
    });

    const pass = await bcrypt.hash('password123', 10);

    // 3. User
    await prisma.user.upsert({
        where: { email: 'admin@logistics.com' },
        update: { companyId: logos.id, division: 'logistics', password: pass },
        create: {
            name: "Logistics Admin",
            email: "admin@logistics.com",
            password: pass,
            role: 'ADMIN',
            division: 'logistics',
            companyId: logos.id,
        },
    });

    // Default admin
    await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: { companyId: logos.id, division: 'logistics', password: pass },
        create: {
            name: "Main Admin",
            email: "admin@example.com",
            password: pass,
            role: 'ADMIN',
            division: 'logistics',
            companyId: logos.id,
        },
    });

    console.log('✅ Consolidation Seed completed');
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
