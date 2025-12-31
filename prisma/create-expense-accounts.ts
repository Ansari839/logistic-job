import { PrismaClient, AccountType } from '../app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const EXPENSE_ACCOUNTS = [
    { code: '5110', name: 'Ocean Freight', type: 'EXPENSE' as AccountType, description: 'Sea freight charges' },
    { code: '5120', name: 'Air Freight', type: 'EXPENSE' as AccountType, description: 'Air freight charges' },
    { code: '5130', name: 'Terminal Handling Charges (THC)', type: 'EXPENSE' as AccountType, description: 'Port terminal handling' },
    { code: '5140', name: 'Delivery Order (DO) Charges', type: 'EXPENSE' as AccountType, description: 'DO issuance charges' },
    { code: '5150', name: 'Customs Duty & Taxes', type: 'EXPENSE' as AccountType, description: 'Import/Export duties' },
    { code: '5160', name: 'Transportation Charges', type: 'EXPENSE' as AccountType, description: 'Local trucking and transport' },
    { code: '5170', name: 'Port Charges', type: 'EXPENSE' as AccountType, description: 'Wharfage and other port fees' },
    { code: '5180', name: 'Agent Commission', type: 'EXPENSE' as AccountType, description: 'Commission paid to agents' },
    { code: '5190', name: 'Miscellaneous Operational Costs', type: 'EXPENSE' as AccountType, description: 'Other logistics related costs' },
];

async function main() {
    console.log('🚀 Creating missing expense accounts...');

    const company = await prisma.company.findFirst();
    if (!company) {
        console.error('❌ No company found. Please seed basic data first.');
        return;
    }

    // Find parent account 5100
    let parent = await prisma.account.findUnique({
        where: { companyId_code: { companyId: company.id, code: '5100' } }
    });

    if (!parent) {
        console.log('Creating parent account 5100 (Direct Cost)...');
        parent = await prisma.account.create({
            data: {
                code: '5100',
                name: 'Direct Cost of Services',
                type: 'EXPENSE',
                companyId: company.id
            }
        });
    }

    for (const acc of EXPENSE_ACCOUNTS) {
        const existing = await prisma.account.findUnique({
            where: { companyId_code: { companyId: company.id, code: acc.code } }
        });

        if (!existing) {
            await prisma.account.create({
                data: {
                    ...acc,
                    parentId: parent.id,
                    companyId: company.id
                }
            });
            console.log(`✅ Created: ${acc.code} - ${acc.name}`);
        } else {
            console.log(`ℹ️ Already exists: ${acc.code} - ${acc.name}`);
        }
    }

    console.log('✨ Finished creating expense accounts.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
