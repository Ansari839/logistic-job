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

        const expensesMaster = await prisma.expenseMaster.findMany({
            where: { companyId },
            orderBy: { code: 'asc' }
        });

        return NextResponse.json({ expensesMaster });
    } catch (error) {
        console.error('Error fetching expenses master:', error);
        return NextResponse.json({ error: 'Failed to fetch expenses master' }, { status: 500 });
    }
}
