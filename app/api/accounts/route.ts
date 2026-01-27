import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import prisma from '@/lib/prisma';

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

        const typeFilter = searchParams.get('type');

        const accounts = await prisma.account.findMany({
            where: {
                companyId: user.companyId,
                ...(user.division ? {
                    OR: [
                        { division: user.division },
                        { division: null }
                    ]
                } : {}),
                ...(typeFilter ? { type: typeFilter as any } : {})
            },
            include: {
                parent: { select: { name: true, code: true } },
                customer: true,
                vendor: true,
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

    let body, validatedData, accountData, partnerDetails;
    try {
        body = await req.json();
        validatedData = accountSchema.parse(body);
        ({ partnerDetails, ...accountData } = validatedData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    let attempts = 0;
    while (attempts < 3) {
        try {
            // Transaction logic
            const account = await prisma.$transaction(async (tx: any) => {
                const newAccount = await tx.account.create({
                    data: {
                        ...accountData,
                        companyId: user.companyId!,
                        division: user.division,
                    },
                });

                if (partnerDetails) {
                    const partnerData = {
                        name: accountData.name,
                        code: accountData.code,
                        address: partnerDetails.address,
                        phone: partnerDetails.phone,
                        email: partnerDetails.email,
                        taxNumber: partnerDetails.taxNumber,
                        accountId: newAccount.id,
                        companyId: user.companyId!,
                        division: user.division
                    };

                    if (partnerDetails.type === 'CUSTOMER') {
                        await tx.customer.create({ data: partnerData });
                    } else if (partnerDetails.type === 'VENDOR') {
                        await tx.vendor.create({ data: partnerData });
                    }
                }

                return newAccount;
            }, {
                maxWait: 5000, // Default: 2000
                timeout: 5000  // Default: 5000
            });

            return NextResponse.json({ account, message: 'Account created successfully' });

        } catch (error: any) {
            attempts++;
            // Check if error is P2028 or retry-able
            const isRetryable = error.code === 'P2028' || error.message?.includes('Transaction API error');

            if (!isRetryable || attempts >= 3) {
                console.error('Create account error:', error);
                if (error instanceof z.ZodError) {
                    return NextResponse.json({ error: 'Invalid data', details: error.issues }, { status: 400 });
                }
                // Handle Unique Constraint specifically if needed
                if (error.code === 'P2002') {
                    return NextResponse.json({ error: 'Account code or name already exists' }, { status: 400 });
                }
                return NextResponse.json({ error: 'Failed to create account (System Error)' }, { status: 500 });
            }
            // If retryable, loop continues
            console.warn(`Retrying account creation (Attempt ${attempts})...`);
            await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
        }
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

        const account = await prisma.$transaction(async (tx: any) => {
            const updatedAccount = await tx.account.update({
                where: { id: parseInt(id), companyId: user.companyId },
                data: {
                    code,
                    name,
                    type,
                    description,
                    parentId: parentId ? parseInt(parentId) : null,
                },
            });

            // If partnerDetails are provided (even if empty, but we check if type is present)
            if (body.partnerDetails && body.partnerDetails.type) {
                const partnerType = body.partnerDetails.type;
                const partnerData = {
                    name: updatedAccount.name,
                    code: updatedAccount.code,
                    address: body.partnerDetails.address,
                    phone: body.partnerDetails.phone,
                    email: body.partnerDetails.email,
                    taxNumber: body.partnerDetails.taxNumber,
                };

                if (partnerType === 'CUSTOMER') {
                    await tx.customer.upsert({
                        where: { accountId: updatedAccount.id },
                        update: partnerData,
                        create: {
                            ...partnerData,
                            accountId: updatedAccount.id,
                            companyId: user.companyId!,
                            division: user.division
                        }
                    });
                } else if (partnerType === 'VENDOR') {
                    await tx.vendor.upsert({
                        where: { accountId: updatedAccount.id },
                        update: partnerData,
                        create: {
                            ...partnerData,
                            accountId: updatedAccount.id,
                            companyId: user.companyId!,
                            division: user.division
                        }
                    });
                }
            }

            return updatedAccount;
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
