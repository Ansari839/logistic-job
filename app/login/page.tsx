'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                login(data.user);
                router.push(callbackUrl);
            } else {
                setError(data.error || 'Login failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center animate-in shake duration-300">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-300 mb-1 tracking-tight">Email Address</label>
                <input
                    type="email"
                    required
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-300 tracking-tight">Password</label>
                    <Link href="/forgot-password" title="Forgot Password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-bold uppercase tracking-tighter">
                        Forgot?
                    </Link>
                </div>
                <input
                    type="password"
                    required
                    className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm uppercase tracking-widest"
            >
                {loading ? 'Verifying...' : 'Sign In Now'}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 selection:bg-blue-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 opacity-50" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 group transition-all hover:scale-110">
                        <div className="w-8 h-8 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">LogisticOS</h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Secure Entry Portal</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                    <Suspense fallback={<div className="text-center py-10 text-slate-500 text-sm animate-pulse">Initializing security module...</div>}>
                        <LoginForm />
                    </Suspense>

                    <p className="mt-8 text-center text-slate-500 text-xs font-medium uppercase tracking-widest">
                        Protected by AES-256 Encryption
                    </p>
                </div>

                <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                    System v2.4.0 • Abdullah Ansari
                </p>
            </div>
        </div>
    );
}
