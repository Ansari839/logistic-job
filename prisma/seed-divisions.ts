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
    console.log(`Seeding multi-division users...`);

    const mainCompany = await prisma.company.findUnique({
        where: { uniqueId: 'LOGOS-001' },
    });

    if (!mainCompany) {
        console.error("Main company not found. Please run seed-core.ts first.");
        return;
    }

    const logiPass = await bcrypt.hash('admin124', 10);
    const feedPass = await bcrypt.hash('admin125', 10);

    // 1. Logistics Admin
    await prisma.user.upsert({
        where: { email: 'admin@logistics.com' },
        update: {
            password: logiPass,
            division: 'logistics',
            role: 'ADMIN'
        },
        create: {
            name: "Logistics Admin",
            email: "admin@logistics.com",
            password: logiPass,
            role: 'ADMIN',
            division: 'logistics',
            companyId: mainCompany.id,
            branch: 'Head Office'
        },
    });

    // 2. Animal Feed Admin
    await prisma.user.upsert({
        where: { email: 'admin@feed.com' },
        update: {
            password: feedPass,
            division: 'animal-feed',
            role: 'ADMIN'
        },
        create: {
            name: "Animal Feed Admin",
            email: "admin@feed.com",
            password: feedPass,
            role: 'ADMIN',
            division: 'animal-feed',
            companyId: mainCompany.id,
            branch: 'Head Office'
        },
    });

    console.log('✅ Multi-division users seeded');
    console.log('-----------------------------------');
    console.log('Logistics Hub: admin@logistics.com / admin124');
    console.log('Animal Feed: admin@feed.com / admin125');
    console.log('-----------------------------------');
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
