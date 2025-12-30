import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
});

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const categories = await prisma.productCategory.findMany({
            where: { companyId: user.companyId },
            include: { _count: { select: { products: true } } },
            orderBy: { name: 'asc' },
        });

        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Fetch categories error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const body = await request.json();
        const { name, description } = categorySchema.parse(body);

        const category = await prisma.productCategory.create({
            data: {
                name,
                description,
                companyId: user.companyId,
            },
        });

        return NextResponse.json({ category });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        console.error('Create category error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
