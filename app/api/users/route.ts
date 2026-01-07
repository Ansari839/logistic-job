import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyToken, getAuthToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const userSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1),
    password: z.string().min(6),
    role: z.enum(['ADMIN', 'ACCOUNTS', 'OPERATOR', 'SALES']),
    branch: z.string().optional(),
    department: z.string().optional(),
    region: z.string().optional(),
    division: z.string().optional(),
});

// GET /api/users - List all users (filtered by company)
export async function GET(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN can view users
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';

        const users = await prisma.user.findMany({
            where: {
                companyId: user.companyId,
                OR: search ? [
                    { name: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } },
                ] : undefined,
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
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

// POST /api/users - Create new user
export async function POST(req: NextRequest) {
    try {
        const token = await getAuthToken();
        const user = token ? verifyToken(token) : null;
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Only ADMIN can create users
        if (user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const validatedData = userSchema.parse(body);

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: validatedData.email },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(validatedData.password, 10);

        // Create user
        const newUser = await prisma.user.create({
            data: {
                email: validatedData.email,
                name: validatedData.name,
                password: hashedPassword,
                role: validatedData.role,
                branch: validatedData.branch,
                department: validatedData.department,
                region: validatedData.region,
                division: validatedData.division || user.division,
                companyId: user.companyId,
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
            },
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid input', details: error.issues }, { status: 400 });
        }
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }
}
