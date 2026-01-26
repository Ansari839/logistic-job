import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
    const users = await prisma.user.findMany();
    console.log(`Users found: ${users.length}`);
    users.forEach(u => {
        console.log(`User: ${u.email}, Division: ${u.division}, CompanyId: ${u.companyId}`);
    });

    const invoiceCategory = 'SALES_TAX';
    console.log(`Testing filter for: ${invoiceCategory}`);

    const jobs = await prisma.job.findMany({
        where: {
            serviceInvoices: {
                none: {
                    serviceCategory: invoiceCategory,
                }
            }
        },
        include: {
            serviceInvoices: true,
            freightInvoice: true
        }
    });

    console.log(`Jobs matching 'none' SALES_TAX: ${jobs.length}`);
    jobs.forEach(j => {
        console.log(`Job: ${j.jobNumber}, Status: ${j.status}, Division: ${j.division}, CompanyId: ${j.companyId}`);
        console.log(`  Service Invoices: ${j.serviceInvoices.length}`);
        j.serviceInvoices.forEach(inv => {
            console.log(`    - Inv: ${inv.invoiceNumber}, Category: ${inv.serviceCategory}, Status: ${inv.status}`);
        });
        console.log(`  Freight Invoice: ${j.freightInvoice ? j.freightInvoice.invoiceNumber : 'None'}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
