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
    parentId: z.preprocess((val) => {
        if (val === '' || val === null || val === undefined) return null;
        return Number(val);
    }, z.number().nullable().optional()),
    partnerDetails: z.object({
        address: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        taxNumber: z.string().optional(),
        type: z.enum(['CUSTOMER', 'VENDOR'])
    }).optional()
});

async function getAuthUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function GET(request: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const suggestCode = searchParams.get('suggestCode');
    const parentId = searchParams.get('parentId');

    try {
        if (suggestCode && parentId) {
            const pid = parseInt(parentId);
            const parent = await prisma.account.findUnique({ where: { id: pid } });
            if (!parent) return NextResponse.json({ error: 'Parent not found' }, { status: 404 });

            const lastChild = await prisma.account.findFirst({
                where: { parentId: pid, companyId: user.companyId as number },
                orderBy: { code: 'desc' }
            });

            let nextCode: string;
            const parentCodeInt = parseInt(parent.code);

            if (!lastChild) {
                // Determine increment based on parent code pattern
                if (parent.code.endsWith('000')) nextCode = (parentCodeInt + 100).toString();
                else if (parent.code.endsWith('00')) nextCode = (parentCodeInt + 10).toString();
                else nextCode = (parentCodeInt + 1).toString();
            } else {
                // Increment last child
                const lastCodeInt = parseInt(lastChild.code);
                nextCode = (lastCodeInt + 1).toString(); // Always increment by 1 for existing level

                // Special case for root-to-level1 jump if only root exists
                if (parent.code.endsWith('000') && lastCodeInt === parentCodeInt) {
                    nextCode = (parentCodeInt + 100).toString();
                }
            }

            return NextResponse.json({ nextCode });
        }

        const accounts = await prisma.account.findMany({
            where: {
                companyId: user.companyId,
                division: user.division
            },
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
    if (!user || !user.companyId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const validatedData = accountSchema.parse(body);

        const { partnerDetails, ...accountData } = validatedData;

        const account = await prisma.$transaction(async (tx) => {
            const newAccount = await tx.account.create({
                data: {
                    ...accountData,
                    companyId: user.companyId!,
                    division: user.division,
                },
            });

            if (partnerDetails) {
                if (partnerDetails.type === 'CUSTOMER') {
                    await tx.customer.create({
                        data: {
                            name: accountData.name,
                            code: accountData.code,
                            address: partnerDetails.address,
                            phone: partnerDetails.phone,
                            email: partnerDetails.email,
                            taxNumber: partnerDetails.taxNumber,
                            accountId: newAccount.id,
                            companyId: user.companyId!,
                            division: user.division
                        }
                    });
                } else if (partnerDetails.type === 'VENDOR') {
                    await tx.vendor.create({
                        data: {
                            name: accountData.name,
                            code: accountData.code,
                            address: partnerDetails.address,
                            phone: partnerDetails.phone,
                            email: partnerDetails.email,
                            taxNumber: partnerDetails.taxNumber,
                            accountId: newAccount.id,
                            companyId: user.companyId!,
                            division: user.division
                        }
                    });
                }
            }

            return newAccount;
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
export async function PATCH(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId || (user.role !== 'ADMIN' && user.role !== 'ACCOUNTS')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, code, name, type, description, parentId } = body;

        if (!id) return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });

        const account = await prisma.account.update({
            where: { id: parseInt(id), companyId: user.companyId },
            data: {
                code,
                name,
                type,
                description,
                parentId: parentId ? parseInt(parentId) : null,
            },
        });

        return NextResponse.json({ account, message: 'Account updated successfully' });
    } catch (error) {
        console.error('Update account error:', error);
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const user = await getAuthUser();
    if (!user || !user.companyId || user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });

        const accountId = parseInt(id);

        // Safety Check 1: Check for children
        const hasChildren = await prisma.account.count({
            where: { parentId: accountId }
        });
        if (hasChildren > 0) {
            return NextResponse.json({ error: 'Cannot delete account with child accounts' }, { status: 400 });
        }

        // Safety Check 2: Check for transactions
        const hasTransactions = await prisma.accountEntry.count({
            where: { accountId: accountId }
        });
        if (hasTransactions > 0) {
            return NextResponse.json({ error: 'Cannot delete account with existing transactions' }, { status: 400 });
        }

        await prisma.account.delete({
            where: { id: accountId, companyId: user.companyId },
        });

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
