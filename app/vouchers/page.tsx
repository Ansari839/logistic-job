'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    FileText, Plus, Search, Trash2,
    ArrowRightLeft, AlertCircle, CheckCircle2,
    Calculator, Calendar, Hash, Loader2, Info
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
    account: { name: string; code: string };
}

interface Voucher {
    id: number;
    voucherNumber: string;
    date: string;
    description: string | null;
    voucherType: 'JOURNAL' | 'PAYMENT' | 'RECEIPT';
    entries: Entry[];
    postedBy?: { name: string | null };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export default function JournalVouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Filters & Pagination
    const [typeFilter, setTypeFilter] = useState<'ALL' | 'JOURNAL' | 'PAYMENT' | 'RECEIPT'>('ALL');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    // Voucher Form State
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        voucherType: 'JOURNAL' as 'JOURNAL' | 'PAYMENT' | 'RECEIPT',
        paymentMode: 'CASH' as 'CASH' | 'BANK' | 'CHEQUE' | 'ONLINE',
        instrumentNo: '',
        instrumentDate: '',
        bankName: '',
        // For Payment/Receipt modes
        sourceAccount: '', // From (CR for Payment, DR for Receipt)
        targetAccount: '', // To (DR for Payment, CR for Receipt)
        amount: 0,
        // For Journal/Multi
        entries: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' },
        ]
    });

    const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Voucher | null>(null);

    useEffect(() => {
        fetchVouchers();
    }, [page, typeFilter]);

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
                ...(typeFilter !== 'ALL' && { type: typeFilter })
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

    const totalDebit = form.voucherType === 'JOURNAL'
        ? form.entries.reduce((sum, e) => sum + Number(e.debit), 0)
        : form.amount;
    const totalCredit = form.voucherType === 'JOURNAL'
        ? form.entries.reduce((sum, e) => sum + Number(e.credit), 0)
        : form.amount;

    const isBalanced = form.voucherType === 'JOURNAL'
        ? (Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0)
        : (form.amount > 0 && form.sourceAccount && form.targetAccount);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return;

        let entries: any[] = [];
        if (form.voucherType === 'JOURNAL') {
            entries = form.entries.map(e => ({
                accountId: Number(e.accountId),
                description: e.description,
                debit: Number(e.debit),
                credit: Number(e.credit)
            }));
        } else if (form.voucherType === 'PAYMENT') {
            // Payment: CR Cash/Bank (Source), DR Payee (Target)
            entries = [
                { accountId: Number(form.targetAccount), debit: Number(form.amount), credit: 0, description: form.description },
                { accountId: Number(form.sourceAccount), debit: 0, credit: Number(form.amount), description: form.description }
            ];
        } else if (form.voucherType === 'RECEIPT') {
            // Receipt: DR Cash/Bank (Source), CR Payer (Target)
            entries = [
                { accountId: Number(form.sourceAccount), debit: Number(form.amount), credit: 0, description: form.description },
                { accountId: Number(form.targetAccount), debit: 0, credit: Number(form.amount), description: form.description }
            ];
        }

        try {
            const res = await fetch('/api/vouchers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                fetchVouchers();
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    voucherType: 'JOURNAL',
                    paymentMode: 'CASH',
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
                });
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
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="print:hidden">
                        <h1 className="text-4xl font-black text-heading tracking-tighter uppercase italic">Voucher System</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Unified Journal & Cash Entries</p>
                    </div>
                    <div className="flex items-center gap-4 print:hidden">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value as any)}
                            className="glass-input py-3 rounded-2xl font-bold text-xs uppercase"
                        >
                            <option value="ALL">All Types</option>
                            <option value="JOURNAL">Journal Vouchers</option>
                            <option value="PAYMENT">Payments</option>
                            <option value="RECEIPT">Receipts</option>
                        </select>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[2.5rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            <Plus size={20} />
                            New Voucher
                        </button>
                    </div>
                </div>

                {/* History */}
                <div className="grid gap-6 print:hidden">
                    {loading ? (
                        <div className="glass-panel p-20 flex flex-col items-center">
                            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                            <p className="text-subtext font-bold uppercase tracking-widest text-xs">Retrieving Ledger Evidence...</p>
                        </div>
                    ) : vouchers.length === 0 ? (
                        <div className="glass-panel p-20 text-center">
                            <ArrowRightLeft className="w-16 h-16 text-subtext opacity-20 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No Vouchers Found</h3>
                            <p className="text-subtext text-sm mt-1">Create your first voucher to start adjustments.</p>
                        </div>
                    ) : (
                        vouchers.map((tx) => (
                            <div key={tx.id} className="glass-card shadow-sm overflow-hidden group">
                                <div className="p-6 border-b border-border flex items-center justify-between bg-primary/5">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] text-subtext font-black uppercase tracking-widest mb-1">Voucher #</p>
                                            <h4 className="text-lg font-black text-foreground">{tx.voucherNumber}</h4>
                                        </div>
                                        <div className="w-px h-8 bg-border" />
                                        <div>
                                            <p className="text-[10px] text-subtext font-black uppercase tracking-widest mb-1">Entry Date</p>
                                            <p className="text-sm font-bold text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedVoucherForPrint(tx)}
                                            className="p-2 hover:bg-indigo-500/10 text-indigo-600 rounded-lg transition-colors"
                                            title="Print Voucher"
                                        >
                                            <FileText size={20} />
                                        </button>
                                        <div className="text-right">
                                            <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Type</p>
                                            <span className="text-xs font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">{tx.voucherType}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-primary/5">
                                                <th className="px-4 py-2 text-[10px] font-black text-subtext uppercase tracking-widest">Account</th>
                                                <th className="px-4 py-2 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Debit</th>
                                                <th className="px-4 py-2 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {tx.entries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td className="px-4 py-2">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-foreground">{entry.account.name}</span>
                                                            <span className="text-[10px] font-bold text-subtext font-mono">{entry.account.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-black text-sm text-foreground">{entry.debit > 0 ? Number(entry.debit).toLocaleString() : '-'}</td>
                                                    <td className="px-4 py-2 text-right font-black text-sm text-foreground">{entry.credit > 0 ? Number(entry.credit).toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="flex justify-center gap-4 items-center py-4 print:hidden">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="glass-button-secondary py-2 px-6 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="text-subtext font-black">Page {page} of {pagination.pages}</span>
                        <button
                            disabled={page === pagination.pages}
                            onClick={() => setPage(p => p + 1)}
                            className="glass-button-secondary py-2 px-6 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}

                {/* Voucher Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <div className="relative glass-panel w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-border bg-indigo-600 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">{form.voucherType} Voucher</h3>
                                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest">Entry Protocol V3</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black tracking-tighter ${isBalanced ? 'text-white' : 'text-indigo-900'}`}>
                                        {totalDebit.toLocaleString()} <span className="text-xs italic uppercase">Total</span>
                                    </div>
                                    {!isBalanced && <span className="text-[10px] bg-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-black uppercase">Pending Balance</span>}
                                    {isBalanced && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black uppercase">Balanced</span>}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col h-[75vh]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6 border-b border-border bg-secondary/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Voucher Mode</label>
                                        <div className="flex p-1 bg-background/40 rounded-xl border border-border">
                                            {['JOURNAL', 'PAYMENT', 'RECEIPT'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, voucherType: t as any })}
                                                    className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${form.voucherType === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-subtext hover:text-foreground'}`}
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Entry Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="glass-input w-full py-2.5 text-xs"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Narration / Remarks</label>
                                        <input
                                            className="glass-input w-full py-2.5 text-xs"
                                            placeholder="Enter transaction details..."
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8">
                                    {(form.voucherType === 'PAYMENT' || form.voucherType === 'RECEIPT') ? (
                                        <div className="space-y-8 max-w-2xl mx-auto">
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-black uppercase tracking-widest text-indigo-500">
                                                        {form.voucherType === 'PAYMENT' ? 'Paid From (Credit)' : 'Deposit To (Debit)'}
                                                    </label>
                                                    <select
                                                        required
                                                        className="glass-input w-full border-indigo-500/30"
                                                        value={form.sourceAccount}
                                                        onChange={e => setForm({ ...form, sourceAccount: e.target.value })}
                                                    >
                                                        <option value="">Select Cash/Bank...</option>
                                                        {accounts.filter(a => a.name.toLowerCase().includes('cash') || a.name.toLowerCase().includes('bank')).map(a => (
                                                            <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-xs font-black uppercase tracking-widest text-emerald-500">
                                                        {form.voucherType === 'PAYMENT' ? 'Paid To (Debit)' : 'Received From (Credit)'}
                                                    </label>
                                                    <select
                                                        required
                                                        className="glass-input w-full border-emerald-500/30"
                                                        value={form.targetAccount}
                                                        onChange={e => setForm({ ...form, targetAccount: e.target.value })}
                                                    >
                                                        <option value="">Select Account...</option>
                                                        {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-8 items-end">
                                                <div className="space-y-3">
                                                    <label className="text-xs font-black uppercase tracking-widest text-subtext">Amount</label>
                                                    <div className="relative">
                                                        <input
                                                            type="number"
                                                            placeholder="0.00"
                                                            className="glass-input w-full text-2xl font-black pl-10 h-16"
                                                            value={form.amount || ''}
                                                            onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                                                        />
                                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-subtext opacity-50">Rs</span>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-xs font-black uppercase tracking-widest text-subtext">Method</label>
                                                    <select
                                                        className="glass-input w-full h-16"
                                                        value={form.paymentMode}
                                                        onChange={e => setForm({ ...form, paymentMode: e.target.value as any })}
                                                    >
                                                        <option value="CASH">Cash</option>
                                                        <option value="BANK">Bank Transfer</option>
                                                        <option value="CHEQUE">Cheque</option>
                                                        <option value="ONLINE">Online/Credit</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {(form.paymentMode === 'CHEQUE' || form.paymentMode === 'BANK') && (
                                                <div className="grid grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <div>
                                                        <label className="text-[10px] font-black text-subtext uppercase mb-1">Instrument #</label>
                                                        <input className="glass-input w-full py-2 text-xs" value={form.instrumentNo} onChange={e => setForm({ ...form, instrumentNo: e.target.value })} placeholder="CHQ-001" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-subtext uppercase mb-1">Inst. Date</label>
                                                        <input type="date" className="glass-input w-full py-2 text-xs" value={form.instrumentDate} onChange={e => setForm({ ...form, instrumentDate: e.target.value })} />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black text-subtext uppercase mb-1">Bank Name</label>
                                                        <input className="glass-input w-full py-2 text-xs" value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} placeholder="HBL / Alfalah" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {form.entries.map((entry, index) => (
                                                <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                                    <div className="col-span-4">
                                                        <select
                                                            className="glass-input w-full py-2 text-xs"
                                                            value={entry.accountId}
                                                            onChange={e => updateEntry(index, 'accountId', e.target.value)}
                                                        >
                                                            <option value="">Select Account...</option>
                                                            {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <input className="glass-input w-full py-2 text-xs" placeholder="Description" value={entry.description} onChange={e => updateEntry(index, 'description', e.target.value)} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input type="number" className="glass-input w-full py-2 text-xs text-right" placeholder="Debit" value={entry.debit || ''} onChange={e => updateEntry(index, 'debit', e.target.value)} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <input type="number" className="glass-input w-full py-2 text-xs text-right" placeholder="Credit" value={entry.credit || ''} onChange={e => updateEntry(index, 'credit', e.target.value)} />
                                                    </div>
                                                    <button type="button" onClick={() => removeEntry(index)} className="col-span-1 p-2 text-subtext hover:text-rose-500"><Trash2 size={16} /></button>
                                                </div>
                                            ))}
                                            <button type="button" onClick={addEntry} className="flex items-center gap-2 text-indigo-500 font-black text-[10px] uppercase tracking-widest p-2 hover:bg-indigo-500/10 rounded-lg border border-border">
                                                <Plus size={14} /> Add Line
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="p-8 border-t border-border flex gap-4 bg-secondary/5">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 glass-button-secondary py-5">Discard Entry</button>
                                    <button type="submit" disabled={!isBalanced} className={`flex-1 glass-button py-5 ${!isBalanced && 'opacity-30 grayscale'}`}>Post {form.voucherType} Voucher</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Print Overlay */}
                {selectedVoucherForPrint && (
                    <div className="fixed inset-0 z-[60] bg-white flex flex-col p-12 overflow-y-auto">
                        <div className="absolute top-8 right-8 print:hidden flex gap-4">
                            <button onClick={() => window.print()} className="glass-button bg-black text-white px-6">Direct Print</button>
                            <button onClick={() => setSelectedVoucherForPrint(null)} className="glass-button bg-slate-200 text-slate-800 px-6">Close Preview</button>
                        </div>

                        <div className="w-full max-w-4xl mx-auto border-[3px] border-black p-10 font-serif">
                            <div className="flex justify-between items-start border-b-2 border-black pb-8 mb-8">
                                <div>
                                    <h1 className="text-4xl font-black uppercase tracking-tighter">Voucher Copy</h1>
                                    <p className="text-xl font-black mt-2 text-indigo-700">{company?.name || 'Logistics Solutions ERP'}</p>
                                    <div className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
                                        <p>{company?.address}</p>
                                        <p>{company?.phone} | {company?.email}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-sm">Voucher #: {selectedVoucherForPrint.voucherNumber}</p>
                                    <p className="font-bold text-sm">Type: {selectedVoucherForPrint.voucherType}</p>
                                    <p className="font-bold text-sm">Date: {new Date(selectedVoucherForPrint.date).toLocaleDateString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12 mb-10">
                                <div>
                                    <p className="text-xs uppercase font-black text-slate-500 mb-1">Description / Narration</p>
                                    <p className="text-lg font-medium">{selectedVoucherForPrint.description || 'N/A'}</p>
                                </div>
                                {(selectedVoucherForPrint.voucherType !== 'JOURNAL') && (
                                    <div className="bg-slate-50 p-4 border border-slate-200">
                                        <p className="text-[10px] uppercase font-black text-slate-500 mb-1">Instrument Details</p>
                                        <p className="text-sm">Method: <strong>Cash</strong></p>
                                        {/* In a real app, these would come from the voucher metadata */}
                                    </div>
                                )}
                            </div>

                            <table className="w-full border-collapse mb-12">
                                <thead>
                                    <tr className="border-b-2 border-black bg-slate-100">
                                        <th className="px-4 py-3 text-left font-black uppercase text-xs">A/C Title & Description</th>
                                        <th className="px-4 py-3 text-right font-black uppercase text-xs w-32">Debit</th>
                                        <th className="px-4 py-3 text-right font-black uppercase text-xs w-32">Credit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedVoucherForPrint.entries.map((entry, idx) => (
                                        <tr key={idx} className="border-b border-slate-300">
                                            <td className="px-4 py-4">
                                                <p className="font-bold text-md">{entry.account.name}</p>
                                                <p className="text-[10px] font-mono opacity-60">Code: {entry.account.code}</p>
                                                {entry.description && <p className="text-xs italic mt-1">{entry.description}</p>}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold">{entry.debit > 0 ? Number(entry.debit).toLocaleString() : '-'}</td>
                                            <td className="px-4 py-4 text-right font-bold">{entry.credit > 0 ? Number(entry.credit).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black bg-slate-50">
                                        <td className="px-4 py-4 text-right font-black uppercase text-xs">Grand Total</td>
                                        <td className="px-4 py-4 text-right font-black text-md">
                                            {selectedVoucherForPrint.entries.reduce((s, e) => s + Number(e.debit), 0).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right font-black text-md">
                                            {selectedVoucherForPrint.entries.reduce((s, e) => s + Number(e.credit), 0).toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="grid grid-cols-3 gap-8 mt-20">
                                <div className="border-t border-black pt-4 text-center">
                                    <p className="text-[10px] font-black uppercase">Prepared By</p>
                                    <p className="text-sm font-bold mt-2">{selectedVoucherForPrint.postedBy?.name || 'Admin User'}</p>
                                </div>
                                <div className="border-t border-black pt-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Accounts Approval</p>
                                </div>
                                <div className="border-t border-black pt-4 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Receiver Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-7xl { max-width: 100% !important; margin: 0 !important; }
                }
            `}</style>
        </DashboardLayout>
    );
}
