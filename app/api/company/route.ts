import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET() {
    const token = await getAuthToken();
    const user = token ? verifyToken(token) : null;

    if (!user || !user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get company directly
    if (!user.companyId) {
        return NextResponse.json({ error: 'User has no company assigned' }, { status: 400 });
    }

    const company = await prisma.company.findUnique({
        where: { id: user.companyId },
        include: { branches: true }
    });

    if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    return NextResponse.json({ company });
}

export async function PATCH(request: Request) {
    const token = await getAuthToken();
    const user = token ? verifyToken(token) : null;

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const updatedCompany = await prisma.company.update({
            where: { id: dbUser.companyId },
            data: body,
        });

        return NextResponse.json(updatedCompany);
    } catch (error) {
        console.error('Update company error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
