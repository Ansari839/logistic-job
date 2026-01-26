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

    // Check if it's a public path
    const isPublicPath = publicPaths.some(path => pathname.startsWith(path)) || pathname === '/';

    if (isPublicPath) {
        // If user is already logged in and tries to access login/public paths, go to dashboard
        if (token && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/')) {
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
