import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    password: z.string().min(6).optional(),
    role: z.enum(['ADMIN', 'ACCOUNTS', 'OPERATOR', 'SALES']).optional(),
    branch: z.string().optional(),
    department: z.string().optional(),
    region: z.string().optional(),
    division: z.string().optional(),
});

// GET /api/users/[id] - Get single user
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const targetUser = await prisma.user.findFirst({
            where: {
                id: parseInt(id),
                companyId: user.companyId, // Ensure company-scoped access
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                branch: true,
                department: true,
                region: true,
                division: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(targetUser);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
}

// PATCH /api/users/[id] - Update user
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const body = await req.json();
        const validatedData = updateUserSchema.parse(body);

        // Verify user belongs to same company
        const targetUser = await prisma.user.findFirst({
            where: {
                id: parseInt(id),
                companyId: user.companyId,
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prepare update data
        const updateData: any = {
            name: validatedData.name,
            role: validatedData.role,
            branch: validatedData.branch,
            department: validatedData.department,
            region: validatedData.region,
            division: validatedData.division,
        };

        // Hash password if provided
        if (validatedData.password) {
            updateData.password = await bcrypt.hash(validatedData.password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                branch: true,
                department: true,
                region: true,
                division: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
        }
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await verifyToken(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;

        // Verify user belongs to same company
        const targetUser = await prisma.user.findFirst({
            where: {
                id: parseInt(id),
                companyId: user.companyId,
            },
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent deleting yourself
        if (targetUser.id === user.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
}
