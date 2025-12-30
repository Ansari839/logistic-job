'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from '@/components/ThemeProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, BarChart2, Shield, LogOut,
    Package, CreditCard, FileText, Sun, Moon, Menu, X,
    Building2, BookOpen, ArrowRightLeft, Settings,
    Box, ShoppingBag
} from 'lucide-react';

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
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['ADMIN', 'ACCOUNTS', 'SALES'] },
    { name: 'Vendors', href: '/vendors', icon: Building2, roles: ['ADMIN', 'OPERATOR'] },
    { name: 'Inventory', href: '/inventory', icon: Box, roles: ['ADMIN', 'OPERATOR', 'SALES'] },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Journal Vouchers', href: '/vouchers', icon: ArrowRightLeft, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Financial Reports', href: '/reports', icon: BarChart2, roles: ['ADMIN', 'ACCOUNTS'] },
    { name: 'Settings', href: '/settings/profile', icon: Settings, roles: ['ADMIN'] },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Loading...</div>;
    }

    if (!user) return null;

    const filteredNavItems = navItems.filter(item => {
        if (item.roles && !item.roles.includes(user.role)) return false;
        if (item.attributes) {
            if (item.attributes.branch && user.branch && !item.attributes.branch.includes(user.branch)) return false;
            if (item.attributes.department && user.department && !item.attributes.department.includes(user.department)) return false;
        }
        return true;
    });

    return (
        <div className={`min-h-screen font-sans ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out border-r
        ${theme === 'dark' ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-6 flex justify-between items-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                        LogisticOS
                    </h2>
                    <button className="lg:hidden p-2 rounded-lg hover:bg-slate-800/10" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname.startsWith(item.href.split('/')[1] === 'settings' ? '/settings' : item.href)
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : theme === 'dark' ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg mb-4 transition-all ${theme === 'dark' ? 'bg-slate-900 text-sky-400' : 'bg-slate-100 text-amber-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            <span className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative p-1 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`}>
                            <div className={`w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <div className="flex items-center space-x-3 px-4 py-2 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 ${theme === 'dark' ? 'bg-slate-800 ring-slate-700' : 'bg-slate-200 ring-slate-100'
                            }`}>
                            {user.name?.charAt(0) || user.email.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate lowercase">{user.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all font-medium"
                    >
                        <LogOut size={18} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-64'}`}>
                <header className={`sticky top-0 z-30 flex items-center justify-between p-4 lg:p-8 backdrop-blur-md border-b ${theme === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'
                    }`}>
                    <div className="flex items-center space-x-4">
                        <button
                            className="lg:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl lg:text-3xl font-bold capitalize">
                                {pathname.split('/')[2] || pathname.split('/')[1] || 'Dashboard'}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <div className="hidden sm:block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                            {user.branch || 'Head Office'}
                        </div>
                    </div>
                </header>

                <main className="p-4 lg:p-8">
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
