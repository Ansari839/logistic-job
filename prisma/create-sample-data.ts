import { PrismaClient } from "../app/generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import 'dotenv/config'
import jwt from 'jsonwebtoken';

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-it';
const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🚀 Starting sample data creation via API...');

    // 1. Get an Admin user
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        include: { company: true }
    });

    if (!adminUser) {
        console.error('❌ No ADMIN user found. Please run seed-core first.');
        return;
    }

    console.log(`👤 Using Admin User: ${adminUser.email} for Company: ${adminUser.company?.name}`);

    // 2. Generate Token
    const payload = {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        branch: adminUser.branch,
        department: adminUser.department,
        region: adminUser.region,
        companyId: adminUser.companyId,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    const headers = {
        'Content-Type': 'application/json',
        'Cookie': `auth_token=${token}`
    };

    // 3. Get Parent Accounts for COA
    const arAccount = await prisma.account.findUnique({
        where: { companyId_code: { companyId: adminUser.companyId!, code: '1230' } }
    });
    const apAccount = await prisma.account.findUnique({
        where: { companyId_code: { companyId: adminUser.companyId!, code: '2210' } }
    });

    if (!arAccount || !apAccount) {
        console.error('❌ Accounts Receivable (1230) or Accounts Payable (2210) not found in COA. Run seed-coa first.');
        return;
    }

    // 4. Create Customers
    const customers = [
        { name: 'Blue Water Shipping', code: 'C002', address: 'Port Area, Karachi', phone: '+92-21-111222333', email: 'ops@bluewater.com' },
        { name: 'Green Valley Exports', code: 'C003', address: 'Manufacturing Zone, Lahore', phone: '+92-42-444555666', email: 'sales@greenvalley.com' },
        { name: 'Sunrise Trading', code: 'C004', address: 'Commercial Market, Islamabad', phone: '+92-51-777888999', email: 'info@sunrisetrading.com' },
        { name: 'Ocean Link Solutions', code: 'C005', address: 'Maritime Center, Karachi', phone: '+92-21-999000111', email: 'contact@oceanlink.com' },
        { name: 'Prime Goods Ltd', code: 'C006', address: 'Industrial Estate, Sialkot', phone: '+92-52-222333444', email: 'manager@primegoods.com' },
    ];

    console.log('\n--- Creating Customers & Accounts ---');
    let lastArCode = parseInt(arAccount.code);
    const existingArChildren = await prisma.account.findFirst({
        where: { parentId: arAccount.id },
        orderBy: { code: 'desc' }
    });
    if (existingArChildren) lastArCode = parseInt(existingArChildren.code);

    for (const data of customers) {
        try {
            // Create Customer entry
            const res = await fetch(`${BASE_URL}/api/customers`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            let result = await res.json();

            let customer = result.customer;
            if (!res.ok) {
                if (result.error === 'Customer Code already exists') {
                    customer = await prisma.customer.findUnique({ where: { code: data.code } });
                } else {
                    console.error(`❌ Failed to create customer ${data.name}:`, result.error);
                    continue;
                }
            }

            if (customer) {
                console.log(`✅ Customer Ready: ${customer.name} (${customer.code})`);

                // Check if Ledger Account already exists
                const existingAc = await prisma.account.findFirst({
                    where: { companyId: adminUser.companyId!, name: customer.name, parentId: arAccount.id }
                });

                if (!existingAc) {
                    // Create corresponding COA Account
                    lastArCode++;
                    const acRes = await fetch(`${BASE_URL}/api/accounts`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: customer.name,
                            code: lastArCode.toString(),
                            type: 'ASSET',
                            parentId: arAccount.id,
                            description: `Account for customer ${customer.name}`
                        }),
                    });
                    const acResult = await acRes.json();
                    if (acRes.ok) {
                        console.log(`   └─ ✅ Ledger Account Created: ${acResult.account.name} (Code: ${acResult.account.code})`);
                    } else {
                        console.error(`   └─ ❌ Failed to create account for ${customer.name}:`, acResult.error);
                    }
                } else {
                    console.log(`   └─ ℹ️ Ledger Account already exists: ${existingAc.name} (${existingAc.code})`);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing customer ${data.name}:`, error);
        }
    }

    // 5. Create Animal Feed Suppliers (Vendors)
    const feedSuppliers = [
        { name: 'AgriFeed International', code: 'FEED001', type: 'SUPPLIER', address: 'Grain Market, Multan', phone: '+92-61-1234567', email: 'supply@agrifeed.com' },
        { name: 'NutriGrain Corp', code: 'FEED002', type: 'SUPPLIER', address: 'Agriculture Hub, Faisalabad', phone: '+92-41-7654321', email: 'orders@nutrigrain.com' },
    ];

    console.log('\n--- Creating Animal Feed Suppliers & Accounts ---');
    let lastApCode = parseInt(apAccount.code);
    const existingApChildren = await prisma.account.findFirst({
        where: { parentId: apAccount.id },
        orderBy: { code: 'desc' }
    });
    if (existingApChildren) lastApCode = parseInt(existingApChildren.code);

    for (const data of feedSuppliers) {
        try {
            const res = await fetch(`${BASE_URL}/api/vendors`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            let result = await res.json();

            let vendor = result.vendor;
            if (!res.ok) {
                if (result.error === 'Vendor Code already exists') {
                    vendor = await prisma.vendor.findUnique({ where: { code: data.code } });
                } else {
                    console.error(`❌ Failed to create supplier ${data.name}:`, result.error);
                    continue;
                }
            }

            if (vendor) {
                console.log(`✅ Supplier Ready: ${vendor.name} (${vendor.code})`);

                // Check if Ledger Account already exists
                const existingAc = await prisma.account.findFirst({
                    where: { companyId: adminUser.companyId!, name: vendor.name, parentId: apAccount.id }
                });

                if (!existingAc) {
                    lastApCode++;
                    const acRes = await fetch(`${BASE_URL}/api/accounts`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: vendor.name,
                            code: lastApCode.toString(),
                            type: 'LIABILITY',
                            parentId: apAccount.id,
                            description: `Account for supplier ${vendor.name}`
                        }),
                    });
                    const acResult = await acRes.json();
                    if (acRes.ok) {
                        console.log(`   └─ ✅ Ledger Account Created: ${acResult.account.name} (Code: ${acResult.account.code})`);
                    } else {
                        console.error(`   └─ ❌ Failed to create account for ${vendor.name}:`, acResult.error);
                    }
                } else {
                    console.log(`   └─ ℹ️ Ledger Account already exists: ${existingAc.name} (${existingAc.code})`);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing supplier ${data.name}:`, error);
        }
    }

    // 6. Create Logistics Vendors
    const logisticsVendors = [
        { name: 'QuickLoad Logistics', code: 'LOG001', type: 'TRANSPORT', address: 'Trucking Plaza, Karachi', phone: '+92-21-555666777', email: 'booking@quickload.com' },
        { name: 'PortMasters Clearing', code: 'LOG002', type: 'CLEARING', address: 'Custom House Road, Karachi', phone: '+92-21-888999000', email: 'clearance@portmasters.com' },
        { name: 'Swift Movers', code: 'LOG003', type: 'TRANSPORT', address: 'Main GT Road, Gujranwala', phone: '+92-55-111000222', email: 'support@swiftmovers.com' },
    ];

    console.log('\n--- Creating Logistics Vendors & Accounts ---');
    for (const data of logisticsVendors) {
        try {
            const res = await fetch(`${BASE_URL}/api/vendors`, {
                method: 'POST',
                headers,
                body: JSON.stringify(data),
            });
            let result = await res.json();

            let vendor = result.vendor;
            if (!res.ok) {
                if (result.error === 'Vendor Code already exists') {
                    vendor = await prisma.vendor.findUnique({ where: { code: data.code } });
                } else {
                    console.error(`❌ Failed to create vendor ${data.name}:`, result.error);
                    continue;
                }
            }

            if (vendor) {
                console.log(`✅ Vendor Ready: ${vendor.name} (${vendor.code})`);

                // Check if Ledger Account already exists
                const existingAc = await prisma.account.findFirst({
                    where: { companyId: adminUser.companyId!, name: vendor.name, parentId: apAccount.id }
                });

                if (!existingAc) {
                    lastApCode++;
                    const acRes = await fetch(`${BASE_URL}/api/accounts`, {
                        method: 'POST',
                        headers,
                        body: JSON.stringify({
                            name: vendor.name,
                            code: lastApCode.toString(),
                            type: 'LIABILITY',
                            parentId: apAccount.id,
                            description: `Account for vendor ${vendor.name}`
                        }),
                    });
                    const acResult = await acRes.json();
                    if (acRes.ok) {
                        console.log(`   └─ ✅ Ledger Account Created: ${acResult.account.name} (Code: ${acResult.account.code})`);
                    } else {
                        console.error(`   └─ ❌ Failed to create account for ${vendor.name}:`, acResult.error);
                    }
                } else {
                    console.log(`   └─ ℹ️ Ledger Account already exists: ${existingAc.name} (${existingAc.code})`);
                }
            }
        } catch (error) {
            console.error(`❌ Error processing vendor ${data.name}:`, error);
        }
    }

    console.log('\n✨ Finished sample data creation.');
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
