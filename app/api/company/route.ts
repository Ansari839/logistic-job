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

        // Sanitize body to only include modifiable fields
        const {
            name, tagline, address, phone, email, website,
            industry, city, country, postalCode, registrationNo,
            state, taxNumber
        } = body;

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (tagline !== undefined) updateData.tagline = tagline;
        if (address !== undefined) updateData.address = address;
        if (phone !== undefined) updateData.phone = phone;
        if (email !== undefined) updateData.email = email;
        if (website !== undefined) updateData.website = website;
        if (industry !== undefined) updateData.industry = industry;
        if (city !== undefined) updateData.city = city;
        if (country !== undefined) updateData.country = country;
        if (postalCode !== undefined) updateData.postalCode = postalCode;
        if (registrationNo !== undefined) updateData.registrationNo = registrationNo;
        if (state !== undefined) updateData.state = state;
        if (taxNumber !== undefined) updateData.taxNumber = taxNumber;

        if (!user.companyId) {
            return NextResponse.json({ error: 'Company not found for this user' }, { status: 404 });
        }

        const updatedCompany = await prisma.company.update({
            where: { id: user.companyId },
            data: updateData,
        });

        return NextResponse.json(updatedCompany);
    } catch (error: any) {
        console.error('Update company error:', error);
        return NextResponse.json({
            error: 'Internal server error',
            details: error.message
        }, { status: 500 });
    }
}
