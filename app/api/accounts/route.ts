import { NextResponse } from 'next/server';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

const accountSchema = z.object({
    code: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
    description: z.string().optional(),
    parentId: z.number().nullable().optional(),
});

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET() {
    const user = await getAuthUser();
    if (!user || !user.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const accounts = await prisma.account.findMany({
            where: { companyId: user.companyId },
            include: {
                parent: { select: { name: true, code: true } },
                _count: { select: { children: true } }
            },
            orderBy: { code: 'asc' },
        });

        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Fetch accounts error:', error);
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = accountSchema.parse(body);

        const account = await prisma.account.create({
            data: {
                ...validatedData,
                companyId: user.companyId,
            },
        });

        return NextResponse.json({ account, message: 'Account created successfully' });
    } catch (error) {
        console.error('Create account error:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
