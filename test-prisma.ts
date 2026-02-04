import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_vmSPDon6x0NL@ep-cool-haze-ahp49wdk-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    try {
        const job = await prisma.job.findUnique({
            where: { id: 1 },
            include: {
                customer: true,
                branch: true,
                expenses: {
                    include: { vendor: { select: { name: true, code: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                serviceInvoices: {
                    include: { items: true }
                },
                freightInvoice: {
                    include: { items: true }
                }
            }
        })
        console.log('Job found:', !!job)
    } catch (e: any) {
        console.error('Error details:', JSON.stringify(e, null, 2))
        console.error('Error message:', e.message)
    } finally {
        await prisma.$disconnect()
        await pool.end()
    }
}

main()
