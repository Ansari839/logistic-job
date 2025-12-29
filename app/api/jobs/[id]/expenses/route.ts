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

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const expenses = await prisma.expense.findMany({
            where: {
                jobId: parseInt(id),
                companyId: user.companyId
            },
            include: {
                vendor: { select: { name: true, code: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ expenses });
    } catch (error) {
        console.error('Fetch expenses error:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const body = await request.json();
        const { description, costPrice, sellingPrice, vendorId, currencyCode, exchangeRate } = body;

        if (!description) {
            return NextResponse.json({ error: 'Description is required' }, { status: 400 });
        }

        const expense = await prisma.expense.create({
            data: {
                jobId: parseInt(id),
                companyId: user.companyId,
                vendorId: vendorId ? parseInt(vendorId) : null,
                description,
                costPrice: costPrice ? parseFloat(costPrice) : 0,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
                currencyCode: currencyCode || 'PKR',
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1,
            }
        });

        return NextResponse.json({ expense });
    } catch (error) {
        console.error('Create expense error:', error);
        return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 });
    }
}
