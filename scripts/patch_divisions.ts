import 'dotenv/config';
import prisma from './lib/prisma';

async function main() {
    console.log('--- Force Patching Divisions ---');

    try {
        const models = ['user', 'job', 'account', 'customer', 'vendor', 'invoice', 'payment'];

        for (const model of models) {
            console.log(`Patching ${model}...`);
            // Force Logistics
            await (prisma[model as any] as any).updateMany({
                where: { companyId: 1 },
                data: { division: 'logistics' }
            });
            // Force Animal Feed
            await (prisma[model as any] as any).updateMany({
                where: { companyId: 2 },
                data: { division: 'animal-feed' }
            });
        }

        console.log('✅ All divisions force-patched');
    } catch (error) {
        console.error('Patch failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
