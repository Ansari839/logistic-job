import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const connectionString = process.env.DATABASE_URL
const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma