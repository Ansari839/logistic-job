import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const currencies = await prisma.companyCurrency.findMany({
            where: { companyId: user.companyId },
            include: { currency: true },
        });
        return NextResponse.json({ currencies });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch currencies' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { currencyId, exchangeRate, isDefault } = await req.json();

        const currency = await prisma.companyCurrency.create({
            data: {
                companyId: user.companyId!,
                currencyId: Number(currencyId),
                exchangeRate: Number(exchangeRate),
                isDefault: !!isDefault
            },
            include: { currency: true }
        });

        return NextResponse.json(currency);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add currency' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, exchangeRate, isDefault } = await req.json();

        await prisma.$transaction(async (tx: any) => {
            if (isDefault) {
                await tx.companyCurrency.updateMany({
                    where: { companyId: user.companyId! },
                    data: { isDefault: false }
                });
            }
            return tx.companyCurrency.update({
                where: { id: Number(id), companyId: user.companyId! },
                data: { exchangeRate: Number(exchangeRate), isDefault }
            });
        });

        return NextResponse.json({ message: 'Currency updated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update currency' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        await prisma.companyCurrency.delete({
            where: { id: Number(id), companyId: user.companyId! }
        });

        return NextResponse.json({ message: 'Currency removed' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to remove currency' }, { status: 500 });
    }
}
