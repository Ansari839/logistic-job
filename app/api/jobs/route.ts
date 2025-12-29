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
    const jobType = searchParams.get('jobType');
    const customerId = searchParams.get('customerId');

    try {
        const jobs = await prisma.job.findMany({
            where: {
                companyId: user.companyId,
                ...(jobType && { jobType: jobType as any }),
                ...(customerId && { customerId: parseInt(customerId) }),
            },
            include: {
                customer: {
                    select: { name: true, code: true }
                },
                branch: {
                    select: { name: true }
                },
                _count: {
                    select: { expenses: true, invoices: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ jobs });
    } catch (error) {
        console.error('Fetch jobs error:', error);
        return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const {
            jobNumber, jobType, customerId, branchId,
            vessel, place, shipperRef, gdNo, formE,
            commodity, volume, containerNo, packages,
            weight, hawbBl, handledBy, salesPerson
        } = body;

        if (!jobNumber || !customerId) {
            return NextResponse.json({ error: 'Job Number and Customer are required' }, { status: 400 });
        }

        const job = await prisma.job.create({
            data: {
                jobNumber,
                jobType,
                customerId: parseInt(customerId),
                companyId: user.companyId,
                branchId: branchId ? parseInt(branchId) : null,
                vessel,
                place,
                shipperRef,
                gdNo,
                formE,
                commodity,
                volume,
                containerNo,
                packages: packages ? parseInt(packages) : null,
                weight: weight ? parseFloat(weight) : null,
                hawbBl,
                handledBy,
                salesPerson,
            },
            include: {
                customer: true,
                branch: true
            }
        });

        return NextResponse.json({ job });
    } catch (error: any) {
        console.error('Create job error:', error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: 'Job Number already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
    }
}
