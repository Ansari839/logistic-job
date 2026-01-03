'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    FileText, Search, Filter, Download,
    Printer, MoreVertical, ChevronRight,
    Clock, CheckCircle2, AlertCircle, ArrowUpRight, Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Invoice {
    id: number;
    invoiceNumber: string;
    date: string;
    totalAmount: number;
    grandTotal: number;
    taxAmount: number;
    status: string;
    type: string;
    currencyCode: string;
    customer: { name: string; code: string };
    job: { jobNumber: string };
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/invoices');
            if (res.ok) {
                const data = await res.json();
                setInvoices(data.invoices);
            }
        } catch (err) {
            console.error('Fetch invoices failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.job.jobNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PAID': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
            case 'DRAFT': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
            case 'CANCELLED': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
            default: return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Billing & Invoices</h1>
                        <p className="text-subtext mt-1">Management Console</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/invoices/new')}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest"
                        >
                            <Plus size={18} />
                            Create Invoice
                        </button>
                        <button className="flex items-center gap-2 bg-background/80 backdrop-blur-md border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white px-6 py-3 rounded-2xl font-black transition-all hover:bg-slate-100 dark:hover:bg-slate-800 text-xs uppercase tracking-widest">
                            <Download size={16} />
                            Export CSV
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="glass-panel p-4 flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Invoice #, Customer or Job..."
                            className="glass-input w-full pl-14 font-bold placeholder:text-slate-500 dark:placeholder:text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-4 w-full lg:w-auto">
                        <button className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-background/50 dark:bg-slate-900/40 border border-border text-slate-500 dark:text-slate-400 px-8 py-4 rounded-3xl font-black hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs uppercase tracking-widest">
                            <Filter size={18} />
                            Filter
                        </button>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-20 flex flex-col items-center">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Authenticating Data Access...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="glass-card p-20 text-center">
                            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Invoices Found</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto">We couldn't find any invoice records matching your criteria. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <div
                                key={inv.id}
                                className="group relative glass-card p-6 lg:p-8 hover:translate-x-1"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{inv.invoiceNumber}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(inv.status)}`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-700 dark:text-slate-300">{inv.customer.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                <span className="text-blue-600 dark:text-blue-400">Job: {inv.job.jobNumber}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end gap-12 lg:pl-12 lg:border-l lg:border-border/50 flex-1">
                                        <div className="text-right">
                                            <p className="text-subtext mb-1">Total Amount</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                {inv.grandTotal.toLocaleString()} <span className="text-xs">{inv.currencyCode}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => router.push(`/invoices/${inv.id}`)}
                                                className="p-4 rounded-2xl bg-background border border-border text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all font-bold"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            <button
                                                onClick={() => router.push(`/invoices/${inv.id}`)}
                                                className="bg-primary/5 dark:bg-white/5 hover:bg-primary/10 dark:hover:bg-white/10 text-primary dark:text-white p-4 rounded-2xl transition-all"
                                            >
                                                <ArrowUpRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
