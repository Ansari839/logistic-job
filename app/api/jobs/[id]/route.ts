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
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const job = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            include: {
                customer: true,
                branch: true,
                expenses: {
                    include: { vendor: { select: { name: true, code: true } } },
                    orderBy: { createdAt: 'desc' }
                },
                invoice: {
                    include: { items: true }
                }
            }
        });

        if (!job || job.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ job });
    } catch (error) {
        console.error('Get job error:', error);
        return NextResponse.json({ error: 'Failed to get job' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const body = await request.json();
        const {
            jobType, customerId, branchId,
            vessel, place, shipperRef, gdNo, formE,
            commodity, volume, containerNo, packages,
            weight, hawbBl, handledBy, salesPerson
        } = body;

        // Check ownership and status
        const existingJob = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            select: { companyId: true, status: true }
        });

        if (!existingJob || existingJob.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (existingJob.status === 'CLOSED') {
            return NextResponse.json({ error: 'Job is locked (Status: CLOSED). Revert invoice to draft to make changes.' }, { status: 400 });
        }

        const job = await prisma.job.update({
            where: { id: parseInt(id) },
            data: {
                jobType,
                customerId: customerId ? parseInt(customerId) : undefined,
                branchId: branchId ? parseInt(branchId) : undefined,
                vessel,
                place,
                shipperRef,
                gdNo,
                formE,
                commodity,
                volume,
                containerNo,
                packages: packages ? parseInt(packages) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                hawbBl,
                handledBy,
                salesPerson,
            }
        });

        return NextResponse.json({ job });
    } catch (error) {
        console.error('Update job error:', error);
        return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        // Check ownership
        const existingJob = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            select: { companyId: true }
        });

        if (!existingJob || existingJob.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        await prisma.job.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }
}
