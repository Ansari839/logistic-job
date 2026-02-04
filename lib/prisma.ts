import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined
  pgPool: Pool | undefined
}

const connectionString = process.env.DATABASE_URL

// Singleton Pool - Always reuse in global if available
const pool = globalForPrisma.pgPool ?? new Pool({
  connectionString,
  max: 3, // Very defensive for Neon/Vercel
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

globalForPrisma.pgPool = pool

// Singleton Adapter
const adapter = new PrismaPg(pool)

// Singleton PrismaClient - Always reuse in global if available
const prisma = globalForPrisma.prisma ?? new PrismaClient({
  adapter,
  log: ['error', 'warn'],
})

globalForPrisma.prisma = prisma

export default prisma