import { PrismaClient, Prisma } from "../app/generated/prisma";
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
  const headOffice = await prisma.branch.upsert({
    where: { id: 1 }, // Assuming ID 1 for simplicity in seed or find by name
    update: {},
    create: {
      name: 'Head Office',
      location: 'Karachi, Pakistan',
      companyId: mainCompany.id,
    },
  });

  await prisma.branch.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: 'North Warehouse',
      location: 'Lahore, Pakistan',
      companyId: mainCompany.id,
    },
  });
  console.log('Branches seeded');

  // 4. Link Currencies to Company
  const pkr = await prisma.currency.findUnique({ where: { code: 'PKR' } });
  if (pkr) {
    await prisma.companyCurrency.upsert({
      where: { companyId_currencyId: { companyId: mainCompany.id, currencyId: pkr.id } },
      update: {},
      create: {
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
    await prisma.systemSetting.upsert({
      where: { companyId_key: { companyId: mainCompany.id, key: s.key } },
      update: { value: s.value },
      create: s,
    });
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

  // Seed Customers
  const customer = await prisma.customer.upsert({
    where: { code: 'CUST001' },
    update: {},
    create: {
      name: 'Global Trade Inc.',
      code: 'CUST001',
      email: 'imports@globaltrade.com',
      companyId: mainCompany.id,
    },
  });

  // Seed Vendors
  const vendor = await prisma.vendor.upsert({
    where: { code: 'VND001' },
    update: {},
    create: {
      name: 'Fast Track Logistics',
      code: 'VND001',
      type: 'TRANSPORT',
      companyId: mainCompany.id,
    },
  });

  // Seed a Job
  await prisma.job.upsert({
    where: { jobNumber: 'JOB-2025-001' },
    update: {},
    create: {
      jobNumber: 'JOB-2025-001',
      jobType: 'EXPORT',
      customerId: customer.id,
      companyId: mainCompany.id,
      branchId: headOffice.id,
      vessel: 'MSC ORION',
      commodity: 'Textiles',
      volume: '1x40HC',
      containerNo: 'MSCU1234567',
    },
  });

  console.log('Logistics data seeded');

  // 7. Seed Chart of Accounts (COA)
  const coaData = [
    // ASSETS
    { code: '1000', name: 'Non-Current Assets', type: 'ASSET' },
    { code: '1100', name: 'Current Assets', type: 'ASSET' },
    { code: '1110', name: 'Cash in Hand', type: 'ASSET', parentCode: '1100' },
    { code: '1120', name: 'Bank Accounts', type: 'ASSET', parentCode: '1100' },
    { code: '1130', name: 'Accounts Receivable', type: 'ASSET', parentCode: '1100' },
    { code: '1140', name: 'Inventory / Stock', type: 'ASSET', parentCode: '1100' },

    // LIABILITIES
    { code: '2000', name: 'Non-Current Liabilities', type: 'LIABILITY' },
    { code: '2100', name: 'Current Liabilities', type: 'LIABILITY' },
    { code: '2110', name: 'Accounts Payable', type: 'LIABILITY', parentCode: '2100' },
    { code: '2120', name: 'Sales Tax Payable', type: 'LIABILITY', parentCode: '2100' },

    // EQUITY
    { code: '3000', name: 'Equity', type: 'EQUITY' },
    { code: '3100', name: 'Share Capital', type: 'EQUITY', parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', type: 'EQUITY', parentCode: '3000' },

    // REVENUE
    { code: '4000', name: 'Revenue', type: 'REVENUE' },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE', parentCode: '4000' },
    { code: '4110', name: 'Product Sales', type: 'REVENUE', parentCode: '4000' },
    { code: '4200', name: 'Other Income', type: 'REVENUE', parentCode: '4000' },

    // EXPENSE
    { code: '5000', name: 'Cost of Sales', type: 'EXPENSE' },
    { code: '5100', name: 'Operating Expenses', type: 'EXPENSE' },
    { code: '5110', name: 'Cost of Goods Sold', type: 'EXPENSE', parentCode: '5000' },
    { code: '5120', name: 'Rent Expense', type: 'EXPENSE', parentCode: '5100' },
  ];

  console.log('Seeding Chart of Accounts...');
  for (const ac of coaData) {
    const parent = ac.parentCode
      ? await prisma.account.findUnique({ where: { companyId_code: { companyId: mainCompany.id, code: ac.parentCode } } })
      : null;

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
  }
  console.log('Chart of Accounts seeded');

  // 8. Seed Feed Business Data
  console.log('Seeding Feed Business Data...');
  const feedCategory = await prisma.productCategory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'Animal Feed',
      description: 'High quality livestock feed',
      companyId: mainCompany.id,
    }
  });

  await prisma.product.upsert({
    where: { sku: 'FEED-WHEAT-BG' },
    update: {},
    create: {
      name: 'Wheat Feed - 50kg Bag',
      sku: 'FEED-WHEAT-BG',
      unit: 'bags',
      purchasePrice: 1500,
      sellingPrice: 1850,
      categoryId: feedCategory.id,
      companyId: mainCompany.id,
    }
  });

  console.log('Feed Business Data seeded');
  console.log('Seeding finished.');
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