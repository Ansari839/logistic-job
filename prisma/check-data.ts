import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const expenseCount = await prisma.expense.count();
    const jobCount = await prisma.job.count();
    const coaCount = await prisma.account.count();
    const userCount = await prisma.user.count();

    console.log(`DATA CHECK:`);
    console.log(`Users: ${userCount}`);
    console.log(`Jobs: ${jobCount}`);
    console.log(`Expenses: ${expenseCount}`);
    console.log(`COA Accounts: ${coaCount}`);
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
