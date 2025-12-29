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

  console.log(`Start seeding ...`);

  // 1. Create Currencies
  const currenciesData = [
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
  ];

  for (const c of currenciesData) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }
  console.log('Currencies seeded');

  // 2. Create Main Company
  const mainCompany = await prisma.company.upsert({
    where: { uniqueId: 'LOGOS-001' },
    update: {},
    create: {
      name: "LogisticOS Corp",
      uniqueId: "LOGOS-001",
      email: "info@logisticsos.com",
      industry: "Logistics & Supply Chain",
      themeConfig: { primaryColor: '#3b82f6', darkMode: true },
    },
  });
  console.log('Main Company seeded');

  // 3. Create Branches
  const branches = [
    { name: 'Head Office', location: 'Karachi, Pakistan', companyId: mainCompany.id },
    { name: 'North Warehouse', location: 'Lahore, Pakistan', companyId: mainCompany.id },
  ];

  for (const b of branches) {
    await prisma.branch.create({ data: b });
  }
  console.log('Branches seeded');

  // 4. Link Currencies to Company
  const pkr = await prisma.currency.findUnique({ where: { code: 'PKR' } });
  if (pkr) {
    await prisma.companyCurrency.create({
      data: {
        companyId: mainCompany.id,
        currencyId: pkr.id,
        isDefault: true,
        exchangeRate: 1.0,
      }
    });
  }

  // 5. Create System Settings
  const settings = [
    { key: 'timezone', value: 'Asia/Karachi', type: 'CONFIG', companyId: mainCompany.id },
    { key: 'dateFormat', value: 'DD-MM-YYYY', type: 'FORMAT', companyId: mainCompany.id },
    { key: 'emailNotifications', value: 'true', type: 'FLAG', companyId: mainCompany.id },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }
  console.log('System Settings seeded');

  // 6. Create Users and link to Company
  const userData: Prisma.UserCreateInput[] = [
    {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: 'ADMIN',
      branch: "Head Office",
      department: "Management",
      region: "Global",
      company: { connect: { id: mainCompany.id } }
    },
  ];

  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { companyId: mainCompany.id },
      create: u,
    });
    console.log(`Created/Updated user with id: ${user.id}`);
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