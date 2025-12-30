import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    try {
        const invoice = await prisma.invoice.findUnique({
            where: {
                id: parseInt(id),
                companyId: user.companyId as number,
                deletedAt: null
            },
            include: {
                customer: true,
                job: {
                    include: {
                        branch: true
                    }
                },
                items: {
                    include: {
                        product: {
                            select: {
                                name: true,
                                unit: true,
                                sku: true
                            }
                        }
                    }
                },
                company: true
            }
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        return NextResponse.json({ invoice });
    } catch (error) {
        console.error('Fetch invoice error:', error);
        return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
    }
}
