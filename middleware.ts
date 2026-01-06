import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-default-secret-key-change-it'
);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const { pathname } = request.nextUrl;

    // Paths that don't require authentication
    const publicPaths = ['/login', '/forgot-password', '/reset-password', '/api/auth/login', '/api/auth/forgot-password', '/api/auth/reset-password'];

    // Check if it's the root path or a public path
    const isPublicPath = pathname === '/' || publicPaths.some(path => pathname.startsWith(path));

    if (isPublicPath) {
        // If user is already logged in and tries to access login or root
        if (token && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/')) {
            const division = request.nextUrl.searchParams.get('division');

            // If they are on root and just want to go to dashboard, let them or redirect
            if (pathname === '/') {
                return NextResponse.next();
            }

            // If they are on login/forgot-password with a division, update the division cookie and go to dashboard
            if (division) {
                const response = NextResponse.redirect(new URL('/dashboard', request.url));
                response.cookies.set('app_division', division, { maxAge: 31536000, path: '/' });
                return response;
            }

            return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        return NextResponse.next();
    }

    if (!token) {
        // Redirect to login if no token and accessing protected route
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(loginUrl);
    }

    try {
        // Verify token
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const userRole = payload.role as string;

        // RBAC Example: Protect admin routes
        if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        // You can add more path-based role checks here
        // Example: Sales module
        if (pathname.startsWith('/sales') && !['ADMIN', 'SALES'].includes(userRole)) {
            return NextResponse.redirect(new URL('/unauthorized', request.url));
        }

        return NextResponse.next();
    } catch (error) {
        // Token is invalid or expired
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('auth_token');
        return response;
    }
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes except /api/auth/*)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
