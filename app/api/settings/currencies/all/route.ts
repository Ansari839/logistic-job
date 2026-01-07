import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const currencies = await prisma.currency.findMany();
        return NextResponse.json(currencies);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch global currencies' }, { status: 500 });
    }
}
