import 'dotenv/config';
import prisma from './lib/prisma';

async function testApi(email: string) {
    console.log(`\nTesting API for ${email}...`);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.error('User not found');
        return;
    }

    const companyId = user.companyId;
    const division = user.division;

    console.log(`User Context: CompID=${companyId} (Type: ${typeof companyId}), Division=[${division}] (Type: ${typeof division})`);

    // Simulate /api/jobs GET
    const whereClause = {
        companyId: companyId as number,
        division: division as string,
        deletedAt: null
    };
    console.log('Jobs Where Clause:', JSON.stringify(whereClause, null, 2));

    const jobs = await prisma.job.findMany({
        where: whereClause,
        include: { customer: true }
    });
    console.log(`Jobs found: ${jobs.length}`);
    jobs.forEach(j => console.log(` - ${j.jobNumber} (${j.division}) Customer: ${j.customer?.name}`));

    // Simulate /api/accounts GET
    const accounts = await prisma.account.findMany({
        where: {
            companyId: companyId as number,
            division: division as string
        }
    });
    console.log(`Accounts found: ${accounts.length}`);
}

async function main() {
    await testApi('admin@logistics.com');
    await testApi('admin@feed.com');
}

main();
