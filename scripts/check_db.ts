import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
    try {
        const companies = await prisma.company.findMany();
        console.log('Companies:');
        console.dir(companies, { depth: null });

        const users = await prisma.user.findMany({
            include: { company: true }
        });
        console.log('Users:');
        console.dir(users, { depth: null });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
