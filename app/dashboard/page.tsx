'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import {
    Package, TrendingUp, Users, AlertCircle, CheckCircle,
    Clock, Zap, Target, Box, ShoppingCart, Activity, Loader2
} from 'lucide-react';

interface DashboardData {
    stats: {
        activeJobs: number;
        monthlyRevenue: number;
        pendingInvoices: number;
        completionRate: number;
    };
    jobsByStatus: Record<string, number>;
    recentActivity: Array<{
        id: number;
        jobNumber: string;
        customer: string;
        status: string;
        branch: string;
        createdAt: string;
    }>;
    topCustomers: Array<{
        customer: string;
        code: string;
        revenue: number;
    }>;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
            } else {
                setError('Failed to load dashboard data');
            }
        } catch (err) {
            setError('Error fetching dashboard data');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CLOSED': return 'text-emerald-600 dark:text-emerald-400';
            case 'IN_PROGRESS': return 'text-blue-600 dark:text-blue-400';
            case 'DRAFT': return 'text-amber-600 dark:text-amber-400';
            case 'CANCELLED': return 'text-red-600 dark:text-red-400';
            default: return 'text-slate-600 dark:text-slate-400';
        }
    };

    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !dashboardData) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <p className="text-red-600">{error || 'Failed to load dashboard'}</p>
                </div>
            </DashboardLayout>
        );
    }

    const stats = [
        {
            name: 'Active Jobs',
            value: dashboardData.stats.activeJobs.toString(),
            icon: Package,
            color: 'text-blue-400',
            bg: 'bg-blue-400/10'
        },
        {
            name: 'Completion Rate',
            value: `${dashboardData.stats.completionRate}%`,
            icon: TrendingUp,
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10'
        },
        {
            name: 'Monthly Revenue',
            value: `PKR ${(dashboardData.stats.monthlyRevenue / 1000).toFixed(1)}k`,
            icon: Activity,
            color: 'text-indigo-400',
            bg: 'bg-indigo-400/10'
        },
        {
            name: 'Pending Invoices',
            value: dashboardData.stats.pendingInvoices.toString(),
            icon: AlertCircle,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10'
        },
    ];

    return (
        <DashboardLayout>
            {/* Welcome Section */}
            <div className={`mb-10 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 shadow-xl shadow-blue-500/5`}>
                <div className="absolute top-0 right-0 p-8 opacity-15">
                    <Zap size={120} className={`text-blue-600 dark:text-blue-400`} />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-subtext max-w-lg leading-relaxed">
                        Your logistics operation at <span className={`text-blue-600 dark:text-blue-400 font-bold`}>{user?.branch || 'Head Office'}</span> has <span className="text-emerald-600 dark:text-emerald-400 font-bold">{dashboardData.stats.activeJobs} active jobs</span> in progress.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button
                            onClick={() => window.location.href = '/jobs/new'}
                            className={`bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 text-sm`}
                        >
                            Create New Job
                        </button>
                        <button
                            onClick={() => window.location.href = '/reports'}
                            className="bg-background/20 hover:bg-background/40 text-slate-900 dark:text-white border border-border px-6 py-2.5 rounded-xl font-bold transition-all text-sm backdrop-blur-md"
                        >
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
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 glass-panel rounded-3xl overflow-hidden h-fit">
                    <div className="p-8 border-b border-border flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Jobs</h3>
                            <p className="text-xs text-subtext mt-1">Latest job activity from your company</p>
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="p-2 bg-background border border-border rounded-lg hover:bg-primary/5 transition-colors"
                        >
                            <Clock size={16} className="text-subtext" />
                        </button>
                    </div>
                    <div className="p-8 space-y-8">
                        {dashboardData.recentActivity.slice(0, 5).map((activity, i) => (
                            <div key={activity.id} className="flex items-start space-x-6 group">
                                <div className="relative mt-1">
                                    <div className={`w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center ${getStatusColor(activity.status)} group-hover:scale-110 transition-transform border border-border`}>
                                        <CheckCircle size={18} />
                                    </div>
                                    {i < 4 && <div className="absolute top-10 left-1/2 w-0.5 h-10 bg-border -translate-x-1/2" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-slate-900 dark:text-white font-bold">
                                            {activity.jobNumber} - {activity.customer}
                                        </p>
                                        <span className="text-[10px] text-subtext font-mono">{getTimeAgo(activity.createdAt)}</span>
                                    </div>
                                    <p className="text-xs text-subtext mt-1 tracking-wide uppercase font-bold">
                                        {activity.branch} • {activity.status}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Customers */}
                <div className="glass-panel rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-border">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Top Customers</h3>
                        <p className="text-xs text-subtext mt-1">By revenue this month</p>
                    </div>
                    <div className="p-8 space-y-4">
                        {dashboardData.topCustomers.length > 0 ? (
                            dashboardData.topCustomers.map((customer, idx) => (
                                <div key={idx} className="flex items-center justify-between px-4 py-3 bg-primary/5 rounded-2xl border border-border">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-xs">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <span className="text-xs font-bold text-slate-900 dark:text-white block">{customer.customer}</span>
                                            <span className="text-[10px] text-subtext">{customer.code}</span>
                                        </div>
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white">PKR {(customer.revenue / 1000).toFixed(1)}k</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-subtext text-sm">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
