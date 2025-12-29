'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 font-sans text-slate-200">
            <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-2xl">
                <div className="inline-flex items-center justify-center p-4 rounded-full bg-red-500/10 text-red-500 mb-6">
                    <ShieldAlert size={48} />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
                <p className="text-slate-400 mb-8">
                    You do not have the required permissions to access this module. Please contact your system administrator if you believe this is an error.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-block bg-slate-800 hover:bg-slate-700 text-white font-semibold px-6 py-3 rounded-lg transition-all"
                >
                    Return to Dashboard
                </Link>
            </div>
        </div>
    );
}
