'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Globe, Percent, Settings as SettingsIcon, MapPin } from 'lucide-react';

const settingsNav = [
    { name: 'Company Profile', href: '/settings/profile', icon: Building2 },
    { name: 'Currencies', href: '/settings/currencies', icon: Globe },
    { name: 'Tax Rules', href: '/settings/taxes', icon: Percent },
    { name: 'System Config', href: '/settings/system', icon: SettingsIcon },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <DashboardLayout>
            <div className="flex flex-col lg:flex-row gap-8">
                {/* Settings Sidebar */}
                <aside className="w-full lg:w-64 space-y-1">
                    {settingsNav.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${pathname === item.href
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    ))}
                </aside>

                {/* Content Area */}
                <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-2xl p-8 min-h-[600px]">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
