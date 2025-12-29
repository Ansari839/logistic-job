'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart2, Shield, LogOut, Package, CreditCard, FileText } from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
    attributes?: {
        branch?: string[];
        department?: string[];
    };
}

const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs', href: '/jobs', icon: Package, roles: ['ADMIN', 'OPERATOR', 'SALES'] },
    { name: 'Reports', href: '/reports', icon: BarChart2, roles: ['ADMIN', 'SALES'] },
    { name: 'Ledgers', href: '/ledgers', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Users', href: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Settings', href: '/settings', icon: Shield },
];

function BookOpen(props: any) {
    return <FileText {...props} />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const pathname = usePathname();

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    // Filter nav items based on RBAC and ABAC
    const filteredNavItems = navItems.filter(item => {
        // Check Role
        if (item.roles && !item.roles.includes(user.role)) return false;

        // Check Attributes (ABAC example)
        if (item.attributes) {
            if (item.attributes.branch && user.branch && !item.attributes.branch.includes(user.branch)) return false;
            if (item.attributes.department && user.department && !item.attributes.department.includes(user.department)) return false;
        }

        return true;
    });

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col fixed inset-y-0">
                <div className="p-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                        LogisticOS
                    </h2>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${pathname === item.href
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <div className="flex items-center space-x-3 px-4 py-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold ring-2 ring-slate-700">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 p-8">
                <header className="mb-8 border-b border-slate-800 pb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white capitalize">{pathname.split('/').pop() || 'Dashboard'}</h1>
                        <p className="text-slate-400 mt-1">
                            Welcome back, {user.name}. You are logged in at {user.branch || 'Global'} branch.
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
                            {user.role}
                        </div>
                        {user.region && (
                            <div className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider">
                                {user.region}
                            </div>
                        )}
                    </div>
                </header>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {children}
                </div>
            </main>
        </div>
    );
}
