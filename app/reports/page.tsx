'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    BarChart3, Calendar, Download, FileSpreadsheet,
    FileText, Filter, Printer, RefreshCw,
    ChevronRight, TrendingUp, TrendingDown,
    Scale, Calculator, PieChart, Loader2,
    CheckCircle2, AlertCircle
} from 'lucide-react';

export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState<'TB' | 'PL' | 'BS'>('TB');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any>(null);
    const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReport();
    }, [activeTab, toDate]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const typeMap = { 'TB': 'TRIAL_BALANCE', 'PL': 'PL', 'BS': 'BALANCE_SHEET' };
            const res = await fetch(`/api/reports/financials?type=${typeMap[activeTab]}&toDate=${toDate}`);
            if (res.ok) {
                const data = await res.json();
                setReportData(data);
            }
        } catch (err) {
            console.error('Fetch report failed');
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (!reportData) return;
        // Simple CSV implementation
        let csvContent = "data:text/csv;charset=utf-8,";
        if (activeTab === 'TB') {
            csvContent += "Code,Account,Type,Balance\n";
            reportData.report.forEach((a: any) => {
                csvContent += `${a.code},${a.name},${a.type},${a.balance}\n`;
            });
        }
        // ... more export logic for other reports
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${activeTab}_Report_${toDate}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Financial Intelligence</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Real-time Performance Metrics</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => window.print()}
                            className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-2xl hover:text-white transition-all"
                        >
                            <Printer size={20} />
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-4 rounded-[2rem] font-black transition-all hover:bg-slate-800 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl"
                        >
                            <Download size={18} />
                            Export Data
                        </button>
                    </div>
                </div>

                {/* Filters & Tabs */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex p-2 bg-slate-950 rounded-[2rem] gap-1">
                        {[
                            { id: 'TB', label: 'Trial Balance', icon: Scale },
                            { id: 'PL', label: 'Profit & Loss', icon: TrendingUp },
                            { id: 'BS', label: 'Balance Sheet', icon: PieChart },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-3 rounded-[1.5rem] font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 hover:text-white'
                                    }`}
                            >
                                <tab.icon size={14} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4 px-4">
                        <div className="flex items-center gap-2 bg-slate-950 px-4 py-3 rounded-2xl border border-slate-800">
                            <Calendar size={14} className="text-slate-500" />
                            <input
                                type="date"
                                className="bg-transparent text-white font-bold text-xs focus:outline-none"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={fetchReport}
                            className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl border border-blue-600/20 hover:bg-blue-600 hover:text-white transition-all"
                        >
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Report Content */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] overflow-hidden min-h-[60vh] relative">
                    {loading && (
                        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                            <Loader2 className="animate-spin text-blue-500 mb-4" size={48} />
                            <p className="text-slate-400 font-black uppercase tracking-widest text-xs">Generating Statements...</p>
                        </div>
                    )}

                    {reportData && (
                        <div className="p-10 animate-in fade-in duration-500">
                            {activeTab === 'TB' && (
                                <div className="space-y-8">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                                        <Scale className="text-blue-500" />
                                        Trial Balance <span className="text-sm font-normal text-slate-500">as of {new Date(toDate).toLocaleDateString()}</span>
                                    </h2>
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/60">
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest rounded-l-2xl">Account</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Debit</th>
                                                <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right rounded-r-2xl">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-800/40">
                                            {reportData.report.map((a: any) => (
                                                <tr key={a.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="px-8 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white">{a.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{a.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-right font-black text-sm text-white">{a.balance > 0 ? a.balance.toLocaleString() : '-'}</td>
                                                    <td className="px-8 py-4 text-right font-black text-sm text-white">{a.balance < 0 ? Math.abs(a.balance).toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-blue-600/10 border-t border-blue-500/20">
                                                <td className="px-8 py-6 text-sm font-black text-blue-400 uppercase tracking-widest">Grand Total</td>
                                                <td className="px-8 py-6 text-right font-black text-lg text-white border-b-4 border-double border-blue-500/40">{reportData.totalDebit.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-black text-lg text-white border-b-4 border-double border-blue-500/40">{reportData.totalCredit.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'PL' && (
                                <div className="max-w-4xl mx-auto space-y-12">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                                        <TrendingUp className="text-emerald-500" />
                                        Profit & Loss Statement
                                    </h2>

                                    <section className="space-y-6">
                                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] border-b border-emerald-500/20 pb-2">Revenue Streams</h3>
                                        {reportData.revenue.map((a: any) => (
                                            <div key={a.id} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-300 font-medium">{a.name}</span>
                                                <span className="text-white font-black">{Math.abs(a.balance).toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <span className="text-lg font-black text-white italic uppercase">Total Revenue</span>
                                            <span className="text-2xl font-black text-emerald-400 tracking-tighter">{reportData.totalRevenue.toLocaleString()}</span>
                                        </div>
                                    </section>

                                    <section className="space-y-6">
                                        <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] border-b border-rose-500/20 pb-2">Operating Expenses</h3>
                                        {reportData.expenses.map((a: any) => (
                                            <div key={a.id} className="flex justify-between items-center text-sm">
                                                <span className="text-slate-300 font-medium">{a.name}</span>
                                                <span className="text-white font-black">{a.balance.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                            <span className="text-lg font-black text-white italic uppercase">Total Expenses</span>
                                            <span className="text-2xl font-black text-rose-400 tracking-tighter">{reportData.totalExpenses.toLocaleString()}</span>
                                        </div>
                                    </section>

                                    <div className={`p-8 rounded-[2rem] border-2 flex justify-between items-center ${reportData.netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'
                                        }`}>
                                        <h4 className="text-xl font-black text-white italic uppercase tracking-widest">Net Profit / (Loss)</h4>
                                        <p className={`text-4xl font-black tracking-tighter ${reportData.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {reportData.netProfit.toLocaleString()} <span className="text-xs uppercase ml-2">PKR</span>
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'BS' && (
                                <div className="space-y-12">
                                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight flex items-center gap-3">
                                        <PieChart className="text-amber-500" />
                                        Balance Sheet
                                    </h2>
                                    <div className="grid md:grid-cols-2 gap-12">
                                        <div className="space-y-8">
                                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] border-b border-blue-500/20 pb-2">Assets</h3>
                                            <div className="space-y-4">
                                                {reportData.assets.map((a: any) => (
                                                    <div key={a.id} className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-300 font-medium text-xs font-bold uppercase">{a.name}</span>
                                                        <span className="text-white font-black">{a.balance.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex justify-between items-center pt-4 border-t border-white/5 bg-blue-500/5 p-4 rounded-xl">
                                                <span className="text-sm font-black text-white uppercase">Total Assets</span>
                                                <span className="text-xl font-black text-blue-400">{reportData.totalAssets.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-12">
                                            <div className="space-y-8">
                                                <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-[0.2em] border-b border-amber-500/20 pb-2">Liabilities</h3>
                                                <div className="space-y-4">
                                                    {reportData.liabilities.map((a: any) => (
                                                        <div key={a.id} className="flex justify-between items-center text-sm">
                                                            <span className="text-slate-300 font-medium text-xs font-bold uppercase">{a.name}</span>
                                                            <span className="text-white font-black">{Math.abs(a.balance).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-white/5 bg-amber-500/5 p-4 rounded-xl">
                                                    <span className="text-sm font-black text-white uppercase">Total Liabilities</span>
                                                    <span className="text-xl font-black text-amber-400">{reportData.totalLiabilities.toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="space-y-8">
                                                <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] border-b border-indigo-500/20 pb-2">Equity</h3>
                                                <div className="space-y-4">
                                                    {reportData.equity.map((a: any) => (
                                                        <div key={a.id} className="flex justify-between items-center text-sm">
                                                            <span className="text-slate-300 font-medium text-xs font-bold uppercase">{a.name}</span>
                                                            <span className="text-white font-black">{Math.abs(a.balance).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className="text-slate-300 font-medium text-xs font-bold uppercase italic">Reserves (Net Profit)</span>
                                                        <span className="text-white font-black">{reportData.currentNetProfit.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                                <div className="flex justify-between items-center pt-4 border-t border-white/5 bg-indigo-500/5 p-4 rounded-xl">
                                                    <span className="text-sm font-black text-white uppercase">Total Equity</span>
                                                    <span className="text-xl font-black text-indigo-400">{reportData.totalEquity.toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-center pt-12">
                                        <div className="bg-slate-950 border border-white/10 px-12 py-8 rounded-[3rem] text-center space-y-2">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accounting Balance Status</p>
                                            <div className="flex items-center gap-4">
                                                <p className="text-3xl font-black text-white tracking-tighter">{reportData.totalAssets.toLocaleString()}</p>
                                                <Scale size={24} className={reportData.isBalanced ? 'text-emerald-500' : 'text-rose-500'} />
                                                <p className="text-3xl font-black text-white tracking-tighter">{(reportData.totalLiabilities + reportData.totalEquity).toLocaleString()}</p>
                                            </div>
                                            {reportData.isBalanced ? (
                                                <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase mt-4">
                                                    <CheckCircle2 size={12} />
                                                    Balanced Statements
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2 text-rose-400 text-[10px] font-black uppercase mt-4">
                                                    <AlertCircle size={12} />
                                                    Balance Mismatch Detected
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
