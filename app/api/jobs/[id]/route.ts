import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { logAction } from '@/lib/security';

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
                serviceInvoices: {
                    include: { items: true }
                },
                freightInvoice: {
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
            vessel, place, shipperRef, gdNo, gdDate, formE, formEDate,
            commodity, volume, containerNo, packages,
            weight, hawbBl, handledBy, salesPerson, jobDate,
            expenses, podId
        } = body;

        // Check ownership and status
        const existingJob = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            select: { companyId: true, status: true, jobNumber: true }
        });

        if (!existingJob || existingJob.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        if (existingJob.status === 'CLOSED') {
            return NextResponse.json({ error: 'Job is locked (Status: CLOSED). Revert invoice to draft to make changes.' }, { status: 400 });
        }

        const job = await prisma.$transaction(async (tx: any) => {
            // 1. Update Job Core Data
            const updatedJob = await tx.job.update({
                where: { id: parseInt(id) },
                data: {
                    jobType: jobType || undefined,
                    jobDate: jobDate ? new Date(jobDate) : undefined,
                    customerId: customerId ? parseInt(customerId) : undefined,
                    branchId: branchId ? parseInt(branchId) : (branchId === null ? null : undefined),
                    vessel,
                    place,
                    shipperRef,
                    gdNo,
                    gdDate: gdDate ? new Date(gdDate) : (gdDate === null ? null : undefined),
                    formE,
                    formEDate: formEDate ? new Date(formEDate) : (formEDate === null ? null : undefined),
                    commodity,
                    volume,
                    containerNo,
                    packages: packages ? parseInt(packages) : undefined,
                    weight: weight ? parseFloat(weight) : undefined,
                    hawbBl,
                    handledBy,
                    salesPerson,
                    podId: podId ? parseInt(podId) : (podId === null ? null : undefined),
                }
            });

            // 2. Sync Expenses if provided
            if (expenses && Array.isArray(expenses)) {
                // Delete existing expenses
                await tx.expense.deleteMany({
                    where: { jobId: parseInt(id) }
                });

                // Create new ones
                if (expenses.length > 0) {
                    await tx.expense.createMany({
                        data: expenses.filter((e: any) => e.name || e.cost || e.selling).map((e: any) => ({
                            jobId: parseInt(id),
                            description: e.name + (e.description ? ` - ${e.description}` : ''),
                            costPrice: parseFloat(e.cost) || 0,
                            sellingPrice: parseFloat(e.selling) || 0,
                            vendorId: e.vendorId ? parseInt(e.vendorId) : null,
                            invoiceCategory: e.invoiceCategory || 'SERVICE',
                            currencyCode: 'PKR',
                            companyId: user.companyId as number,
                        }))
                    });
                }
            }

            return updatedJob;
        });

        await logAction({
            user,
            action: 'UPDATE',
            module: 'JOB',
            entityId: job.id,
            payload: { jobNumber: job.jobNumber }
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
            select: { companyId: true, status: true }
        });

        if (!existingJob || existingJob.companyId !== user.companyId) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        await prisma.$transaction(async (tx: any) => {
            if (existingJob.status === 'DRAFT') {
                // Hard Delete
                await tx.expense.deleteMany({ where: { jobId: parseInt(id) } });

                const serviceInvoices = await tx.serviceInvoice.findMany({ where: { jobId: parseInt(id) } });
                for (const inv of serviceInvoices) {
                    await tx.serviceInvoiceItem.deleteMany({ where: { invoiceId: inv.id } });
                    await tx.stockMovement.deleteMany({ where: { reference: inv.invoiceNumber, companyId: user.companyId } });
                }
                await tx.serviceInvoice.deleteMany({ where: { jobId: parseInt(id) } });

                const freightInvoices = await tx.freightInvoice.findMany({ where: { jobId: parseInt(id) } });
                for (const inv of freightInvoices) {
                    await tx.freightInvoiceItem.deleteMany({ where: { invoiceId: inv.id } });
                }
                await tx.freightInvoice.deleteMany({ where: { jobId: parseInt(id) } });

                await tx.job.delete({ where: { id: parseInt(id) } });
            } else if (existingJob.status === 'IN_PROGRESS' || existingJob.status === 'CLOSED') {
                // Soft Delete (Void)
                await tx.job.update({
                    where: { id: parseInt(id) },
                    data: { status: 'CANCELLED' }
                });
            } else if (existingJob.status === 'CANCELLED') {
                return; // Already cancelled, nothing to do
            }
        });

        return NextResponse.json({ message: 'Job deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }
}
