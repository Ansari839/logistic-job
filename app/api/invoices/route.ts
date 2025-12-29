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

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    try {
        const invoices = await prisma.invoice.findMany({
            where: {
                companyId: user.companyId,
                ...(jobId && { jobId: parseInt(jobId) }),
            },
            include: {
                customer: { select: { name: true, code: true } },
                job: { select: { jobNumber: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ invoices });
    } catch (error) {
        console.error('Fetch invoices error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            invoiceNumber, jobId, customerId, type,
            totalAmount, taxAmount, grandTotal, currencyCode, items
        } = body;

        if (!invoiceNumber || !jobId || !customerId) {
            return NextResponse.json({ error: 'Invoice Number, Job, and Customer are required' }, { status: 400 });
        }

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                jobId: parseInt(jobId),
                customerId: parseInt(customerId),
                type: type || 'MASTER',
                totalAmount: parseFloat(totalAmount) || 0,
                taxAmount: parseFloat(taxAmount) || 0,
                grandTotal: parseFloat(grandTotal) || 0,
                currencyCode: currencyCode || 'PKR',
                companyId: user.companyId,
                items: {
                    create: items?.map((item: any) => ({
                        description: item.description,
                        amount: parseFloat(item.amount),
                        taxPercentage: parseFloat(item.taxPercentage) || 0,
                        taxAmount: parseFloat(item.taxAmount) || 0,
                        total: parseFloat(item.total),
                    })) || []
                }
            },
            include: {
                items: true,
                customer: true,
                job: true
            }
        });

        return NextResponse.json({ invoice });
    } catch (error: any) {
        console.error('Create invoice error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Invoice Number already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
