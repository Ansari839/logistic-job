'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import { Package, TrendingUp, Users, AlertCircle, CheckCircle, Clock, Zap, Target } from 'lucide-react';

const stats = [
    { name: 'Active Jobs', value: '12', icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { name: 'Completion Rate', value: '94%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { name: 'Operators Online', value: '8', icon: Users, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
    { name: 'Pending Alerts', value: '3', icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-400/10' },
];

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <DashboardLayout>
            {/* Welcome Section */}
            <div className="mb-10 relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap size={120} className="text-blue-400" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black text-white mb-2">
                        Welcome back, {user?.name?.split(' ')[0] || 'User'}!
                    </h2>
                    <p className="text-slate-400 max-w-lg leading-relaxed">
                        Your operation at <span className="text-blue-400 font-bold">{user?.branch || 'Head Office'}</span> is performing <span className="text-emerald-400 font-bold">12% better</span> today.
                    </p>
                    <div className="flex gap-4 mt-6">
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 text-sm">
                            Create New Job
                        </button>
                        <button className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-6 py-2.5 rounded-xl font-bold transition-all text-sm">
                            View Reports
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, idx) => (
                    <div key={stat.name} className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 p-6 rounded-3xl transition-all hover:border-slate-700 hover:translate-y-[-4px]">
                        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4 border border-white/5`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{stat.name}</p>
                        <div className="flex items-baseline space-x-2 mt-1">
                            <p className="text-3xl font-black text-white">{stat.value}</p>
                            <span className="text-[10px] text-emerald-400 font-bold">↑ 4%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-3xl overflow-hidden h-fit">
                    <div className="p-8 border-b border-slate-800/60 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-white">Live Activity</h3>
                            <p className="text-xs text-slate-500 mt-1">Real-time status updates from all branches</p>
                        </div>
                        <button className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                            <Clock size={16} className="text-slate-400" />
                        </button>
                    </div>
                    <div className="p-8 space-y-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-start space-x-6 group">
                                <div className="relative mt-1">
                                    <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform border border-slate-700">
                                        <CheckCircle size={18} />
                                    </div>
                                    {i < 3 && <div className="absolute top-10 left-1/2 w-0.5 h-10 bg-slate-800 -translate-x-1/2" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-sm text-white font-bold">Shipment #LGS-990{i} Delivered</p>
                                        <span className="text-[10px] text-slate-500 font-mono">1{i}m ago</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1 tracking-wide uppercase font-bold">Head Office • Final Destination</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Achievement Widget */}
                <div className="bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 rounded-3xl overflow-hidden">
                    <div className="p-8 border-b border-slate-800/60">
                        <h3 className="text-xl font-bold text-white">Monthly Target</h3>
                    </div>
                    <div className="p-8 text-center">
                        <div className="relative inline-flex items-center justify-center p-10 mb-6">
                            <svg className="w-40 h-40 transform -rotate-90">
                                <circle className="text-slate-800" strokeWidth="12" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                                <circle className="text-blue-500" strokeWidth="12" strokeDasharray={440} strokeDashoffset={440 * (1 - 0.85)} strokeLinecap="round" stroke="currentColor" fill="transparent" r="70" cx="80" cy="80" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-black text-white">85%</span>
                                <span className="text-[10px] text-slate-500 font-bold uppercase">Reached</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <Target size={16} className="text-blue-400" />
                                    <span className="text-xs font-bold text-slate-300">Target</span>
                                </div>
                                <span className="text-sm font-black text-white">$14.2k</span>
                            </div>
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-800/40 rounded-2xl border border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <TrendingUp size={16} className="text-emerald-400" />
                                    <span className="text-xs font-bold text-slate-300">Current</span>
                                </div>
                                <span className="text-sm font-black text-white">$12.1k</span>
                            </div>
                        </div>

                        <button className="w-full mt-8 bg-slate-800 hover:bg-slate-700 text-white font-bold py-4 rounded-2xl transition-all active:scale-95 border border-slate-700/50 text-xs uppercase tracking-widest">
                            Breakdown Analysis
                        </button>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
