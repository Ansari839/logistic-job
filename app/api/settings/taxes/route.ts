import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const taxes = await prisma.taxSetting.findMany({
            where: { companyId: user.companyId },
            include: { branch: { select: { id: true, name: true } } },
        });
        return NextResponse.json({ taxes });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch taxes' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await req.json();
        const tax = await prisma.taxSetting.create({
            data: {
                ...body,
                companyId: user.companyId!,
                branchId: body.branchId ? Number(body.branchId) : null,
                percentage: Number(body.percentage)
            }
        });
        return NextResponse.json(tax);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create tax' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { id, ...data } = await req.json();
        const tax = await prisma.taxSetting.update({
            where: { id: Number(id), companyId: user.companyId! },
            data: {
                ...data,
                branchId: data.branchId ? Number(data.branchId) : null,
                percentage: Number(data.percentage)
            }
        });
        return NextResponse.json(tax);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update tax' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        await prisma.taxSetting.delete({
            where: { id: Number(id), companyId: user.companyId }
        });
        return NextResponse.json({ message: 'Tax rule deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete tax' }, { status: 500 });
    }
}
