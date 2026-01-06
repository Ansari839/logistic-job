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
        const vendors = await prisma.vendor.findMany({
            where: {
                companyId: user.companyId,
                division: user.division
            },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ vendors });
    } catch (error) {
        console.error('Fetch vendors error:', error);
        return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, code, type, address, phone, email, taxNumber } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        // 1. Transaction to create Vendor and its Ledger Account
        const vendor = await prisma.$transaction(async (tx) => {
            // Find parent account for Accounts Payable (2210)
            const parentAccount = await tx.account.findUnique({
                where: { companyId_code: { companyId: user.companyId, code: '2210' } }
            });

            // Create sub-account for this vendor
            const vendorAccount = await tx.account.create({
                data: {
                    name: `${name} (Vendor)`,
                    code: `${parentAccount?.code || '2210'}-${code}`,
                    type: 'LIABILITY',
                    companyId: user.companyId,
                    parentId: parentAccount?.id
                }
            });

            return tx.vendor.create({
                data: {
                    name,
                    code,
                    type,
                    address,
                    phone,
                    email,
                    taxNumber,
                    companyId: user.companyId,
                    division: user.division,
                    accountId: vendorAccount.id
                }
            });
        });

        return NextResponse.json({ vendor });
    } catch (error: any) {
        console.error('Create vendor error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Vendor Code already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create vendor' }, { status: 500 });
    }
}
