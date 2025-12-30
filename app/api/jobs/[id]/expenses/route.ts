import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

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
                companyId: user.companyId as number
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
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
                companyId: user.companyId as number,
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

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: jobId } = await params;

    try {
        const body = await request.json();
        const { id, description, costPrice, sellingPrice, vendorId, currencyCode, exchangeRate } = body;

        if (!id) return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });

        const expense = await prisma.expense.update({
            where: { id: parseInt(id), companyId: user.companyId as number },
            data: {
                description,
                vendorId: vendorId ? parseInt(vendorId) : null,
                costPrice: costPrice ? parseFloat(costPrice) : 0,
                sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
                currencyCode: currencyCode || 'PKR',
                exchangeRate: exchangeRate ? parseFloat(exchangeRate) : 1,
            }
        });

        return NextResponse.json({ expense });
    } catch (error) {
        console.error('Update expense error:', error);
        return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get('expenseId');

    if (!expenseId) return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 });

    try {
        await prisma.expense.delete({
            where: { id: parseInt(expenseId), companyId: user.companyId as number }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete expense error:', error);
        return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
    }
}
