import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthToken, verifyToken } from '@/lib/auth';

export async function GET() {
    const token = await getAuthToken();
    const user = token ? verifyToken(token) : null;

    if (!user || !user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (!dbUser?.companyId) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const settings = await prisma.systemSetting.findMany({
        where: { companyId: dbUser.companyId },
    });

    return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
    const token = await getAuthToken();
    const user = token ? verifyToken(token) : null;

    if (!user || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json(); // Array of { key: string, value: string }
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!dbUser?.companyId) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        const updates = body.map((setting: any) =>
            prisma.systemSetting.upsert({
                where: {
                    companyId_key: {
                        companyId: dbUser.companyId!,
                        key: setting.key,
                    },
                },
                update: { value: setting.value },
                create: {
                    companyId: dbUser.companyId!,
                    key: setting.key,
                    value: setting.value,
                    type: setting.type || 'CONFIG',
                },
            })
        );

        await Promise.all(updates);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update settings error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
