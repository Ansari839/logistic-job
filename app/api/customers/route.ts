import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-default-secret-key-change-it'
);

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as any;
    } catch (error) {
        return null;
    }
}

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const customers = await prisma.customer.findMany({
            where: { companyId: user.companyId },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ customers });
    } catch (error) {
        console.error('Fetch customers error:', error);
        return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        console.log("POST /api/customers - Body:", body);
        const { name, code, address, phone, email, taxNumber } = body;

        console.log("User Company ID:", user.companyId);

        if (!name || !code) {
            console.log("Validation failed: Name or Code missing");
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        console.log("Starting sequential operations (no transaction)...");

        // 1. Find parent account
        console.log("Finding parent account...");
        const parentAccount = await prisma.account.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: '1230' } }
        });
        console.log("Parent account found:", parentAccount?.id);

        // 2. Create sub-account
        const accountCode = `${parentAccount?.code || '1230'}-${code}`;
        console.log("Creating sub-account:", accountCode);

        let customerAccount;
        try {
            customerAccount = await prisma.account.create({
                data: {
                    name: `${name} (Customer)`,
                    code: accountCode,
                    type: 'ASSET',
                    companyId: user.companyId,
                    parentId: parentAccount?.id
                }
            });
            console.log("Sub-account created:", customerAccount.id);
        } catch (accError: any) {
            console.error("Account creation failed:", accError);
            if (accError.code === 'P2002') {
                return NextResponse.json({ error: 'Account Code already exists.' }, { status: 400 });
            }
            throw accError;
        }

        // 3. Create Customer
        console.log("Creating Customer record...");
        const customer = await prisma.customer.create({
            data: {
                name,
                code,
                address,
                phone,
                email,
                taxNumber,
                companyId: user.companyId,
                accountId: customerAccount.id
            }
        });
        console.log("Transaction successful. Customer ID:", customer.id);

        return NextResponse.json({ customer });
    } catch (error: any) {
        console.error('Create customer error detailed:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Customer Code or Account already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create customer: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
