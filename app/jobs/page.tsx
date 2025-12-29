'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import {
    Plus, Search, Filter, MoreHorizontal,
    ArrowUpRight, Package, Calendar, User,
    FileText, Tag, Ship
} from 'lucide-react';

interface Job {
    id: number;
    jobNumber: string;
    date: string;
    jobType: 'IMPORT' | 'EXPORT';
    customer: { name: string; code: string };
    commodity: string | null;
    vessel: string | null;
    _count: { expenses: number; invoices: number };
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const response = await fetch('/api/jobs');
            if (response.ok) {
                const data = await response.json();
                setJobs(data.jobs);
            }
        } catch (error) {
            console.error('Fetch jobs failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredJobs = jobs.filter(job =>
        job.jobNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.vessel?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Job Operations</h1>
                    <p className="text-slate-500 text-sm mt-1 uppercase tracking-widest font-bold">Manage shipments & logistics</p>
                </div>
                <Link
                    href="/jobs/new"
                    className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 text-sm uppercase tracking-widest gap-2"
                >
                    <Plus size={18} />
                    New Shipment
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                        type="text"
                        placeholder="Search by Job #, Vessel, or Customer..."
                        className="w-full bg-slate-900/40 border border-slate-800/60 rounded-2xl pl-12 pr-4 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <button className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button className="flex-1 bg-slate-900/40 border border-slate-800/60 rounded-2xl px-4 py-4 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        Export CSV
                    </button>
                </div>
            </div>

            {/* Jobs Grid/Table */}
            <div className="space-y-4">
                {loading ? (
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-20 text-center">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading operations...</p>
                    </div>
                ) : filteredJobs.length === 0 ? (
                    <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-20 text-center">
                        <Package className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-300">No shipments found</h3>
                        <p className="text-slate-500 text-sm mt-1">Start by creating your first logistics job.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredJobs.map((job) => (
                            <Link
                                key={job.id}
                                href={`/jobs/${job.id}`}
                                className="group block bg-slate-900/40 hover:bg-slate-800/40 backdrop-blur-sm border border-slate-800/60 hover:border-blue-500/50 rounded-3xl p-6 transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                        <Ship size={24} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="text-xl font-black text-white tracking-tight">{job.jobNumber}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${job.jobType === 'EXPORT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                                }`}>
                                                {job.jobType}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-500 text-xs font-bold">
                                            <div className="flex items-center gap-1.5">
                                                <User size={12} className="text-slate-600" />
                                                <span className="text-slate-300 uppercase">{job.customer.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 font-mono">
                                                <Calendar size={12} className="text-slate-600" />
                                                {new Date(job.date).toLocaleDateString()}
                                            </div>
                                            {job.vessel && (
                                                <div className="flex items-center gap-1.5">
                                                    <Ship size={12} className="text-slate-600" />
                                                    <span className="text-blue-400/80">{job.vessel}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 lg:border-l lg:border-slate-800/60 lg:pl-8">
                                        <div className="text-center px-4">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Expenses</p>
                                            <p className="text-lg font-black text-white">{job._count.expenses}</p>
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Invoices</p>
                                            <p className="text-lg font-black text-white">{job._count.invoices}</p>
                                        </div>
                                        <div className="ml-4 p-3 rounded-2xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all text-blue-400">
                                            <ArrowUpRight size={20} />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
