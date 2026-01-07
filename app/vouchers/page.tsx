'use client';

import React, { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    FileText, Plus, Search, Trash2,
    ArrowRightLeft, AlertCircle, CheckCircle2,
    Calculator, Calendar, Hash, Loader2, Info,
    ChevronDown, ChevronUp, Edit2, X, Printer,
    Briefcase, ArrowUpRight, ArrowDownLeft
} from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface Entry {
    id: number;
    debit: number;
    credit: number;
    description: string | null;
    account: { id: number; name: string; code: string };
}

interface Voucher {
    id: number;
    voucherNumber: string;
    date: string;
    narration: string | null;
    voucherType: 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'CONTRA';
    entries: Entry[];
    postedBy?: { name: string | null };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

// Searchable Select Component
const AccountSearch = ({ accounts, value, onChange, placeholder = "Select Account..." }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const selectedAccount = accounts.find((a: any) => a.id.toString() === value.toString());
    const filteredAccounts = useMemo(() =>
        accounts.filter((a: any) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.code.toLowerCase().includes(search.toLowerCase())
        ), [accounts, search]
    );

    return (
        <div className="relative">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="glass-input w-full py-2.5 px-4 text-xs flex justify-between items-center cursor-pointer hover:border-indigo-500/50 transition-all font-bold"
            >
                <span className={selectedAccount ? "text-foreground" : "text-subtext italic"}>
                    {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : placeholder}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-[100] mt-2 w-full glass-panel bg-white dark:bg-slate-900 shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border sticky top-0 bg-inherit">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtext" />
                            <input
                                autoFocus
                                className="w-full bg-slate-100 dark:bg-slate-800 rounded-lg py-2 pl-9 pr-4 text-xs font-bold border-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search code or name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1">
                        {filteredAccounts.length > 0 ? (
                            filteredAccounts.map((a: any) => (
                                <div
                                    key={a.id}
                                    onClick={() => {
                                        onChange(a.id);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`
                                        p-3 rounded-lg cursor-pointer transition-all flex justify-between items-center group
                                        ${value.toString() === a.id.toString() ? 'bg-indigo-600 text-white' : 'hover:bg-indigo-500/10 text-foreground'}
                                    `}
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-black">{a.name}</span>
                                        <span className={`text-[9px] font-bold opacity-70 ${value.toString() === a.id.toString() ? 'text-white' : 'text-indigo-500'}`}>{a.code}</span>
                                    </div>
                                    {value.toString() === a.id.toString() && <CheckCircle2 size={12} />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[10px] font-black uppercase text-subtext italic">No accounts found</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function JournalVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingVoucherId, setEditingVoucherId] = useState<number | null>(null);
    const [expandedVoucherId, setExpandedVoucherId] = useState<number | null>(null);

    // Filters & Pagination
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'CONTRA'>('ALL');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // Voucher Form State
    const initialForm = {
        date: new Date().toISOString().split('T')[0],
        description: '',
        voucherType: 'JOURNAL' as any,
        paymentMode: 'CASH' as any,
        instrumentNo: '',
        instrumentDate: '',
        bankName: '',
        sourceAccount: '',
        targetAccount: '',
        amount: 0,
        entries: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' },
        ]
    };

    const [form, setForm] = useState(initialForm);
    const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Voucher | null>(null);

    useEffect(() => {
        fetchVouchers();
    }, [page, typeFilter, searchQuery]);

    useEffect(() => {
        fetchAccounts();
        fetchCompany();
    }, []);

    const fetchCompany = async () => {
        try {
            const res = await fetch('/api/company');
            if (res.ok) {
                const data = await res.json();
                setCompany(data.company);
            }
        } catch (err) {
            console.error('Fetch company failed');
        }
    };

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: page.toString(),
                limit: '20',
                ...(typeFilter !== 'ALL' && { type: typeFilter }),
                ...(searchQuery && { search: searchQuery })
            });
            const res = await fetch(`/api/vouchers?${query}`);
            if (res.ok) {
                const data = await res.json();
                setVouchers(data.vouchers);
                setPagination(data.pagination);
            }
        } catch (err) {
            console.error('Fetch vouchers failed');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts);
            }
        } catch (err) {
            console.error('Fetch accounts failed');
        }
    };

    const handleEdit = (v: Voucher) => {
        setEditingVoucherId(v.id);
        const sourceEntry = v.entries.find(e => v.voucherType === 'PAYMENT' ? e.credit > 0 : e.debit > 0);
        const targetEntry = v.entries.find(e => v.voucherType === 'PAYMENT' ? e.debit > 0 : e.credit > 0);

        setForm({
            date: new Date(v.date).toISOString().split('T')[0],
            description: v.narration || '',
            voucherType: v.voucherType,
            paymentMode: (v as any).paymentMode || 'CASH',
            instrumentNo: (v as any).instrumentNo || '',
            instrumentDate: (v as any).instrumentDate ? new Date((v as any).instrumentDate).toISOString().split('T')[0] : '',
            bankName: (v as any).bankName || '',
            sourceAccount: sourceEntry ? sourceEntry.account.id.toString() : '',
            targetAccount: targetEntry ? targetEntry.account.id.toString() : '',
            amount: sourceEntry ? (v.voucherType === 'PAYMENT' ? sourceEntry.credit : sourceEntry.debit) : 0,
            entries: v.entries.map(e => ({
                accountId: e.account.id.toString(),
                debit: e.debit,
                credit: e.credit,
                description: e.description || ''
            }))
        } as any);
        setShowModal(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this voucher? This will also reverse the ledger effects.')) return;
        try {
            const res = await fetch(`/api/vouchers?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchVouchers();
            } else {
                const err = await res.json();
                alert(err.error);
            }
        } catch (err) {
            alert('Failed to delete');
        }
    };

    const addEntry = () => {
        setForm({
            ...form,
            entries: [...form.entries, { accountId: '', debit: 0, credit: 0, description: '' }]
        });
    };

    const removeEntry = (index: number) => {
        if (form.entries.length <= 2) return;
        const next = [...form.entries];
        next.splice(index, 1);
        setForm({ ...form, entries: next });
    };

    const updateEntry = (index: number, field: string, value: any) => {
        const next = [...form.entries];
        next[index] = { ...next[index], [field]: value };
        setForm({ ...form, entries: next });
    };

    const totalDebit = form.voucherType === 'JOURNAL' || form.voucherType === 'CONTRA'
        ? form.entries.reduce((sum, e) => sum + Number(e.debit), 0)
        : form.amount;
    const totalCredit = form.voucherType === 'JOURNAL' || form.voucherType === 'CONTRA'
        ? form.entries.reduce((sum, e) => sum + Number(e.credit), 0)
        : form.amount;

    const isBalanced = (form.voucherType === 'JOURNAL' || form.voucherType === 'CONTRA')
        ? (Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0)
        : (form.amount > 0 && form.sourceAccount && form.targetAccount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return;

        let entries: any[] = [];
        if (form.voucherType === 'JOURNAL' || form.voucherType === 'CONTRA') {
            entries = form.entries.map(e => ({
                accountId: Number(e.accountId),
                description: e.description,
                debit: Number(e.debit),
                credit: Number(e.credit)
            }));
        } else if (form.voucherType === 'PAYMENT') {
            entries = [
                { accountId: Number(form.targetAccount), debit: Number(form.amount), credit: 0, description: form.description },
                { accountId: Number(form.sourceAccount), debit: 0, credit: Number(form.amount), description: form.description }
            ];
        } else if (form.voucherType === 'RECEIPT') {
            entries = [
                { accountId: Number(form.sourceAccount), debit: Number(form.amount), credit: 0, description: form.description },
                { accountId: Number(form.targetAccount), debit: 0, credit: Number(form.amount), description: form.description }
            ];
        }

        try {
            const url = editingVoucherId ? '/api/vouchers' : '/api/vouchers';
            const method = editingVoucherId ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...(editingVoucherId && { id: editingVoucherId }),
                    date: form.date,
                    description: form.description,
                    voucherType: form.voucherType,
                    paymentMode: form.paymentMode,
                    instrumentNo: form.instrumentNo,
                    instrumentDate: form.instrumentDate,
                    bankName: form.bankName,
                    entries: entries
                }),
            });

            if (res.ok) {
                setShowModal(false);
                setEditingVoucherId(null);
                fetchVouchers();
                setForm(initialForm);
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to post voucher');
            }
        } catch (err) {
            console.error('Submit Voucher failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 pb-20">
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <div className="print:hidden">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-600/20">
                                <FileText className="text-white" size={28} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Voucher System</h1>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.5em] mt-0.5">Financial Operations Control</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 print:hidden">
                        <div className="relative group min-w-[240px]">
                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            <input
                                className="glass-input pl-12 pr-4 py-4 w-full font-black text-xs uppercase"
                                placeholder="Search Voucher # or Rem..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="glass-input py-4 rounded-2xl font-black text-xs uppercase tracking-widest px-6 appearance-none bg-no-repeat bg-[right_1.5rem_center]"
                            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundSize: '1.25rem' }}
                        >
                            <option value="ALL">All Entries</option>
                            <option value="JOURNAL">Journal (JV)</option>
                            <option value="PAYMENT">Payment (PV)</option>
                            <option value="RECEIPT">Receipt (RV)</option>
                            <option value="CONTRA">Contra (CV)</option>
                        </select>

                        <button
                            onClick={() => { setEditingVoucherId(null); setForm(initialForm); setShowModal(true); }}
                            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-[1.5rem] font-black transition-all flex items-center gap-3 text-sm uppercase tracking-tighter shadow-2xl hover:scale-105 active:scale-95"
                        >
                            <Plus size={22} strokeWidth={3} />
                            Deploy Voucher
                        </button>
                    </div>
                </div>

                {/* Voucher History Matrix */}
                <div className="space-y-4 print:hidden">
                    {loading ? (
                        <div className="glass-panel p-32 flex flex-col items-center justify-center space-y-6">
                            <Loader2 className="animate-spin text-indigo-500" size={56} />
                            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Ledger Evidence...</p>
                        </div>
                    ) : vouchers.length === 0 ? (
                        <div className="glass-panel p-24 text-center border-dashed border-2">
                            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                                <ArrowRightLeft className="w-12 h-12 text-slate-400" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">System Void</h3>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">No transactional evidence found in current filter.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {vouchers.map((tx) => (
                                <div key={tx.id} className={`glass-card overflow-hidden transition-all duration-500 border border-slate-200 dark:border-slate-800/50 hover:shadow-2xl shadow-slate-900/10 ${expandedVoucherId === tx.id ? 'ring-2 ring-indigo-500' : 'hover:-translate-y-1'}`}>
                                    {/* Summary View */}
                                    <div
                                        onClick={() => setExpandedVoucherId(expandedVoucherId === tx.id ? null : tx.id)}
                                        className="p-6 cursor-pointer flex flex-wrap lg:flex-nowrap items-center gap-8 group"
                                    >
                                        <div className="flex items-center gap-6 min-w-[200px]">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-transform group-hover:scale-110 ${tx.voucherType === 'PAYMENT' ? 'bg-rose-500/10 text-rose-500' :
                                                tx.voucherType === 'RECEIPT' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    'bg-indigo-500/10 text-indigo-500'
                                                }`}>
                                                {tx.voucherType.substring(0, 1)}
                                            </div>
                                            <div>
                                                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Voucher Number</p>
                                                <h4 className="text-base font-black text-slate-900 dark:text-white tracking-tighter">{tx.voucherNumber}</h4>
                                            </div>
                                        </div>

                                        <div className="hidden md:block w-px h-10 bg-slate-200 dark:bg-slate-800" />

                                        <div className="flex-1 min-w-[200px]">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Narration / Memo</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[400px]">
                                                {tx.narration || <span className="text-slate-400 italic font-medium opacity-50">No Remarks Captured</span>}
                                            </p>
                                        </div>

                                        <div className="hidden lg:block w-px h-10 bg-slate-200 dark:bg-slate-800" />

                                        <div className="min-w-[120px]">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Entry Date</p>
                                            <p className="text-[13px] font-black text-slate-900 dark:text-white">{new Date(tx.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                                        </div>

                                        <div className="min-w-[150px] text-right">
                                            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">Voucher Total</p>
                                            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">
                                                <span className="text-xs mr-1 opacity-40">PKR</span>
                                                {tx.entries.reduce((s, e) => s + e.debit, 0).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2 pl-4">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setSelectedVoucherForPrint(tx); }}
                                                className="p-3 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 rounded-xl transition-all"
                                            >
                                                <Printer size={18} />
                                            </button>
                                            {expandedVoucherId === tx.id ? <ChevronUp size={20} className="text-indigo-500" /> : <ChevronDown size={20} className="text-slate-400 group-hover:text-indigo-500" />}
                                        </div>
                                    </div>

                                    {/* Expanded Detail View */}
                                    {expandedVoucherId === tx.id && (
                                        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-900/[0.02] dark:bg-white/[0.02] animate-in slide-in-from-top-4 duration-500">
                                            <div className="p-8">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div>
                                                        <h5 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Transaction Lineage</h5>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleEdit(tx)}
                                                            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-600/20"
                                                        >
                                                            <Edit2 size={14} /> Redefine
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(tx.id)}
                                                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-rose-600/20"
                                                        >
                                                            <Trash2 size={14} /> Purge
                                                        </button>
                                                    </div>
                                                </div>

                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 dark:border-slate-800">
                                                            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-left">Account Identifier</th>
                                                            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-left">Internal Description</th>
                                                            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Debit Effect</th>
                                                            <th className="pb-4 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right">Credit Effect</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {tx.entries.map((entry) => (
                                                            <tr key={entry.id} className="group">
                                                                <td className="py-5">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-[9px] text-slate-500">{entry.account.code}</div>
                                                                        <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{entry.account.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="py-5 text-[11px] font-bold text-slate-500 italic">{entry.description || '-'}</td>
                                                                <td className="py-5 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                                                                    {entry.debit > 0 ? Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                </td>
                                                                <td className="py-5 text-right font-black text-sm text-rose-600 dark:text-rose-400">
                                                                    {entry.credit > 0 ? Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination Matrix */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex justify-center gap-6 items-center py-10 print:hidden">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="glass-panel p-4 rounded-2xl disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                            Shift Left
                        </button>
                        <div className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]">
                            BLOCK {page} / {pagination.pages}
                        </div>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="glass-panel p-4 rounded-2xl disabled:opacity-20 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-black uppercase text-[10px] tracking-widest"
                        >
                            Shift Right
                        </button>
                    </div>
                )}

                {/* Deploy Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-3xl animate-in fade-in duration-500">
                        <div className="relative glass-panel w-full max-w-6xl rounded-[3rem] shadow-[0_50px_150px_-30px_rgba(79,70,229,0.3)] border-indigo-500/20 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="p-10 border-b border-indigo-500/10 bg-indigo-600 text-white flex justify-between items-center">
                                <div className="flex items-center gap-8">
                                    <div className="p-4 bg-white/10 rounded-3xl border border-white/20 backdrop-blur-xl">
                                        <Briefcase size={32} />
                                    </div>
                                    <div>
                                        <h3 className="text-4xl font-black italic tracking-tighter uppercase">{editingVoucherId ? 'Refine' : 'Deploy'} {form.voucherType} ENTRY</h3>
                                        <p className="text-indigo-100 text-[10px] font-black uppercase tracking-[0.5em] mt-1">Transaction Protocol V4.2.0</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-4xl font-black tracking-tighter transition-all ${isBalanced ? 'text-white' : 'text-indigo-900/50'}`}>
                                        <span className="text-xs mr-2 uppercase opacity-40">Total</span>
                                        {totalDebit.toLocaleString()}
                                    </div>
                                    <div className="flex items-center gap-2 justify-end mt-2">
                                        {!isBalanced && <div className="w-2 h-2 rounded-full bg-indigo-900/30 animate-ping" />}
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-indigo-900/20 text-indigo-200'}`}>
                                            {isBalanced ? 'Configuration Balanced' : 'Awaiting Balance Matrix'}
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => setShowModal(false)} className="absolute top-10 right-10 p-3 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white">
                                    <X size={32} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
                                <div className="p-10 grid grid-cols-2 md:grid-cols-4 gap-8 bg-slate-50 dark:bg-slate-900/50 border-b border-border">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Voucher Category</label>
                                        <div className="flex p-1.5 bg-background dark:bg-slate-800 rounded-2xl border border-border shadow-inner">
                                            {['JOURNAL', 'PAYMENT', 'RECEIPT', 'CONTRA'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, voucherType: t as any })}
                                                    className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all duration-300 ${form.voucherType === t ? 'bg-indigo-600 text-white shadow-lg scale-[1.05]' : 'text-slate-500 hover:text-slate-900'}`}
                                                >
                                                    {t.substring(0, 1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Posting Chronology</label>
                                        <input
                                            type="date"
                                            required
                                            className="glass-input w-full py-4 font-black uppercase tracking-widest text-xs"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Narration Narrative</label>
                                        <input
                                            className="glass-input w-full py-4 text-xs font-bold"
                                            placeholder="Capture the essence of this transaction..."
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-slate-950">
                                    {(form.voucherType === 'PAYMENT' || form.voucherType === 'RECEIPT') ? (
                                        <div className="space-y-12 max-w-4xl mx-auto py-10 animate-in fade-in zoom-in-95 duration-500">
                                            <div className="grid grid-cols-2 gap-12 relative">
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500">
                                                        {form.voucherType === 'PAYMENT' ? 'Liquidity Source (Credit)' : 'Liquidity Target (Debit)'}
                                                    </label>
                                                    <AccountSearch
                                                        accounts={accounts.filter(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank'))}
                                                        value={form.sourceAccount}
                                                        onChange={(val: any) => setForm({ ...form, sourceAccount: val })}
                                                        placeholder="Deploy Cash/Bank..."
                                                    />
                                                </div>
                                                <div className="absolute left-1/2 top-10 -translate-x-1/2 p-3 bg-white dark:bg-slate-900 border border-border rounded-full shadow-2xl z-10 rotate-90 lg:rotate-0">
                                                    {form.voucherType === 'PAYMENT' ? <ArrowUpRight className="text-rose-500" /> : <ArrowDownLeft className="text-emerald-500" />}
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-500">
                                                        {form.voucherType === 'PAYMENT' ? 'Recipient Module (Debit)' : 'Originating Module (Credit)'}
                                                    </label>
                                                    <AccountSearch
                                                        accounts={accounts}
                                                        value={form.targetAccount}
                                                        onChange={(val: any) => setForm({ ...form, targetAccount: val })}
                                                        placeholder="Target Account..."
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-12 items-end">
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Magnitude / Amount</label>
                                                    <div className="relative group">
                                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-2xl text-slate-300 group-hover:text-indigo-500 transition-colors">Rs</div>
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="glass-input w-full text-5xl font-black pl-20 h-24 focus:ring-[20px] focus:ring-indigo-500/5 transition-all tracking-tighter"
                                                            value={form.amount || ''}
                                                            onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <label className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-500">Exchange Protocol</label>
                                                    <select
                                                        className="glass-input w-full h-24 font-black text-xl uppercase tracking-widest px-8 appearance-none"
                                                        value={form.paymentMode}
                                                        onChange={e => setForm({ ...form, paymentMode: e.target.value as any })}
                                                    >
                                                        <option value="CASH">Physical Cash</option>
                                                        <option value="BANK">Wire Transfer</option>
                                                        <option value="CHEQUE">Bank Instrument</option>
                                                        <option value="ONLINE">Digital Ledger</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {(form.paymentMode === 'CHEQUE' || form.paymentMode === 'BANK') && (
                                                <div className="grid grid-cols-3 gap-6 p-8 bg-slate-50 dark:bg-slate-900 rounded-[2.5rem] border border-border animate-in slide-in-from-top-4 duration-500 shadow-inner">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Instrument ID</label>
                                                        <input className="glass-input w-full py-4 font-mono font-black border-transparent bg-white dark:bg-slate-800" value={form.instrumentNo} onChange={e => setForm({ ...form, instrumentNo: e.target.value })} placeholder="CHQ-X901" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Release Chronology</label>
                                                        <input type="date" className="glass-input w-full py-4 font-black border-transparent bg-white dark:bg-slate-800" value={form.instrumentDate} onChange={e => setForm({ ...form, instrumentDate: e.target.value })} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Financial Institution</label>
                                                        <input className="glass-input w-full py-4 font-black uppercase border-transparent bg-white dark:bg-slate-800" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="Global Central Bank" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 pb-20">
                                            <div className="grid grid-cols-12 gap-8 mb-6 px-4">
                                                <div className="col-span-4 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Account Configuration</div>
                                                <div className="col-span-3 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Ledger Remark</div>
                                                <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Debit Matrix</div>
                                                <div className="col-span-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 text-right">Credit Matrix</div>
                                                <div className="col-span-1"></div>
                                            </div>
                                            <div className="space-y-3">
                                                {form.entries.map((entry, index) => (
                                                    <div key={index} className="grid grid-cols-12 gap-4 items-center group animate-in slide-in-from-left duration-300" style={{ animationDelay: `${index * 50}ms` }}>
                                                        <div className="col-span-4">
                                                            <AccountSearch
                                                                accounts={accounts}
                                                                value={entry.accountId}
                                                                onChange={(val: any) => updateEntry(index, 'accountId', val)}
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <input className="glass-input w-full py-2.5 text-xs font-bold" placeholder="Line Item Remark" value={entry.description} onChange={e => updateEntry(index, 'description', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input type="number" className="glass-input w-full py-2.5 font-black text-xs text-right focus:ring-emerald-500/20" placeholder="0.00" value={entry.debit || ''} onChange={e => updateEntry(index, 'debit', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <input type="number" className="glass-input w-full py-2.5 font-black text-xs text-right focus:ring-rose-500/20" placeholder="0.00" value={entry.credit || ''} onChange={e => updateEntry(index, 'credit', e.target.value)} />
                                                        </div>
                                                        <div className="col-span-1 flex justify-center">
                                                            <button type="button" onClick={() => removeEntry(index)} className="p-2.5 rounded-xl hover:bg-rose-500/10 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover:opacity-100">
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={addEntry}
                                                className="mt-8 flex items-center justify-center gap-3 w-full py-5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 hover:border-indigo-500 hover:text-indigo-500 transition-all group"
                                            >
                                                <Plus size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                                                Provision New Ledger Line
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-10 border-t border-border flex gap-6 bg-slate-50 dark:bg-slate-900/50">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-12 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all"
                                    >
                                        Abort Deployment
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isBalanced || loading}
                                        className={`flex-1 bg-indigo-600 dark:bg-white text-white dark:text-slate-900 py-5 rounded-[1.5rem] font-black text-base uppercase italic tracking-tighter shadow-2xl flex items-center justify-center gap-4 transition-all ${(!isBalanced || loading) ? 'opacity-20 grayscale cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24} />}
                                        {editingVoucherId ? 'Validate and Sync Voucher' : `Authorize ${form.voucherType} Protocol`}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Refined Print Layout */}
                {selectedVoucherForPrint && (
                    <div className="fixed inset-0 z-[200] bg-slate-50/50 backdrop-blur-3xl flex flex-col p-8 overflow-y-auto animate-in fade-in duration-500">
                        <div className="max-w-4xl mx-auto w-full mb-12 flex justify-between items-center print:hidden bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-2xl border border-border">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-900 dark:bg-white rounded-2xl">
                                    <Printer className="text-white dark:text-slate-900" size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none">Print Protocol</h2>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Voucher Identification: {selectedVoucherForPrint.voucherNumber}</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => window.print()} className="bg-slate-900 dark:bg-blue-600 text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl">Apply Print</button>
                                <button onClick={() => setSelectedVoucherForPrint(null)} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border border-border hover:bg-slate-100 transition-all">Close Pipeline</button>
                            </div>
                        </div>

                        {/* Official Print Matrix */}
                        <div className="w-full max-w-4xl mx-auto bg-white p-16 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.2)] print:shadow-none border-[1px] border-slate-200 print:border-none relative overflow-hidden">
                            {/* Watermark */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 opacity-[0.02] pointer-events-none select-none">
                                <h1 className="text-[12rem] font-black uppercase tracking-tighter">{selectedVoucherForPrint.voucherType}</h1>
                            </div>

                            {/* Header Branding */}
                            <div className="flex justify-between items-start mb-16 relative">
                                <div className="space-y-6">
                                    <div className="flex flex-col">
                                        <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.8]">
                                            {company?.name || 'LOGISTICS SOLUTIONS'}
                                        </h1>
                                        <div className="h-2 w-48 bg-indigo-600 mt-4" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{company?.tagline || 'Leading Global Logistic Operations'}</p>
                                        <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-2">
                                            <span>{company?.taxNumber && `NTN: ${company.taxNumber}`}</span>
                                            <span>{company?.registrationNo && `REG: ${company.registrationNo}`}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    <div className="bg-slate-900 text-white px-8 py-4 mb-6">
                                        <h2 className="text-4xl font-black uppercase italic tracking-tighter">Voucher</h2>
                                    </div>
                                    <div className="space-y-2 text-right">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Document Registry</p>
                                            <p className="text-xl font-black text-slate-900 tracking-tighter">{selectedVoucherForPrint.voucherNumber}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Effective Date</p>
                                            <p className="text-sm font-black text-slate-900 uppercase">{new Date(selectedVoucherForPrint.date).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Separation Line */}
                            <div className="flex gap-4 mb-16">
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">Business Narrative / Remittance Advice</p>
                                    <p className="text-base font-medium leading-relaxed text-slate-700">{selectedVoucherForPrint.narration || 'No Additional Remarks'}</p>
                                </div>
                                <div className="w-[300px] bg-slate-50 p-6 flex flex-col justify-between">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 italic">Protocol ID</p>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Type Identifier</p>
                                        <p className="text-lg font-black text-indigo-600 uppercase italic tracking-tighter">{selectedVoucherForPrint.voucherType} PROTOCOL</p>
                                    </div>
                                </div>
                            </div>

                            {/* Main Transaction Table */}
                            <div className="mb-20">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b-4 border-slate-900">
                                            <th className="py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest px-4">Account Specification</th>
                                            <th className="py-4 text-left text-[11px] font-black text-slate-900 uppercase tracking-widest px-4">Internal Remark</th>
                                            <th className="py-4 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest px-4">Debit</th>
                                            <th className="py-4 text-right text-[11px] font-black text-slate-900 uppercase tracking-widest px-4">Credit</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {selectedVoucherForPrint.entries.map((entry, idx) => (
                                            <tr key={idx} className="group">
                                                <td className="py-6 px-4">
                                                    <div className="flex items-center gap-4">
                                                        <span className="text-xs font-black text-slate-400 font-mono tracking-tighter">{entry.account.code}</span>
                                                        <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">{entry.account.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-6 px-4 text-[11px] font-bold text-slate-500 italic uppercase tracking-tight">{entry.description || '-'}</td>
                                                <td className="py-6 px-4 text-right font-black text-sm text-slate-900">
                                                    {entry.debit > 0 ? Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                                <td className="py-6 px-4 text-right font-black text-sm text-slate-900">
                                                    {entry.credit > 0 ? Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="border-t-4 border-slate-900 bg-slate-900 text-white">
                                            <td colSpan={2} className="py-5 px-6 text-right text-[11px] font-black uppercase tracking-[0.5em]">Consolidated Valuation</td>
                                            <td className="py-5 px-6 text-right font-black text-xl tracking-tighter">
                                                {selectedVoucherForPrint.entries.reduce((s, e) => s + Number(e.debit), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-5 px-6 text-right font-black text-xl tracking-tighter">
                                                {selectedVoucherForPrint.entries.reduce((s, e) => s + Number(e.credit), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* Address & Contact Footer */}
                            <div className="mb-20 grid grid-cols-2 gap-10 border-t border-slate-100 pt-10">
                                <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Corporate Headquarters</p>
                                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed uppercase">{company?.address || 'Operational Zone - Karachi, Pakistan'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Comm Channels</p>
                                    <p className="text-[11px] font-black text-slate-900">{company?.phone || '+92 000 0000000'}</p>
                                    <p className="text-[11px] font-black text-slate-900 lowercase">{company?.email || 'ops@logistics.com'}</p>
                                </div>
                            </div>

                            {/* Signature Matrix */}
                            <div className="grid grid-cols-3 gap-12 pt-12">
                                <div className="border-t-2 border-slate-900 pt-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 italic">Prepared By</p>
                                    <p className="text-[11px] font-black text-slate-500 mt-4 uppercase italic">{selectedVoucherForPrint.postedBy?.name || 'Authorized System User'}</p>
                                </div>
                                <div className="border-t-2 border-slate-900 pt-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 italic">Accounts Audit</p>
                                    <div className="h-10" />
                                </div>
                                <div className="border-t-2 border-slate-900 pt-6 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 italic">Chief Executive</p>
                                    <div className="h-10" />
                                </div>
                            </div>

                            <div className="mt-20 text-center opacity-20">
                                <p className="text-[8px] font-black uppercase tracking-[1em]">Logistics ERP System - Secure Ledger Protocol</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    body { background: white !important; margin: 0 !important; padding: 0 !important; -webkit-print-color-adjust: exact !important; }
                    .max-w-4xl { max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; }
                    @page { margin: 1cm; }
                }
            `}</style>
        </DashboardLayout>
    );
}
