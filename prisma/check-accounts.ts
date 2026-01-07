import { PrismaClient } from '../app/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            companyId: true,
            division: true
        }
    });
    console.log('--- Users ---');
    console.log(JSON.stringify(users, null, 2));

    const accountsCount = await prisma.account.count();
    console.log('\nTotal Accounts:', accountsCount);

    const accounts = await prisma.account.findMany({
        take: 10,
        select: {
            id: true,
            code: true,
            name: true,
            companyId: true,
            division: true
        }
    });
    console.log('\n--- Sample Accounts ---');
    console.log(JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
