import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
    try {
        const companies = await prisma.company.findMany();
        console.log('Companies:', companies.map(c => ({ id: c.id, name: c.name, uniqueId: c.uniqueId })));

        const jobs = await prisma.job.findMany({
            include: { company: true }
        });
        console.log('Jobs:', jobs.length);
        if (jobs.length > 0) {
            console.dir(jobs[0], { depth: 1 });
        }

        const users = await prisma.user.findMany();
        console.log('Users:', users.map(u => ({ email: u.email, companyId: u.companyId, division: u.division })));
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
