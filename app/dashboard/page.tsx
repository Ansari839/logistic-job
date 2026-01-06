'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import {
    Package, TrendingUp, Users, AlertCircle, CheckCircle,
    Clock, Zap, Target, Box, ShoppingCart, Activity
} from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();
    const [activeDivision, setActiveDivision] = React.useState<string | null>(null);

    React.useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const cookieDiv = getCookie('app_division');
        setActiveDivision(cookieDiv || localStorage.getItem('app_division') || 'logistics');
    }, []);

    const isAnimalFeed = activeDivision === 'animal-feed';
    const accentColor = isAnimalFeed ? 'emerald' : 'blue';

    const logisticsStats = [
        { name: 'Active Jobs', value: '12', icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { name: 'Completion Rate', value: '94%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { name: 'Operators Online', value: '8', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { name: 'Pending Alerts', value: '3', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    ];

    const feedStats = [
        { name: 'Stock Items', value: '142', icon: Box, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
        { name: 'Purchase Orders', value: '28', icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        { name: 'Warehouse Utilization', value: '78%', icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
        { name: 'Low Stock Alerts', value: '5', icon: AlertCircle, color: 'text-rose-400', bg: 'bg-rose-400/10' },
    ];

    const stats = isAnimalFeed ? feedStats : logisticsStats;

    return (
        <DashboardLayout>
            {/* Welcome Section */}
            <div className={`mb-10 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-${accentColor}-600/20 to-indigo-600/20 border border-${accentColor}-500/20 shadow-xl shadow-${accentColor}-500/5`}>
                <div className="absolute top-0 right-0 p-8 opacity-15">
                    <Zap size={120} className={`text-${accentColor}-600 dark:text-${accentColor}-400`} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-subtext max-w-lg leading-relaxed">
                        Your {isAnimalFeed ? 'feed supply' : 'logistics'} operation at <span className={`text-${accentColor}-600 dark:text-${accentColor}-400 font-bold`}>{user?.branch || 'Head Office'}</span> is performing <span className="text-emerald-600 dark:text-emerald-400 font-bold">12% better</span> today.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-${accentColor}-600/20 active:scale-95 text-sm`}>
                            {isAnimalFeed ? 'New Purchase' : 'Create New Job'}
                        </button>
                        <button className="bg-background/20 hover:bg-background/40 text-slate-900 dark:text-white border border-border px-6 py-2.5 rounded-xl font-bold transition-all text-sm backdrop-blur-md">
                            View Reports
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={stat.name} className="glass-card p-6 rounded-3xl transition-all hover:translate-y-[-4px]">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-border`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-subtext text-xs font-bold uppercase tracking-widest">{stat.name}</p>
                        <div className="flex items-baseline space-x-2 mt-1">
                            <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">↑ 4%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden h-fit">
                    <div className="p-8 border-b border-border flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Live Activity</h3>
                            <p className="text-xs text-subtext mt-1">Real-time status updates from all areas</p>
                        </div>
                        <button className="p-2 bg-background border border-border rounded-lg hover:bg-primary/5 transition-colors">
                            <Clock size={16} className="text-subtext" />
                        </button>
                    </div>
                    <div className="p-8 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start space-x-6 group">
                                <div className="relative mt-1">
                                    <div className={`w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-${accentColor}-600 dark:text-${accentColor}-400 group-hover:scale-110 transition-transform border border-border`}>
                                        {isAnimalFeed ? <Box size={18} /> : <CheckCircle size={18} />}
                                    </div>
                                    {i < 3 && <div className="absolute top-10 left-1/2 w-0.5 h-10 bg-border -translate-x-1/2" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-slate-900 dark:text-white font-bold">
                                            {isAnimalFeed ? `Stock Batch #F-550${i} Received` : `Shipment #LGS-990${i} Delivered`}
                                        </p>
                                        <span className="text-[10px] text-subtext font-mono">1{i}m ago</span>
                                    </div>
                                    <p className="text-xs text-subtext mt-1 tracking-wide uppercase font-bold">Head Office • {isAnimalFeed ? 'Main Warehouse' : 'Final Destination'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Achievement Widget */}
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-border">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{isAnimalFeed ? 'Sales Target' : 'Monthly Target'}</h3>
                    </div>
                    <div className="p-8 text-center">
                        <div className="relative inline-flex items-center justify-center p-10 mb-6">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle className="text-border" strokeWidth="12" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                                <circle className={`text-${accentColor}-600 dark:text-${accentColor}-500`} strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 * (1 - 0.85)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">85%</span>
                                <span className="text-[10px] text-subtext font-bold uppercase">Reached</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-2xl border border-border">
                                <div className="flex items-center gap-3">
                                    <Target size={16} className={`text-${accentColor}-600 dark:text-${accentColor}-400`} />
                                    <span className="text-xs font-bold text-subtext">Target</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">$14.2k</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-2xl border border-border">
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-subtext">Current</span>
                                </div>
                                <span className="text-sm font-black text-slate-900 dark:text-white">$12.1k</span>
                            </div>
                        </div>

                        <button className="w-full mt-8 bg-background border border-border hover:bg-primary/5 text-subtext hover:text-slate-900 dark:hover:text-white font-bold py-4 rounded-2xl transition-all active:scale-95 text-xs uppercase tracking-widest shadow-sm">
                            Breakdown Analysis
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
