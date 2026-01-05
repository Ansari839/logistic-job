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
    { name: 'Ports (POD)', href: '/settings/pods', icon: MapPin },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isFullWidthPage = pathname.startsWith('/settings/audit-logs') || pathname.startsWith('/settings/financial-periods');

    if (isFullWidthPage) {
        return <DashboardLayout>{children}</DashboardLayout>;
    }

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
                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="font-medium text-sm">{item.name}</span>
                        </Link>
                    ))}
                </aside>

                {/* Content Area */}
                <div className="flex-1 glass-card p-8 min-h-[600px]">
                    {children}
                </div>
            </div>
        </DashboardLayout>
    );
}
