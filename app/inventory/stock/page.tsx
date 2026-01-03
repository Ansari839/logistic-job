'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    BarChart3, Search, Filter,
    ArrowRightLeft, TrendingUp, AlertTriangle,
    Loader2, Package, Download, RefreshCw
} from 'lucide-react';

interface StockItem {
    id: number;
    name: string;
    sku: string | null;
    unit: string;
    category: string;
    purchasePrice: number;
    sellingPrice: number;
    currentStock: number;
    valuation: number;
}

export default function StockReportPage() {
    const [report, setReport] = useState<StockItem[]>([]);
    const [totalValuation, setTotalValuation] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/inventory/stock');
            if (res.ok) {
                const data = await res.json();
                setReport(data.report);
                setTotalValuation(data.totalValuation);
            }
        } catch (err) {
            console.error('Fetch report failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredReport = report.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Stock Intelligence</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Real-time Inventory & Valuation Analytics</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={fetchReport}
                            className="p-4 bg-background border border-border text-subtext rounded-2xl hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button className="bg-background border border-border text-subtext px-6 py-4 rounded-[2rem] font-black transition-all hover:bg-primary/5 hover:text-slate-900 dark:hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm">
                            <Download size={18} />
                            Export Report
                        </button>
                    </div>
                </div>

                {/* Valuations Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-2 p-8 rounded-[2.5rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-600 to-violet-600 shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-bl-[5rem]">
                            <TrendingUp className="text-white/40" size={48} />
                        </div>
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-2">Total Inventory Valuation</p>
                        <h3 className="text-5xl font-black text-white tracking-tighter">{totalValuation.toLocaleString()} <span className="text-sm italic opacity-60">PKR</span></h3>
                        <p className="text-xs font-bold text-white/40 mt-4 flex items-center gap-2">
                            <RefreshCw size={12} /> Auto-calculated on G/L balance basis
                        </p>
                    </div>

                    {[
                        { label: 'Low Stock Alerts', value: report.filter(i => i.currentStock < 10).length, icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
                        { label: 'Total Stock Units', value: report.reduce((sum, i) => sum + i.currentStock, 0).toLocaleString(), icon: Package, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className="glass-card p-8 rounded-[2.5rem]">
                            <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} mb-6`}>
                                <stat.icon size={24} />
                            </div>
                            <p className="text-[10px] font-black text-subtext uppercase tracking-widest mb-1">{stat.label}</p>
                            <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h4>
                        </div>
                    ))}
                </div>

                {/* Search & Report Table */}
                <div className="glass-panel overflow-hidden pb-0">
                    <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext" size={18} />
                            <input
                                className="glass-input w-full rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white text-sm"
                                placeholder="Filter report data..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 text-[10px] font-black text-subtext uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all">Show All</button>
                            <button className="px-4 py-2 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all flex items-center gap-2">
                                <AlertTriangle size={14} /> Low Stock Only
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Product Intelligence</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-center">Unit</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-center">In Stock</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Valuation (PKR)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                            <p className="text-subtext font-bold uppercase tracking-widest text-xs italic">Compiling Warehouse Ledger...</p>
                                        </td>
                                    </tr>
                                ) : filteredReport.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <Package className="w-12 h-12 text-subtext opacity-20 mx-auto mb-4" />
                                            <h4 className="text-slate-900 dark:text-white font-black text-lg">No Items to Display</h4>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredReport.map((item) => (
                                        <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-5 text-slate-900 dark:text-white">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold">{item.name}</span>
                                                    <span className="text-[10px] font-bold text-subtext tracking-[0.2em] font-mono">{item.sku || 'UNSPECIFIED'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-black text-subtext bg-primary/5 px-3 py-1 rounded-lg uppercase border border-border">{item.category}</span>
                                            </td>
                                            <td className="px-8 py-5 text-center text-xs font-bold text-subtext uppercase tracking-widest">{item.unit}</td>
                                            <td className="px-8 py-5 text-center">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl font-black text-sm ${item.currentStock < 10 ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    }`}>
                                                    {item.currentStock.toLocaleString()}
                                                    {item.currentStock < 10 && <AlertTriangle size={14} className="animate-pulse" />}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-slate-900 dark:text-white text-lg tracking-tighter italic">
                                                {item.valuation.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
