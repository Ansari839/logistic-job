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
    { params }: { params: Promise<{ jobNumber: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobNumber } = await params;

    try {
        const job = await prisma.job.findUnique({
            where: {
                jobNumber: jobNumber,
            },
            include: {
                customer: true,
                branch: true,
                expenses: {
                    include: { vendor: { select: { name: true, code: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                invoice: true
            }
        });

        if (!job || job.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ job });
    } catch (error) {
        console.error('Get job by number error:', error);
        return NextResponse.json({ error: 'Failed to get job' }, { status: 500 });
    }
}
