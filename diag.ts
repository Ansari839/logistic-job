
import { PrismaClient } from './app/generated/prisma/index.js';
const prisma = new PrismaClient();

async function main() {
    console.log('--- Database Check ---');

    const users = await prisma.user.findMany({
        select: { id: true, email: true, companyId: true, division: true }
    });
    console.log('Users:', JSON.stringify(users, null, 2));

    const accountsCount = await prisma.account.count();
    console.log('Total Accounts:', accountsCount);

    if (accountsCount > 0) {
        const sampleAccounts = await prisma.account.findMany({
            take: 5,
            select: { id: true, code: true, name: true, companyId: true, division: true }
        });
        console.log('Sample Accounts:', JSON.stringify(sampleAccounts, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
