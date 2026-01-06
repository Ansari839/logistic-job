import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
    console.log('--- Isolation Verification ---');

    try {
        // 1. Check Schema for 'division' field in key models
        const models = ['job', 'account', 'customer', 'vendor'];
        for (const model of models) {
            const result = await (prisma[model as any] as any).findMany({ take: 1 });
            if (result.length > 0) {
                if ('division' in result[0]) {
                    console.log(`✅ ${model} has 'division' field`);
                } else {
                    console.error(`❌ ${model} missing 'division' field`);
                }
            } else {
                console.log(`ℹ️ ${model} table empty, cannot verify field presence via data, check schema.prisma`);
            }
        }

        // 2. Check current data tagging
        const jobs = await prisma.job.findMany({ include: { company: true } });
        console.log(`Jobs: ${jobs.length}`);
        jobs.forEach(j => {
            console.log(` - Job ${j.jobNumber}: Division = ${j.division}, Company = ${j.company.name}`);
        });

        const users = await prisma.user.findMany();
        console.log(`Users: ${users.length}`);
        users.forEach(u => {
            console.log(` - User ${u.email}: Division = ${u.division}, CompanyId = ${u.companyId}`);
        });

        // 3. Verify COA
        const accounts = await prisma.account.findMany({ take: 5 });
        console.log(`Accounts: ${accounts.length}`);
        accounts.forEach(a => {
            console.log(` - Account ${a.code}: Division = ${a.division}`);
        });

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
