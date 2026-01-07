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
            where: {
                companyId: user.companyId,
                division: user.division
            },
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
        const { name, code, address, phone, email, taxNumber } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        // 1. Find parent account
        const parentAccount = await prisma.account.findUnique({
            where: { companyId_code: { companyId: user.companyId, code: '1230' } }
        });

        // 2. Create sub-account
        const accountCode = `${parentAccount?.code || '1230'}-${code}`;

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
        } catch (accError: any) {
            console.error("Account creation failed:", accError);
            if (accError.code === 'P2002') {
                return NextResponse.json({ error: 'Account Code already exists.' }, { status: 400 });
            }
            throw accError;
        }

        // 3. Create Customer
        const customer = await prisma.customer.create({
            data: {
                name,
                code,
                address,
                phone,
                email,
                taxNumber,
                companyId: user.companyId,
                division: user.division,
                accountId: customerAccount.id
            }
        });

        return NextResponse.json({ customer });
    } catch (error: any) {
        console.error('Create customer error detailed:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Customer Code or Account already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create customer: ' + (error.message || 'Unknown error') }, { status: 500 });
    }
}
