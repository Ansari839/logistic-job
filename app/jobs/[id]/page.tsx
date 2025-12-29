'use client';

import React, { useEffect, useState, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    Ship, User, FileText, Package,
    ChevronLeft, Plus, DollarSign, Calculator,
    BarChart3, Clock, CheckCircle2, AlertCircle,
    ArrowUpRight, Printer, Share2, MoreVertical,
    Trash2, Edit3, Anchor, Tag, Scale, Hash, Loader2, Info
} from 'lucide-react';

interface Expense {
    id: number;
    description: string;
    costPrice: number;
    sellingPrice: number;
    currencyCode: string;
    vendor: { id: number; name: string; code: string } | null;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    date: string;
    status: string;
    grandTotal: number;
    currencyCode: string;
}

interface Job {
    id: number;
    jobNumber: string;
    createdAt: string;
    jobType: 'IMPORT' | 'EXPORT';
    customerId: number;
    customer: { name: string; code: string; email: string | null };
    vessel: string | null;
    commodity: string | null;
    containerNo: string | null;
    gdNo: string | null;
    hawbBl: string | null;
    branches: { name: string } | null;
    expenses: Expense[];
    invoices: Invoice[];
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');

    // Expense Modal State
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        vendorId: '',
        costPrice: '',
        sellingPrice: '',
        currencyCode: 'PKR'
    });

    // Invoice Modal State
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({
        invoiceNumber: '',
        type: 'MASTER',
        currencyCode: 'PKR',
        taxAmount: 0,
    });

    const fetchJob = async () => {
        try {
            const response = await fetch(`/api/jobs/${id}`);
            if (response.ok) {
                const data = await response.json();
                setJob(data.job);
            }
        } catch (error) {
            console.error('Fetch job failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors);
            }
        } catch (err) {
            console.error('Fetch vendors failed');
        }
    };

    useEffect(() => {
        fetchJob();
        fetchVendors();
    }, [id]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`/api/jobs/${id}/expenses`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(expenseForm),
            });
            if (res.ok) {
                setShowExpenseModal(false);
                setExpenseForm({ description: '', vendorId: '', costPrice: '', sellingPrice: '', currencyCode: 'PKR' });
                fetchJob();
            }
        } catch (err) {
            console.error('Book expense failed');
        }
    };

    const handleGenerateInvoice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!job) return;

        try {
            const res = await fetch(`/api/invoices`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...invoiceForm,
                    jobId: id,
                    customerId: job.customerId,
                    totalAmount: totalSelling,
                    grandTotal: totalSelling + Number(invoiceForm.taxAmount),
                    items: job.expenses.map(exp => ({
                        description: exp.description,
                        amount: exp.sellingPrice,
                        taxPercentage: 0,
                        taxAmount: 0,
                        total: exp.sellingPrice
                    }))
                }),
            });
            if (res.ok) {
                setShowInvoiceModal(false);
                fetchJob();
            }
        } catch (err) {
            console.error('Generate invoice failed');
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        </DashboardLayout>
    );

    if (!job) return (
        <DashboardLayout>
            <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-white">Job Not Found</h1>
                <button onClick={() => router.push('/jobs')} className="mt-4 text-blue-400 font-bold uppercase tracking-widest text-sm">Return to listing</button>
            </div>
        </DashboardLayout>
    );

    const totalCost = job.expenses.reduce((sum, e) => sum + e.costPrice, 0);
    const totalSelling = job.expenses.reduce((sum, e) => sum + e.sellingPrice, 0);
    const profit = totalSelling - totalCost;
    const margin = totalSelling > 0 ? (profit / totalSelling) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => router.push('/jobs')}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Job Operations
                    </button>
                    <div className="flex gap-3">
                        <button className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                            <Printer size={18} />
                        </button>
                        <button className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                            <Share2 size={18} />
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-lg shadow-blue-600/20">
                            <Edit3 size={18} />
                            Edit Job
                        </button>
                    </div>
                </div>

                {/* Job Title Card */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-[2.5rem] p-8 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xl shadow-blue-600/5">
                                <Ship size={40} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-4xl font-black text-white tracking-tighter">{job.jobNumber}</h1>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.jobType === 'EXPORT' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                        {job.jobType}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
                                    <span className="text-slate-300">{job.customer.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:border-l lg:border-slate-800/60 lg:pl-12">
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Profitability</p>
                                <p className={`text-2xl font-black tracking-tighter ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {profit >= 0 ? '+' : ''}{profit.toLocaleString()} <span className="text-xs">PKR</span>
                                </p>
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Margin</p>
                                <p className="text-2xl font-black text-white tracking-tighter">
                                    {margin.toFixed(1)}%
                                </p>
                            </div>
                            <div className="hidden sm:block text-center sm:text-left">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-sm font-black text-white uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 p-1.5 bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/60 mb-8 w-fit">
                    {[
                        { id: 'overview', label: 'Overview', icon: BarChart3 },
                        { id: 'expenses', label: 'Expenses', icon: DollarSign },
                        { id: 'invoices', label: 'Invoices', icon: FileText },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest ${activeTab === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 hover:text-white hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {activeTab === 'overview' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem]">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                        <Info size={18} className="text-blue-400" />
                                        Shipment Details
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Vessel / Carrier</p>
                                            <p className="text-white font-bold flex items-center gap-2">
                                                <Ship size={16} className="text-slate-600" />
                                                {job.vessel || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Commodity</p>
                                            <p className="text-white font-bold flex items-center gap-2">
                                                <Package size={16} className="text-slate-600" />
                                                {job.commodity || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">GD Number</p>
                                            <p className="text-white font-mono font-bold flex items-center gap-2">
                                                <Hash size={16} className="text-slate-600" />
                                                {job.gdNo || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">HAWB / BL</p>
                                            <p className="text-white font-mono font-bold flex items-center gap-2">
                                                <FileText size={16} className="text-slate-600" />
                                                {job.hawbBl || 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Container No</p>
                                            <p className="text-white font-mono font-bold flex items-center gap-2">
                                                <Anchor size={16} className="text-slate-600" />
                                                {job.containerNo || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem]">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                        <User size={18} className="text-blue-400" />
                                        Contact Info
                                    </h3>
                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Customer</p>
                                            <p className="text-white font-bold">{job.customer.name}</p>
                                            <p className="text-slate-500 text-xs font-mono">{job.customer.code}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Customer Email</p>
                                            <p className="text-white font-bold break-all">{job.customer.email || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 p-8 rounded-[2rem]">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Quick Stats</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-300 uppercase">Expenses</span>
                                            <span className="text-white font-black">{job.expenses.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                            <span className="text-xs font-bold text-slate-300 uppercase">Invoices</span>
                                            <span className="text-white font-black">{job.invoices.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden">
                            <div className="p-8 border-b border-slate-800/60 flex items-center justify-between">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Expense Tracking</h3>
                                <button
                                    onClick={() => setShowExpenseModal(true)}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                                >
                                    <Plus size={16} />
                                    Book Expense
                                </button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-950/40">
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Vendor</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Cost</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Selling</th>
                                            <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/60">
                                        {job.expenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No expenses booked yet</td>
                                            </tr>
                                        ) : (
                                            job.expenses.map((exp) => (
                                                <tr key={exp.id} className="hover:bg-white/5 transition-colors group">
                                                    <td className="px-8 py-5 font-bold text-white text-sm">{exp.description}</td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-slate-400 text-sm font-medium">{exp.vendor?.name || 'Direct Expense'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-mono text-slate-400 text-sm">{exp.costPrice.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-mono text-white text-sm">{exp.sellingPrice.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-mono font-bold text-emerald-400 text-sm">
                                                        {(exp.sellingPrice - exp.costPrice).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {job.expenses.length > 0 && (
                                        <tfoot className="bg-slate-950/40 border-t-2 border-slate-800">
                                            <tr>
                                                <td colSpan={2} className="px-8 py-6 text-sm font-black text-white uppercase tracking-widest">Grand Total</td>
                                                <td className="px-8 py-6 text-right font-mono text-slate-400 font-bold">{totalCost.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-mono text-white font-black">{totalSelling.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-mono text-emerald-400 font-black">{profit.toLocaleString()}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="space-y-6">
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setInvoiceForm(prev => ({ ...prev, invoiceNumber: `INV-${job?.jobNumber?.split('-')[2] || '001'}` }));
                                        setShowInvoiceModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20"
                                >
                                    <FileText size={20} />
                                    Generate Invoice
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {job.invoices.length === 0 ? (
                                    <div className="col-span-full bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-20 text-center">
                                        <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-300">No invoices generated</h3>
                                        <p className="text-slate-500 text-sm mt-1">Generate your first invoice from job expenses.</p>
                                    </div>
                                ) : (
                                    job.invoices.map((inv) => (
                                        <div key={inv.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[2rem] p-6 hover:border-blue-500/50 transition-all group">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Invoice Number</p>
                                                    <h4 className="text-xl font-black text-white">{inv.invoiceNumber}</h4>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            <div className="space-y-4 mb-6">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-tight text-xs">Date</span>
                                                    <span className="text-slate-300 font-bold">{new Date(inv.date).toLocaleDateString()}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-slate-500 font-bold uppercase tracking-tight text-xs">Total Amount</span>
                                                    <span className="text-white font-black">{inv.grandTotal.toLocaleString()} {inv.currencyCode}</span>
                                                </div>
                                            </div>
                                            <div className="pt-4 border-t border-slate-800/60 flex gap-2">
                                                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-widest transition-all">View</button>
                                                <button className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 transition-all">
                                                    <Printer size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Expense Modal */}
                {showExpenseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-white/5">
                                <h3 className="text-2xl font-black text-white tracking-tighter">Book New Expense</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Operational Cost Entry</p>
                            </div>
                            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                        <input
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g. Terminal Handling Charges"
                                            value={expenseForm.description}
                                            onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                            value={expenseForm.vendorId}
                                            onChange={e => setExpenseForm({ ...expenseForm, vendorId: e.target.value })}
                                        >
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cost Price</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                                value={expenseForm.costPrice}
                                                onChange={e => setExpenseForm({ ...expenseForm, costPrice: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selling Price</label>
                                            <input
                                                type="number"
                                                required
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                                value={expenseForm.sellingPrice}
                                                onChange={e => setExpenseForm({ ...expenseForm, sellingPrice: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowExpenseModal(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        Record Expense
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Invoice Modal */}
                {showInvoiceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowInvoiceModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-white/5">
                                <h3 className="text-2xl font-black text-white tracking-tighter">Generate Invoice</h3>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Transform Job to Billing</p>
                            </div>
                            <form onSubmit={handleGenerateInvoice} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Number</label>
                                        <input
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                            value={invoiceForm.invoiceNumber}
                                            onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Invoice Type</label>
                                            <select
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-black uppercase tracking-widest"
                                                value={invoiceForm.type}
                                                onChange={e => setInvoiceForm({ ...invoiceForm, type: e.target.value })}
                                            >
                                                <option value="MASTER">Master Invoice</option>
                                                <option value="PROFORMA">Proforma</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Currency</label>
                                            <input
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-xs"
                                                value={invoiceForm.currencyCode}
                                                readOnly
                                            />
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Subtotal</span>
                                            <span className="text-white font-black">{totalSelling.toLocaleString()} PKR</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-slate-500 uppercase">Tax Amount</span>
                                            <input
                                                type="number"
                                                className="bg-transparent text-right text-white font-black w-24 focus:outline-none border-b border-white/10"
                                                value={invoiceForm.taxAmount}
                                                onChange={e => setInvoiceForm({ ...invoiceForm, taxAmount: Number(e.target.value) })}
                                            />
                                        </div>
                                        <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                                            <span className="text-xs font-black text-blue-400 uppercase">Grand Total</span>
                                            <span className="text-xl font-black text-blue-400">{(totalSelling + Number(invoiceForm.taxAmount)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowInvoiceModal(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl border border-slate-800 text-slate-400 font-bold uppercase tracking-widest text-xs hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        Confirm Invoice
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
