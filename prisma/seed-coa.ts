import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    console.log(`Start seeding COA data...`);

    const mainCompany = await prisma.company.findUnique({ where: { uniqueId: 'LOGOS-001' } });
    if (!mainCompany) throw new Error("Main Company not found. Run seed-core first.");

    const coaData = [
        // 1. ASSETS
        { code: '1000', name: 'ASSETS', type: 'ASSET' },
        { code: '1100', name: 'Non-Current Assets', type: 'ASSET', parentCode: '1000' },
        { code: '1110', name: 'Property, Plant & Equipment', type: 'ASSET', parentCode: '1100' },
        { code: '1120', name: 'Accumulated Depreciation', type: 'ASSET', parentCode: '1100' },
        { code: '1200', name: 'Current Assets', type: 'ASSET', parentCode: '1000' },
        { code: '1210', name: 'Cash & Cash Equivalents', type: 'ASSET', parentCode: '1200' },
        { code: '1211', name: 'Petty Cash', type: 'ASSET', parentCode: '1210' },
        { code: '1212', name: 'Cash in Hand', type: 'ASSET', parentCode: '1210' },
        { code: '1220', name: 'Bank Accounts', type: 'ASSET', parentCode: '1200' },
        { code: '1221', name: 'Meezan Bank - Operation', type: 'ASSET', parentCode: '1220' },
        { code: '1222', name: 'HBL - Corporate', type: 'ASSET', parentCode: '1220' },
        { code: '1230', name: 'Accounts Receivable', type: 'ASSET', parentCode: '1200' },
        { code: '1240', name: 'Inventory', type: 'ASSET', parentCode: '1200' },
        { code: '1250', name: 'Advances, Deposits & Prepayments', type: 'ASSET', parentCode: '1200' },
        { code: '1251', name: 'Advance Income Tax', type: 'ASSET', parentCode: '1250' },
        { code: '1252', name: 'Security Deposits', type: 'ASSET', parentCode: '1250' },

        // 2. LIABILITIES
        { code: '2000', name: 'LIABILITIES', type: 'LIABILITY' },
        { code: '2100', name: 'Non-Current Liabilities', type: 'LIABILITY', parentCode: '2000' },
        { code: '2110', name: 'Long Term Loans', type: 'LIABILITY', parentCode: '2100' },
        { code: '2200', name: 'Current Liabilities', type: 'LIABILITY', parentCode: '2000' },
        { code: '2210', name: 'Accounts Payable', type: 'LIABILITY', parentCode: '2200' },
        { code: '2220', name: 'Tax Payable', type: 'LIABILITY', parentCode: '2200' },
        { code: '2221', name: 'Sales Tax Payable', type: 'LIABILITY', parentCode: '2220' },
        { code: '2222', name: 'Income Tax Payable', type: 'LIABILITY', parentCode: '2220' },
        { code: '2223', name: 'SRB Payable', type: 'LIABILITY', parentCode: '2220' },
        { code: '2230', name: 'Accrued Expenses', type: 'LIABILITY', parentCode: '2200' },
        { code: '2240', name: 'Short Term Loans', type: 'LIABILITY', parentCode: '2200' },

        // 3. EQUITY
        { code: '3000', name: 'EQUITY', type: 'EQUITY' },
        { code: '3100', name: 'Share Capital', type: 'EQUITY', parentCode: '3000' },
        { code: '3200', name: 'Retained Earnings', type: 'EQUITY', parentCode: '3000' },
        { code: '3300', name: 'Drawings / Dividends', type: 'EQUITY', parentCode: '3000' },

        // 4. REVENUE
        { code: '4000', name: 'REVENUE', type: 'REVENUE' },
        { code: '4100', name: 'Operating Revenue', type: 'REVENUE', parentCode: '4000' },
        { code: '4110', name: 'Ocean Freight Income', type: 'REVENUE', parentCode: '4100' },
        { code: '4120', name: 'Air Freight Income', type: 'REVENUE', parentCode: '4100' },
        { code: '4130', name: 'Transportation Income', type: 'REVENUE', parentCode: '4100' },
        { code: '4140', name: 'Customs Clearance Income', type: 'REVENUE', parentCode: '4100' },
        { code: '4150', name: 'Agency Commission', type: 'REVENUE', parentCode: '4100' },
        { code: '4200', name: 'Other Income', type: 'REVENUE', parentCode: '4000' },
        { code: '4210', name: 'Exchange Gain', type: 'REVENUE', parentCode: '4200' },
        { code: '4220', name: 'Bank Profit', type: 'REVENUE', parentCode: '4200' },

        // 5. EXPENSES
        { code: '5000', name: 'EXPENSES', type: 'EXPENSE' },
        { code: '5100', name: 'Cost of Services (Direct)', type: 'EXPENSE', parentCode: '5000' },
        { code: '5110', name: 'Ocean Freight Expense', type: 'EXPENSE', parentCode: '5100' },
        { code: '5120', name: 'Air Freight Expense', type: 'EXPENSE', parentCode: '5100' },
        { code: '5130', name: 'Terminal Handling Charges (THC)', type: 'EXPENSE', parentCode: '5100' },
        { code: '5140', name: 'Delivery Order (DO) Charges', type: 'EXPENSE', parentCode: '5100' },
        { code: '5150', name: 'Customs Duty & Taxes', type: 'EXPENSE', parentCode: '5100' },
        { code: '5160', name: 'Transportation Charges', type: 'EXPENSE', parentCode: '5100' },
        { code: '5170', name: 'Port Charges', type: 'EXPENSE', parentCode: '5100' },
        { code: '5200', name: 'Operating Expenses (Admin)', type: 'EXPENSE', parentCode: '5000' },
        { code: '5210', name: 'Salaries & Wages', type: 'EXPENSE', parentCode: '5200' },
        { code: '5220', name: 'Rent, Rates & Taxes', type: 'EXPENSE', parentCode: '5200' },
        { code: '5230', name: 'Utilities (Elec, Water, Gas)', type: 'EXPENSE', parentCode: '5200' },
        { code: '5240', name: 'Internet & Communication', type: 'EXPENSE', parentCode: '5200' },
        { code: '5250', name: 'Entertainment & Refreshment', type: 'EXPENSE', parentCode: '5200' },
        { code: '5260', name: 'Repair & Maintenance', type: 'EXPENSE', parentCode: '5200' },
        { code: '5270', name: 'Marketing & Advertisement', type: 'EXPENSE', parentCode: '5200' },
        { code: '5280', name: 'Exchange Loss', type: 'EXPENSE', parentCode: '5200' },
    ];

    console.log('Seeding Chart of Accounts...');
    for (const ac of coaData) {
        const parent = ac.parentCode
            ? await prisma.account.findUnique({ where: { companyId_code: { companyId: mainCompany.id, code: ac.parentCode } } })
            : null;

        try {
            await prisma.account.upsert({
                where: { companyId_code: { companyId: mainCompany.id, code: ac.code } },
                update: { parentId: parent?.id },
                create: {
                    code: ac.code,
                    name: ac.name,
                    type: ac.type as any,
                    companyId: mainCompany.id,
                    parentId: parent?.id
                }
            });
        } catch (e) {
            console.error(`Error seeding COA ${ac.code}:`, e);
        }
    }
    console.log('✅ COA Seed completed');
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
