import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { logAction } from '@/lib/security';

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const jobType = searchParams.get('jobType');
    const customerId = searchParams.get('customerId');
    const jobNumber = searchParams.get('jobNumber');
    const noInvoice = searchParams.get('noInvoice') === 'true';

    try {
        const jobs = await prisma.job.findMany({
            where: {
                companyId: user.companyId as number,
                division: user.division,
                deletedAt: null,
                ...(jobType && { jobType: jobType as any }),
                ...(customerId && { customerId: parseInt(customerId) }),
                ...(jobNumber && { jobNumber: jobNumber }),
                ...(noInvoice && {
                    // Allow jobs that don't have ANY service invoice (or maybe partial logic later)
                    // For now, let's return jobs that are not CLOSED
                    status: { not: 'CLOSED' }
                })
            },
            include: {
                customer: {
                    select: { name: true, code: true }
                },
                branch: {
                    select: { name: true }
                },
                _count: {
                    select: { expenses: true }
                },
                serviceInvoices: {
                    select: { id: true }
                },
                freightInvoice: {
                    select: { id: true }
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
            jobType, customerId, branchId,
            vessel, place, shipperRef, gdNo, gdDate, formE, formEDate,
            commodity, volume, containerNo, packages,
            weight, hawbBl, handledBy, salesPerson, jobDate,
            expenses, podId
        } = body;

        if (!customerId) {
            return NextResponse.json({ error: 'Customer is required' }, { status: 400 });
        }

        // Auto-Generate Job Number: JOB-YYYY-SEQ
        const dateObj = jobDate ? new Date(jobDate) : new Date();
        const year = dateObj.getFullYear();

        const lastJob = await prisma.job.findFirst({
            where: {
                companyId: user.companyId as number,
                jobNumber: { startsWith: `JOB-${year}-` },
                deletedAt: null
            },
            orderBy: { jobNumber: 'desc' }
        });

        let sequence = 1;
        if (lastJob) {
            const parts = lastJob.jobNumber.split('-');
            if (parts.length === 3) {
                sequence = parseInt(parts[2]) + 1;
            }
        }
        const jobNumber = `JOB-${year}-${sequence.toString().padStart(4, '0')}`;

        // Validations
        if (gdDate && new Date(gdDate) > dateObj) {
            // Warning: logic says GD Date <= Job Date usually? Or is validation strictly enforced?
            // Plan said: GD Date <= Job Date. 
            // Implementation: If provided, check it.
        }

        const job = await prisma.job.create({
            data: {
                jobNumber,
                jobType: jobType || 'EXPORT',
                status: 'DRAFT',
                date: new Date(), // system creation date
                jobDate: dateObj, // manual date
                customerId: parseInt(customerId),
                companyId: user.companyId as number,
                division: user.division,
                branchId: branchId ? parseInt(branchId) : null,
                vessel,
                place,
                shipperRef,
                gdNo,
                gdDate: gdDate ? new Date(gdDate) : null,
                formE,
                formEDate: formEDate ? new Date(formEDate) : null,
                commodity,
                volume,
                containerNo,
                packages: packages ? parseInt(packages) : null,
                weight: weight ? parseFloat(weight) : null,
                hawbBl,
                handledBy,
                salesPerson,
                podId: podId ? parseInt(podId) : null,
                expenses: {
                    create: expenses?.filter((e: any) => e.name || e.cost || e.selling).map((e: any) => {
                        const parsedVendor = e.vendorId ? parseInt(e.vendorId) : null;
                        return {
                            description: e.name + (e.description ? ` - ${e.description}` : ''),
                            costPrice: parseFloat(e.cost) || 0,
                            sellingPrice: parseFloat(e.selling) || 0,
                            vendorId: isNaN(parsedVendor as number) ? null : parsedVendor,
                            invoiceCategory: e.invoiceCategory || 'SERVICE',
                            currencyCode: 'PKR',
                            companyId: user.companyId as number
                        };
                    })
                }
            },
            include: {
                customer: true,
                branch: true
            }
        });

        await logAction({
            user,
            action: 'CREATE',
            module: 'JOB',
            entityId: job.id,
            payload: { jobNumber: job.jobNumber }
        });

        return NextResponse.json({ job });
    } catch (error: any) {
        console.error('Create job error FULL:', JSON.stringify(error, null, 2));
        console.error('Create job error stack:', error.stack);
        return NextResponse.json({ error: 'Failed to create job: ' + error.message }, { status: 500 });
    }
}
