'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';

import { Ship, Wheat } from 'lucide-react';

function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

    const accentColor = 'blue';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, division: 'logistics' }),
            });

            const data = await response.json();

            if (response.ok) {
                document.cookie = `app_division=logistics; path=/; max-age=31536000`;
                localStorage.setItem('app_division', 'logistics');

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
                <label className="block text-sm font-medium text-slate-300 mb-1 tracking-tight italic uppercase tracking-widest text-[10px]">Email Address</label>
                <input
                    type="email"
                    required
                    className={`w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 transition-all placeholder:text-slate-600 font-bold`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div>
                <div className="flex justify-between mb-1">
                    <label className="block text-sm font-medium text-slate-300 tracking-tight italic uppercase tracking-widest text-[10px]">Password</label>
                    <Link href="/forgot-password" title="Forgot Password" className={`text-[10px] text-${accentColor}-400 hover:text-${accentColor}-300 transition-colors font-black uppercase tracking-widest`}>
                        Recovery
                    </Link>
                </div>
                <input
                    type="password"
                    required
                    className={`w-full bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 transition-all placeholder:text-slate-600 font-black`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className={`w-full bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white font-black py-4 rounded-xl shadow-lg shadow-${accentColor}-600/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-sm uppercase tracking-[0.2em] italic`}
            >
                {loading ? 'Verifying Identity...' : `Enter Logistic OS`}
            </button>
        </form>
    );
}

function LoginContent() {
    const accentColor = 'blue';

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 selection:bg-blue-500/30 overflow-hidden relative">
            <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-${accentColor}-900/20 via-slate-950 to-slate-950 opacity-50`} />

            <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none">
                <Ship size={400} />
            </div>

            <div className="max-w-md w-full relative z-10">
                <div className="text-center mb-10">
                    <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-${accentColor}-600/10 border border-${accentColor}-500/20 mb-6 group transition-all hover:scale-110 shadow-2xl shadow-${accentColor}-500/10`}>
                        <Ship size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-5xl font-black text-white mb-2 tracking-tighter italic uppercase">
                        Logistic<span className={`text-${accentColor}-500`}>OS</span>
                    </h1>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                        Global Freight forwarding
                    </p>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-3xl p-10 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-${accentColor}-500/50 to-transparent`} />
                    <LoginForm />

                    <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                        <p className="text-slate-500 text-[8px] font-black uppercase tracking-widest">
                            Encrypted Protocol 4.2
                        </p>
                    </div>
                </div>

                <p className="mt-10 text-center text-slate-700 text-[10px] font-bold uppercase tracking-[0.4em]">
                    Core Infrastructure • Abdullah Ansari
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-500 text-xs font-black uppercase tracking-[0.3em] animate-pulse">
                Initializing Security Module...
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
