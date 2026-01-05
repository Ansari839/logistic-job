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
    isApproved: boolean;
    isLocked: boolean;
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
    invoice: Invoice | null;
    place?: string;
    shipperRef?: string;
    formE?: string;
    volume?: string;
    packages?: number;
    weight?: number;
    handledBy?: string;
    salesPerson?: string;
    jobDate?: string;
    gdDate?: string;
    formEDate?: string;
    pod?: { name: string } | null;
    podId?: number;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED';
}

export default function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'expenses' | 'invoices'>('overview');

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [vendors, setVendors] = useState<{ id: number; name: string }[]>([]);
    const [expenseForm, setExpenseForm] = useState({
        description: '',
        vendorId: '',
        costPrice: '',
        sellingPrice: '',
        currencyCode: 'PKR'
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
        router.replace(`/jobs/${id}/edit`);
    }, [id, router]);

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = `/api/jobs/${id}/expenses`;
            const method = editingExpense ? 'PATCH' : 'POST';
            const payload = editingExpense ? { ...expenseForm, id: editingExpense.id } : expenseForm;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowExpenseModal(false);
                setEditingExpense(null);
                setExpenseForm({ description: '', vendorId: '', costPrice: '', sellingPrice: '', currencyCode: 'PKR' });
                fetchJob();
            }
        } catch (err) {
            console.error('Book expense failed');
        }
    };

    const handleDeleteExpense = async (expenseId: number) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            const res = await fetch(`/api/jobs/${id}/expenses?expenseId=${expenseId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchJob();
            } else {
                alert('Failed to delete expense');
            }
        } catch (err) {
            console.error('Delete expense failed');
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

    const isClosed = job.status === 'CLOSED';

    const totalCost = job.expenses.reduce((sum, e) => sum + e.costPrice, 0);
    const totalSelling = job.expenses.reduce((sum, e) => sum + e.sellingPrice, 0);
    const profit = totalSelling - totalCost;
    const margin = totalSelling > 0 ? (profit / totalSelling) * 100 : 0;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Locking Banner */}
                {isClosed && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top duration-500">
                        <div className="flex items-center gap-4 px-4">
                            <Clock className="text-amber-400" size={24} />
                            <div>
                                <p className="text-amber-500 font-black uppercase tracking-widest text-[10px]">Job is Locked (Status: CLOSED)</p>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Approved invoice has locked this job. Revert invoice to draft to make changes.</p>
                            </div>
                        </div>
                    </div>
                )}
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
                        <button
                            onClick={async () => {
                                if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
                                    setLoading(true);
                                    try {
                                        const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
                                        if (res.ok) router.push('/jobs');
                                        else alert('Failed to delete job');
                                    } catch (e) { alert('Error deleting job'); }
                                    finally { setLoading(false); }
                                }
                            }}
                            className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-lg"
                            title="Delete Job"
                        >
                            <Trash2 size={18} />
                        </button>
                        <button className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all">
                            <Printer size={18} />
                        </button>
                        <div className="flex gap-4">
                            {!isClosed && (
                                <button
                                    onClick={() => router.push(`/jobs/${id}/edit`)}
                                    className="bg-background/80 backdrop-blur-md border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white p-4 rounded-2xl transition-all shadow-xl"
                                >
                                    <Edit3 size={20} />
                                </button>
                            )}
                            <button className="glass-button">
                                <Share2 size={20} />
                                Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* Job Title Card */}
                <div className="glass-card p-8 mb-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-[2rem] bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xl shadow-blue-600/5">
                                <Ship size={40} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{job.jobNumber}</h1>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${job.jobType === 'EXPORT' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                        {job.jobType}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-slate-500 text-sm font-bold uppercase tracking-widest">
                                    <span className="text-slate-700 dark:text-slate-300">{job.customer.name}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 lg:border-l lg:border-border/50 lg:pl-12">
                            <div className="text-center sm:text-left">
                                <p className="text-subtext mb-1">Profitability</p>
                                <p className={`text-2xl font-black tracking-tighter ${profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {profit >= 0 ? '+' : ''}{profit.toLocaleString()} <span className="text-xs">PKR</span>
                                </p>
                            </div>
                            <div className="text-center sm:text-left">
                                <p className="text-subtext mb-1">Margin</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                    {margin.toFixed(1)}%
                                </p>
                            </div>
                            <div className="hidden sm:block text-center sm:text-left">
                                <p className="text-subtext mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full animate-pulse ${job.status === 'CLOSED' ? 'bg-slate-400 dark:bg-slate-500' : 'bg-emerald-500'}`} />
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{job.status}</p>
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
                        <div className="glass-card p-8">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-8 flex items-center gap-3">
                                <FileText size={18} className="text-blue-500" />
                                Job Sheet Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                {/* Left Column View */}
                                <div className="space-y-6">
                                    <div><p className="text-subtext mb-1">Job Number</p><p className="text-main font-mono">{job.jobNumber}</p></div>
                                    <div><p className="text-subtext mb-1">Customer</p><p className="text-main">{job.customer.name}</p></div>
                                    <div><p className="text-subtext mb-1">Vessel</p><p className="text-main">{job.vessel || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Place</p><p className="text-main">{job.place || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Shipper Ref</p><p className="text-main">{job.shipperRef || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">G.D No</p><p className="text-main font-mono">{job.gdNo || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Form E</p><p className="text-main font-mono">{job.formE || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Commodity</p><p className="text-main">{job.commodity || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Volume</p><p className="text-main">{job.volume || '-'}</p></div>
                                    <div>
                                        <p className="text-subtext mb-2">Container(s)</p>
                                        {job.containerNo ? (
                                            <div className="flex flex-wrap gap-2">
                                                {job.containerNo.split(',').map((c, i) => (
                                                    <span key={i} className="px-3 py-1 bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-mono font-bold">
                                                        {c.trim()}
                                                    </span>
                                                ))}
                                                <span className="px-3 py-1 bg-slate-500/10 border border-slate-500/20 text-slate-500 rounded-lg text-xs font-black uppercase tracking-widest">
                                                    Total: {job.containerNo.split(',').filter(x => x.trim()).length}
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-main font-mono">-</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column View */}
                                <div className="space-y-6">
                                    <div><p className="text-subtext mb-1">Job Date</p><p className="text-main">{job.jobDate ? new Date(job.jobDate).toLocaleDateString() : '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Packages</p><p className="text-main">{job.packages || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">POD</p><p className="text-main">{job.pod?.name || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">{job.jobType === 'EXPORT' ? 'Booking No.' : 'B/L No.'}</p><p className="text-main">{job.hawbBl || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Handle By</p><p className="text-main">{job.handledBy || '-'}</p></div>
                                    <div><p className="text-subtext mb-1">G.D Date</p><p className="text-main">{job.gdDate ? new Date(job.gdDate).toLocaleDateString() : '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Form E Date</p><p className="text-main">{job.formEDate ? new Date(job.formEDate).toLocaleDateString() : '-'}</p></div>
                                    <div><p className="text-subtext mb-1">Sales Person</p><p className="text-main">{job.salesPerson || '-'}</p></div>
                                    <div className="flex justify-between items-center bg-slate-500/5 dark:bg-slate-900/40 p-6 rounded-[2rem] border border-border/50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center border border-orange-500/20 font-black">
                                                $
                                            </div>
                                            <div>
                                                <p className="text-subtext mb-1">Expenses</p>
                                                <button
                                                    onClick={() => setActiveTab('expenses')}
                                                    className="text-lg font-black text-slate-900 dark:text-white hover:text-blue-500 transition-colors"
                                                >
                                                    {job.expenses.length} Entries
                                                </button>
                                            </div>
                                        </div>
                                        {!isClosed && (
                                            <button
                                                onClick={() => {
                                                    setEditingExpense(null);
                                                    setExpenseForm({ description: '', vendorId: '', costPrice: '', sellingPrice: '', currencyCode: 'PKR' });
                                                    setShowExpenseModal(true);
                                                }}
                                                className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all hover:scale-110 active:scale-95"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="glass-panel overflow-hidden">
                            <div className="p-8 border-b border-border/50 flex items-center justify-between">
                                <h3 className="text-heading text-lg">Expense Tracking</h3>
                                <button
                                    onClick={() => {
                                        setEditingExpense(null);
                                        setExpenseForm({ description: '', vendorId: '', costPrice: '', sellingPrice: '', currencyCode: 'PKR' });
                                        setShowExpenseModal(true);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20"
                                >
                                    <Plus size={16} />
                                    Book Expense
                                </button>
                            </div>
                            <div className="p-0 overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-500/5">
                                            <th className="px-8 py-5 text-subtext">Description</th>
                                            <th className="px-8 py-5 text-subtext">Vendor</th>
                                            <th className="px-8 py-5 text-subtext text-right">Cost</th>
                                            <th className="px-8 py-5 text-subtext text-right">Selling</th>
                                            <th className="px-8 py-5 text-subtext text-right">Profit</th>
                                            <th className="px-8 py-5 text-subtext text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {job.expenses.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-8 py-20 text-center text-slate-500 font-bold uppercase tracking-widest text-xs">No expenses booked yet</td>
                                            </tr>
                                        ) : (
                                            job.expenses.map((exp) => (
                                                <tr key={exp.id} className="hover:bg-slate-500/5 transition-colors group">
                                                    <td className="px-8 py-5 font-bold text-slate-800 dark:text-white text-sm">{exp.description}</td>
                                                    <td className="px-8 py-5">
                                                        <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">{exp.vendor?.name || 'Direct Expense'}</span>
                                                    </td>
                                                    <td className="px-8 py-5 text-right font-mono text-slate-500 dark:text-slate-400 text-sm">{exp.costPrice.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-mono text-slate-800 dark:text-white text-sm">{exp.sellingPrice.toLocaleString()}</td>
                                                    <td className="px-8 py-5 text-right font-mono font-bold text-emerald-500 text-sm">
                                                        {(exp.sellingPrice - exp.costPrice).toLocaleString()}
                                                    </td>
                                                    <td className="px-8 py-5 text-right">
                                                        <div className="flex justify-end gap-2">
                                                            {!isClosed && (
                                                                <>
                                                                    <button
                                                                        onClick={() => {
                                                                            setEditingExpense(exp);
                                                                            setExpenseForm({
                                                                                description: exp.description,
                                                                                vendorId: exp.vendor?.id?.toString() || '',
                                                                                costPrice: exp.costPrice.toString(),
                                                                                sellingPrice: exp.sellingPrice.toString(),
                                                                                currencyCode: exp.currencyCode
                                                                            });
                                                                            setShowExpenseModal(true);
                                                                        }}
                                                                        className="p-2 rounded-lg bg-background border border-border text-slate-400 hover:text-blue-500 transition-colors"
                                                                    >
                                                                        <Edit3 size={14} />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteExpense(exp.id)}
                                                                        className="p-2 rounded-lg bg-background border border-border text-slate-400 hover:text-red-500 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {isClosed && (
                                                                <span className="p-2 text-slate-300 dark:text-slate-600">
                                                                    <Anchor size={14} />
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                    {job.expenses.length > 0 && (
                                        <tfoot className="bg-slate-500/5 border-t-2 border-border/50">
                                            <tr>
                                                <td colSpan={2} className="px-8 py-6 text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Grand Total</td>
                                                <td className="px-8 py-6 text-right font-mono text-slate-500 dark:text-slate-400 font-bold">{totalCost.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-mono text-slate-900 dark:text-white font-black">{totalSelling.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right font-mono text-emerald-500 font-black">{profit.toLocaleString()}</td>
                                                <td className="px-8 py-6"></td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'invoices' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {!job.invoice ? (
                                <div className="col-span-full glass-card p-20 text-center">
                                    <FileText className="w-12 h-12 text-slate-700 dark:text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-300">No invoice generated</h3>
                                    <p className="text-subtext text-sm mt-1">Visit the Invoices page to create an invoice for this job.</p>
                                </div>
                            ) : (
                                [job.invoice].map((inv) => (
                                    <div key={inv.id} className="glass-card p-6 group hover:border-primary/50">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-subtext mb-1">Invoice Number</p>
                                                <h4 className="text-xl font-black text-heading italic">{inv.invoiceNumber}</h4>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${inv.isApproved ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                                                {inv.isApproved ? 'Approved' : 'Draft'}
                                            </span>
                                        </div>
                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight text-xs">Date</span>
                                                <span className="text-slate-700 dark:text-slate-300 font-bold">{new Date(inv.date).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight text-xs">Grand Total</span>
                                                <span className="text-heading">{inv.grandTotal.toLocaleString()} {inv.currencyCode}</span>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-border/50 flex gap-2">
                                            <button
                                                onClick={() => router.push(`/invoices/${inv.id}`)}
                                                className="flex-1 bg-background/50 dark:bg-white/5 hover:bg-white/10 text-slate-900 dark:text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest transition-all text-center border border-border"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => router.push(`/invoices/${inv.id}`)}
                                                className="p-3 rounded-xl bg-background border border-border text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Expense Modal */}
                {showExpenseModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)} />
                        <div className="relative glass-panel w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-border/50">
                                <h3 className="text-2xl font-black text-heading tracking-tighter">{editingExpense ? 'Edit Expense' : 'Book New Expense'}</h3>
                                <p className="text-subtext mt-1">{editingExpense ? 'Update Operational Cost' : 'Operational Cost Entry'}</p>
                            </div>
                            <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-subtext ml-1">Description</label>
                                        <input
                                            required
                                            className="glass-input w-full"
                                            placeholder="e.g. Terminal Handling Charges"
                                            value={expenseForm.description}
                                            onChange={e => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-subtext ml-1">Vendor</label>
                                        <select
                                            className="glass-input w-full appearance-none"
                                            value={expenseForm.vendorId}
                                            onChange={e => setExpenseForm({ ...expenseForm, vendorId: e.target.value })}
                                        >
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-subtext ml-1">Cost Price</label>
                                            <input
                                                type="number"
                                                required
                                                className="glass-input w-full font-mono"
                                                value={expenseForm.costPrice}
                                                onChange={e => setExpenseForm({ ...expenseForm, costPrice: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-subtext ml-1">Selling Price</label>
                                            <input
                                                type="number"
                                                required
                                                className="glass-input w-full font-mono"
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
                                        className="flex-1 px-6 py-4 rounded-2xl border border-border text-slate-500 font-bold uppercase tracking-widest text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-black"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95"
                                    >
                                        {editingExpense ? 'Update Expense' : 'Record Expense'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </DashboardLayout >
    );
}
