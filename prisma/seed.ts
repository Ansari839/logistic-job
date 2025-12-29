import { PrismaClient, Prisma } from "../app/generated/prisma/client";
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const userData: Prisma.UserCreateInput[] = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: 'ADMIN',
      branch: "Head Office",
      department: "Management",
      region: "Global",
    },
    {
      name: "Operator User",
      email: "operator@example.com",
      password: hashedPassword,
      role: 'OPERATOR',
      branch: "Warehouse A",
      department: "Logistics",
      region: "North",
    },
    {
      name: "Sales User",
      email: "sales@example.com",
      password: hashedPassword,
      role: 'SALES',
      branch: "Branch 1",
      department: "Sales",
      region: "North",
    },
    {
      name: "Accounts User",
      email: "accounts@example.com",
      password: hashedPassword,
      role: 'ACCOUNTS',
      branch: "Head Office",
      department: "Finance",
      region: "Global",
    },
  ];

  console.log(`Start seeding ...`);
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    console.log(`Created user with id: ${user.id}`);
  }
  console.log(`Seeding finished.`);
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