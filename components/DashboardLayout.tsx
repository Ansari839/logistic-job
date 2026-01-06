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
    Box, ShoppingBag,
    History as HistoryIcon,
    Lock as LockIcon
} from 'lucide-react';

interface NavItem {
    name: string;
    href: string;
    icon: React.ElementType;
    roles?: string[];
    division?: 'logistics' | 'animal-feed' | 'both';
    attributes?: {
        branch?: string[];
        department?: string[];
    };
}

const navItems: NavItem[] = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, division: 'both' },
    { name: 'Jobs', href: '/jobs', icon: Package, roles: ['ADMIN', 'OPERATOR', 'SALES'], division: 'logistics' },
    { name: 'Invoices', href: '/invoices', icon: FileText, roles: ['ADMIN', 'ACCOUNTS', 'SALES'], division: 'logistics' },
    { name: 'Vendors', href: '/vendors', icon: Building2, roles: ['ADMIN', 'OPERATOR'], division: 'both' },
    { name: 'Inventory', href: '/inventory', icon: Box, roles: ['ADMIN', 'OPERATOR', 'SALES'], division: 'animal-feed' },
    { name: 'Purchases', href: '/purchases', icon: ShoppingBag, roles: ['ADMIN', 'ACCOUNTS'], division: 'animal-feed' },
    { name: 'Chart of Accounts', href: '/accounts', icon: BookOpen, roles: ['ADMIN', 'ACCOUNTS'], division: 'both' },
    { name: 'Journal Vouchers', href: '/vouchers', icon: ArrowRightLeft, roles: ['ADMIN', 'ACCOUNTS'], division: 'both' },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['ADMIN', 'ACCOUNTS'], division: 'both' },
    { name: 'Business Reports', href: '/reports', icon: BarChart2, roles: ['ADMIN', 'ACCOUNTS', 'OPERATOR', 'SALES'], division: 'both' },
    { name: 'Audit Logs', href: '/settings/audit-logs', icon: HistoryIcon, roles: ['ADMIN'], division: 'both' },
    { name: 'Financial Periods', href: '/settings/financial-periods', icon: LockIcon, roles: ['ADMIN'], division: 'both' },
    { name: 'System Settings', href: '/settings/system', icon: Settings, roles: ['ADMIN'], division: 'both' },
];


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, logout, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const pathname = usePathname();

    const [activeDivision, setActiveDivision] = useState<string | null>(null);
    const [companyName, setCompanyName] = useState('LogisticOS');

    React.useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const cookieDiv = getCookie('app_division');
        const stored = cookieDiv || localStorage.getItem('app_division') || 'logistics';

        // Sync localStorage if needed
        if (cookieDiv && cookieDiv !== localStorage.getItem('app_division')) {
            localStorage.setItem('app_division', cookieDiv);
        }

        setActiveDivision(stored);
        setCompanyName(stored === 'animal-feed' ? 'FeedOS' : 'LogisticOS');

        const fetchCompany = async () => {
            try {
                const res = await fetch('/api/company');
                if (res.ok) {
                    const data = await res.json();
                    if (data.name) setCompanyName(data.name);
                }
            } catch (error) {
                console.error('Failed to fetch company info');
            }
        };
        fetchCompany();
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-background flex items-center justify-center text-foreground">Loading...</div>;
    }

    if (!user) return null;

    const filteredNavItems = navItems.filter(item => {
        if (item.roles && !item.roles.includes(user.role)) return false;
        if (activeDivision && item.division && item.division !== 'both' && item.division !== activeDivision) return false;
        if (item.attributes) {
            if (item.attributes.branch && user.branch && !item.attributes.branch.includes(user.branch)) return false;
            if (item.attributes.department && user.department && !item.attributes.department.includes(user.department)) return false;
        }
        return true;
    });

    const isAnimalFeed = activeDivision === 'animal-feed';
    const accentColorClass = isAnimalFeed ? 'emerald' : 'blue';
    const accentGradient = isAnimalFeed ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-indigo-500';

    return (
        <div className="min-h-screen font-sans bg-background text-foreground">
            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out border-r backdrop-blur-md
        bg-card/80 border-border
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
                <div className="p-6 flex justify-between items-center">
                    <h2 className={`text-xl font-bold bg-gradient-to-r ${accentGradient} bg-clip-text text-transparent truncate`} title={companyName}>
                        {companyName}
                    </h2>
                    <button className="lg:hidden p-2 rounded-lg hover:bg-accent/10 text-foreground" onClick={() => setIsSidebarOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1">
                    {filteredNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-border">
                    <button
                        onClick={toggleTheme}
                        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg mb-4 transition-all ${theme === 'dark' ? 'bg-secondary text-primary' : 'bg-secondary text-amber-600'
                            }`}
                    >
                        <div className="flex items-center space-x-3">
                            {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                            <span className="text-sm font-medium">{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative p-1 ${theme === 'dark' ? 'bg-background' : 'bg-input'}`}>
                            <div className={`w-3 h-3 rounded-full bg-foreground shadow-sm transform transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </button>

                    <div className="flex items-center space-x-3 px-4 py-2 mb-4">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ring-2 bg-secondary ring-border text-foreground">
                            {user.name?.charAt(0) || user.email.charAt(0)}
                        </div>
                        <div className="overflow-hidden text-foreground">
                            <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate lowercase">{user.role}</p>
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
                <header className="sticky top-0 z-30 flex items-center justify-between p-4 lg:p-8 backdrop-blur-md border-b bg-background/80 border-border">
                    <div className="flex items-center space-x-4">
                        <button
                            className="lg:hidden p-2 rounded-xl bg-accent hover:bg-accent/80 text-foreground"
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
                        <div className={`hidden sm:block px-3 py-1 rounded-full bg-${accentColorClass}-500/10 border border-${accentColorClass}-500/20 text-${accentColorClass}-400 text-[10px] font-bold uppercase tracking-wider`}>
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
