
import { PrismaClient } from '../app/generated/prisma';
const prisma = new PrismaClient();

async function main() {
    const accounts = await prisma.account.findMany({
        where: { type: 'EXPENSE' },
        select: { code: true, name: true, division: true }
    });
    console.log('Expense Accounts:', JSON.stringify(accounts, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
