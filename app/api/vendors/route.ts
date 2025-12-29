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
            where: { companyId: user.companyId },
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
        const { name, code, type, address, phone, email } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        const vendor = await prisma.vendor.create({
            data: {
                name,
                code,
                type,
                address,
                phone,
                email,
                companyId: user.companyId,
            }
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
