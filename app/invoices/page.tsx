'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    FileText, Search, Filter, Download,
    Printer, MoreVertical, ChevronRight,
    Clock, CheckCircle2, AlertCircle, ArrowUpRight, Plus, Trash2, RotateCcw
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
    category: 'SERVICE' | 'FREIGHT';
    currencyCode: string;
    customer: { name: string; code: string };
    job: { jobNumber: string };
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'trucking' | 'sales_tax' | 'freight'>('all');
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

    const handleDelete = async (id: number, cat: string) => {
        if (!confirm('Are you sure you want to delete this invoice?')) return;
        const endpoint = cat === 'SERVICE' ? '/api/invoices' : '/api/invoices/freight';
        try {
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'DELETE' })
            });
            if (res.ok) {
                fetchInvoices();
            } else {
                const data = await res.json();
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            alert('Delete error');
        }
    };

    const handleApprove = async (id: number, cat: string) => {
        if (!confirm('Approve this invoice? This will post entries to Ledger.')) return;
        const endpoint = cat === 'SERVICE' ? '/api/invoices' : '/api/invoices/freight';
        try {
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'APPROVE' })
            });
            if (res.ok) {
                fetchInvoices();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to approve invoice');
            }
        } catch (err) {
            alert('Approval error');
        }
    };

    const handleRevert = async (id: number, cat: string) => {
        if (!confirm('Revert to Draft? This will REVERSE all ledger entries associated with this invoice.')) return;
        const endpoint = cat === 'SERVICE' ? '/api/invoices' : '/api/invoices/freight';
        try {
            const res = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'REVERT_TO_DRAFT' })
            });
            if (res.ok) {
                fetchInvoices();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to revert invoice');
            }
        } catch (err) {
            alert('Revert error');
        }
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            inv.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (inv.job?.jobNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        const isTrucking = inv.invoiceNumber.startsWith('TRK');
        const isSalesTax = inv.category === 'SERVICE' && !isTrucking;
        const isFreight = inv.category === 'FREIGHT' || inv.invoiceNumber.startsWith('FIN');

        if (activeTab === 'trucking') return isTrucking;
        if (activeTab === 'sales_tax') return isSalesTax;
        if (activeTab === 'freight') return isFreight;
        return true;
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SENT': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
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
                        <h1 className="text-4xl text-heading">Billing & Invoices</h1>
                        <p className="text-subtext mt-1">Unified Service & Freight Billing Console</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => router.push('/invoices/new')}
                            className="glass-button"
                        >
                            <Plus size={18} />
                            Create Invoice
                        </button>
                    </div>
                </div>

                {/* Tab Switcher & Search Bar */}
                <div className="glass-panel p-4 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center">
                    <div className="flex p-1 bg-background/50 border border-border rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'all' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setActiveTab('sales_tax')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'sales_tax' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Sales Tax
                        </button>
                        <button
                            onClick={() => setActiveTab('trucking')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'trucking' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Trucking
                        </button>
                        <button
                            onClick={() => setActiveTab('freight')}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'freight' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                            Freight
                        </button>
                    </div>
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Invoice #, Customer or Job..."
                            className="glass-input w-full pl-16 py-4 font-bold placeholder:text-slate-500 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Invoices List */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="glass-panel p-20 flex flex-col items-center">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Fetching Records...</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="glass-panel p-20 text-center">
                            <FileText className="w-16 h-16 text-primary/20 mx-auto mb-4" />
                            <h3 className="text-2xl text-heading mb-2">No Invoices Found</h3>
                            <p className="text-slate-500 font-bold max-w-sm mx-auto">We couldn't find any invoice records matching your criteria.</p>
                        </div>
                    ) : (
                        filteredInvoices.map((inv) => (
                            <div
                                key={`${inv.category}-${inv.id}`}
                                className="group relative glass-card p-6 lg:p-8 hover:translate-x-1"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                                    <div className="flex items-center gap-6">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${inv.category === 'SERVICE' ? 'bg-blue-600/10 text-blue-600 border-blue-500/20' : 'bg-purple-600/10 text-purple-600 border-purple-500/20'}`}>
                                            <FileText size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{inv.invoiceNumber}</h3>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-700 bg-slate-800 text-slate-100 shadow-sm`}>
                                                    {inv.invoiceNumber.startsWith('TRK') ? 'TRUCKING' : (inv.category === 'FREIGHT' || inv.invoiceNumber.startsWith('FIN') ? 'FREIGHT' : 'SALES TAX')}
                                                </span>
                                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusStyle(inv.status)}`}>
                                                    {inv.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-slate-300">{inv.customer.name}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                <span className="text-primary">{inv.job ? `Job: ${inv.job.jobNumber}` : 'Standalone'}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-800" />
                                                <span>{new Date(inv.date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between lg:justify-end gap-6 lg:pl-12 lg:border-l lg:border-border/50 flex-1">
                                        <div className="text-right">
                                            <p className="text-subtext mb-1">Grand Total</p>
                                            <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                {inv.grandTotal.toLocaleString()} <span className="text-xs">{inv.currencyCode}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            {inv.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleApprove(inv.id, inv.category)}
                                                    className="p-4 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all font-bold"
                                                >
                                                    <CheckCircle2 size={18} />
                                                </button>
                                            )}

                                            {inv.status === 'SENT' && (
                                                <button
                                                    onClick={() => handleRevert(inv.id, inv.category)}
                                                    className="p-4 rounded-2xl bg-amber-600/10 border border-amber-500/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all font-bold"
                                                >
                                                    <RotateCcw size={18} />
                                                </button>
                                            )}

                                            {inv.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => router.push(`/invoices/${inv.id}/edit?category=${inv.category}`)}
                                                    className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all font-bold"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                            )}

                                            <button
                                                onClick={() => router.push(`/invoices/${inv.id}?category=${inv.category}`)}
                                                className="p-4 rounded-2xl bg-slate-900 border border-border text-slate-400 hover:text-white transition-all font-bold"
                                            >
                                                <Printer size={18} />
                                            </button>

                                            {inv.status === 'DRAFT' && (
                                                <button
                                                    onClick={() => handleDelete(inv.id, inv.category)}
                                                    className="p-4 rounded-2xl bg-red-600/10 border border-red-500/20 text-red-600 hover:bg-red-600 hover:text-white transition-all font-bold"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
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
