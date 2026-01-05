import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { name } = await request.json();

        // Check if port belongs to user's company
        const existingPort = await prisma.port.findFirst({
            where: {
                id: parseInt(id),
                companyId: user.companyId as number
            }
        });

        if (!existingPort) {
            return NextResponse.json({ error: 'Port not found or unauthorized' }, { status: 404 });
        }

        const port = await prisma.port.update({
            where: { id: parseInt(id) },
            data: { name }
        });

        return NextResponse.json({ port });
    } catch (error) {
        console.error('Error updating port:', error);
        return NextResponse.json({ error: 'Failed to update port' }, { status: 500 });
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check ownership
        const existingPort = await prisma.port.findFirst({
            where: {
                id: parseInt(id),
                companyId: user.companyId as number
            }
        });

        if (!existingPort) {
            return NextResponse.json({ error: 'Port not found or unauthorized' }, { status: 404 });
        }

        await prisma.port.delete({
            where: { id: parseInt(id) }
        });

        return NextResponse.json({ message: 'Port deleted successfully' });
    } catch (error) {
        console.error('Error deleting port:', error);
        return NextResponse.json({ error: 'Failed to delete port' }, { status: 500 });
    }
}
