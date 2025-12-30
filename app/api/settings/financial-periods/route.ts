import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { logAction } from '@/lib/security';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const periods = await prisma.financialPeriod.findMany({
            where: { companyId: user.companyId as number },
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
        return NextResponse.json({ periods });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch periods' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { month, year, action } = await request.json(); // action: 'CLOSE', 'OPEN'

        const isClosed = action === 'CLOSE';

        const period = await prisma.financialPeriod.upsert({
            where: {
                companyId_month_year: {
                    companyId: user.companyId as number,
                    month,
                    year
                }
            },
            update: {
                isClosed,
                closedById: isClosed ? user.id : null,
                closedAt: isClosed ? new Date() : null
            },
            create: {
                companyId: user.companyId as number,
                month,
                year,
                isClosed,
                closedById: isClosed ? user.id : null,
                closedAt: isClosed ? new Date() : null
            }
        });

        await logAction({
            user,
            action: isClosed ? 'LOCK' : 'UNLOCK',
            module: 'FINANCIAL_PERIOD',
            entityId: period.id,
            payload: { month, year }
        });

        return NextResponse.json({ period });
    } catch (error) {
        console.error('Period update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
