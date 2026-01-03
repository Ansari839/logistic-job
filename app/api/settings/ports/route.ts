import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const companyId = user.companyId ?? 0;

        const ports = await prisma.port.findMany({
            where: { companyId },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ ports });
    } catch (error) {
        console.error('Error fetching ports:', error);
        return NextResponse.json({ error: 'Failed to fetch ports' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const port = await prisma.port.create({
            data: {
                name,
                companyId: user.companyId as number
            }
        });

        return NextResponse.json({ port });
    } catch (error) {
        console.error('Error creating port:', error);
        return NextResponse.json({ error: 'Failed to create port' }, { status: 500 });
    }
}
