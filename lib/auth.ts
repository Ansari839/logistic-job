import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key-change-it';
const JWT_EXPIRES_IN = '1d';

export interface AuthUser {
    id: number;
    email: string;
    name: string | null;
    role: string;
    branch: string | null;
    department: string | null;
    region: string | null;
    companyId: number | null;
    division: string | null;
}

export const hashPassword = async (password: string) => {
    return bcrypt.hash(password, 10);
};

export const comparePassword = async (password: string, hashed: string) => {
    return bcrypt.compare(password, hashed);
};

export const signToken = (payload: AuthUser) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): AuthUser | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as AuthUser;
    } catch (error) {
        return null;
    }
};

export const setAuthCookie = async (token: string) => {
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
    });
};

export const getAuthToken = async () => {
    const cookieStore = await cookies();
    return cookieStore.get('auth_token')?.value;
};

export const clearAuthCookie = async () => {
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
};

export const getAuthUser = async (): Promise<AuthUser | null> => {
    const token = await getAuthToken();
    if (!token) return null;
    return verifyToken(token);
};
