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
        const { name, code, address, phone, email } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });
        }

        const customer = await prisma.customer.create({
            data: {
                name,
                code,
                address,
                phone,
                email,
                companyId: user.companyId,
            }
        });

        return NextResponse.json({ customer });
    } catch (error: any) {
        console.error('Create customer error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Customer Code already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
}
