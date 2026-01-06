import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function simulate() {
    const company = await prisma.company.findUnique({ where: { uniqueId: 'LOGOS-001' } });
    if (!company) return;

    // Simulate what the API does
    const body = {
        name: "Test Customer 1",
        code: "CUST-TEST-001",
        address: "Test Address",
        phone: "123456",
        email: "test@test.com",
        taxNumber: "NTN-TEST",
        companyId: company.id
    };

    console.log("Attempting transaction...");

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Find parent account for Accounts Receivable (1230)
            const parentAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: company.id, code: '1230' } }
            });

            if (!parentAccount) throw new Error("Parent account 1230 not found");

            console.log("Found parent:", parentAccount.id);

            // Create sub-account for this customer
            const accountCode = `${parentAccount.code}-${body.code}`;
            console.log("Creating account with code:", accountCode);

            const customerAccount = await tx.account.create({
                data: {
                    name: `${body.name} (Customer)`,
                    code: accountCode,
                    type: 'ASSET',
                    companyId: company.id,
                    parentId: parentAccount.id
                }
            });
            console.log("Account created:", customerAccount.id);

            return tx.customer.create({
                data: {
                    name: body.name,
                    code: body.code,
                    address: body.address,
                    phone: body.phone,
                    email: body.email,
                    taxNumber: body.taxNumber,
                    companyId: company.id,
                    accountId: customerAccount.id
                }
            });
        });
        console.log("Success:", result);
    } catch (e) {
        console.error("Transaction failed:", e);
    }
}

simulate().then(() => prisma.$disconnect());
