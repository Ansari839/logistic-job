import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const branches = await prisma.branch.findMany({
            where: { companyId: user.companyId }
        });
        return NextResponse.json(branches);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch branches' }, { status: 500 });
    }
}
