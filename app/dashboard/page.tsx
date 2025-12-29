'use client';

import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/components/AuthProvider';
import { Package, TrendingUp, Users, AlertCircle, CheckCircle } from 'lucide-react';

export default function DashboardPage() {
    const { user } = useAuth();

    const stats = [
        { name: 'Active Jobs', value: '12', icon: Package, color: 'text-blue-400' },
        { name: 'Completion Rate', value: '94%', icon: TrendingUp, color: 'text-emerald-400' },
        { name: 'Operators Online', value: '8', icon: Users, color: 'text-indigo-400' },
        { name: 'Pending Alerts', value: '3', icon: AlertCircle, color: 'text-amber-400' },
    ];

    return (
        <DashboardLayout>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat) => (
                    <div key={stat.name} className="bg-slate-950/50 border border-slate-800 p-6 rounded-2xl flex items-center space-x-4">
                        <div className={`p-3 rounded-xl bg-slate-900 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm font-medium">{stat.name}</p>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">Recent Activity</h3>
                        <button className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">View all</button>
                    </div>
                    <div className="p-6 space-y-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex items-start space-x-4">
                                <div className="p-2 rounded-full bg-slate-900 text-emerald-400">
                                    <CheckCircle size={16} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-white font-medium">Job #1234{i} successfully completed</p>
                                    <p className="text-xs text-slate-500 mt-1">2 hours ago by Operator John</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Role Specific Module - Example */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-slate-800">
                        <h3 className="text-lg font-bold text-white">
                            {user?.role === 'ADMIN' ? 'System Status' : 'My Performance'}
                        </h3>
                    </div>
                    <div className="p-6 text-center">
                        <div className="inline-flex items-center justify-center p-6 rounded-full bg-blue-500/10 border-4 border-slate-900 ring-4 ring-blue-500/20 mb-4">
                            <span className="text-3xl font-bold text-blue-400">85%</span>
                        </div>
                        <p className="text-white font-medium">Monthly Target</p>
                        <p className="text-sm text-slate-500 mt-2 italic px-4">
                            "Great work! You are on track to achieve your targets this month."
                        </p>

                        <div className="mt-8 pt-8 border-t border-slate-800 space-y-3">
                            <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2 rounded-lg transition-colors">
                                View Detailed Reports
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
