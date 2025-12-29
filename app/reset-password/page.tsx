'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordForm() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setError('Invalid or missing reset token');
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.error || 'Reset failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-black text-white mb-4 tracking-tight">Security Token Error</h1>
                <p className="mb-8 text-slate-400 font-medium">The password reset link is invalid or has expired.</p>
                <Link href="/login" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-95 inline-block text-sm uppercase tracking-widest">
                    Return to Security Portal
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {success ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-6 rounded-2xl text-center animate-in zoom-in duration-500">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                    <p className="font-bold text-white">Password Secured Successfully</p>
                    <p className="text-xs text-emerald-400/80 mt-2 font-medium">Redirecting to login portal...</p>
                </div>
            ) : (
                <>
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1 tracking-tight">New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1 tracking-tight">Confirm New Password</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className="w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm uppercase tracking-widest"
                    >
                        {loading ? 'Securing...' : 'Update Password'}
                    </button>
                </>
            )}
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 selection:bg-blue-500/30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 opacity-50" />

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 mb-6 group transition-all hover:scale-110">
                        <div className="w-8 h-8 rounded-full bg-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.5)]" />
                    </div>
                    <h1 className="text-4xl font-black text-white mb-2 tracking-tighter">Reset Security</h1>
                    <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em]">Password Recovery Portal</p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/5 shadow-2xl">
                    <Suspense fallback={<div className="text-center py-10 text-slate-500 text-sm animate-pulse">Verifying security token...</div>}>
                        <ResetPasswordForm />
                    </Suspense>

                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                        <Link href="/login" className="text-xs text-slate-500 hover:text-blue-400 transition-colors uppercase font-bold tracking-[0.2em]">
                            ← Back to Login
                        </Link>
                    </div>
                </div>

                <p className="mt-8 text-center text-slate-600 text-[10px] font-bold uppercase tracking-[0.3em]">
                    System v2.4.0 • Abdullah Ansari
                </p>
            </div>
        </div>
    );
}
