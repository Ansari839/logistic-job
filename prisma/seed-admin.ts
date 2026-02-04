import { PrismaClient } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log(`Start seeding Admin and Core data...`);

    // 1. Currencies
    const currenciesData = [
        { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
        { code: 'USD', symbol: '$', name: 'US Dollar' },
    ];
    for (const c of currenciesData) {
        await prisma.currency.upsert({
            where: { code: c.code },
            update: {},
            create: c
        });
    }
    console.log('✅ Currencies seeded');

    // 2. Default Company
    const company = await prisma.company.upsert({
        where: { uniqueId: 'LOGOS-001' },
        update: {},
        create: {
            name: "LogisticOS Corp",
            uniqueId: "LOGOS-001",
            email: "info@logisticsos.com",
            industry: "Logistics",
            themeConfig: { primaryColor: '#3b82f6', darkMode: true },
        },
    });
    console.log('✅ Company seeded');

    // 3. Default Branch
    const branch = await prisma.branch.upsert({
        where: { id: 1 },
        update: { companyId: company.id },
        create: {
            id: 1,
            name: 'Head Office',
            location: 'Karachi, Pakistan',
            companyId: company.id,
        },
    });
    console.log('✅ Branch seeded');

    // 4. Link Default Currency to Company
    const pkr = await prisma.currency.findUnique({ where: { code: 'PKR' } });
    if (pkr) {
        await prisma.companyCurrency.upsert({
            where: { companyId_currencyId: { companyId: company.id, currencyId: pkr.id } },
            update: {},
            create: {
                companyId: company.id,
                currencyId: pkr.id,
                isDefault: true,
                exchangeRate: 1.0,
            }
        });
    }
    console.log('✅ Currency link seeded');

    // 5. System Settings
    const settings = [
        { key: 'timezone', value: 'Asia/Karachi', type: 'CONFIG', companyId: company.id },
        { key: 'dateFormat', value: 'DD-MM-YYYY', type: 'FORMAT', companyId: company.id },
    ];
    for (const s of settings) {
        await prisma.systemSetting.upsert({
            where: { companyId_key: { companyId: company.id, key: s.key } },
            update: { value: s.value },
            create: s,
        });
    }
    console.log('✅ System Settings seeded');

    // 6. Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminEmail = 'admin@example.com';

    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            companyId: company.id,
            role: 'ADMIN',
            password: hashedPassword
        },
        create: {
            name: "Main Admin",
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            division: 'logistics',
            companyId: company.id,
            branch: 'Head Office',
        },
    });
    console.log(`✅ Admin User seeded (${adminEmail} / admin123)`);

    console.log('🚀 Seed process completed successfully!');
}

main()
    .then(async () => {
        await prisma.$disconnect()
        await pool.end()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        await pool.end()
        process.exit(1)
    })
