const { PrismaClient } = require('../app/generated/prisma');
const prisma = new PrismaClient();

async function checkAccounts() {
    const accounts = await prisma.account.findMany({
        where: { companyId: 1 },
        orderBy: { code: 'asc' }
    });
    console.log('--- Account List ---');
    accounts.forEach(a => console.log(`${a.code} - ${a.name} (${a.type})`));
    await prisma.$disconnect();
}

checkAccounts().catch(console.error);
