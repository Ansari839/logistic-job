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

interface Transaction {
    id: number;
    reference: string;
    date: string;
    description: string | null;
    type: string;
    entries: {
        id: number;
        debit: number;
        credit: number;
        description: string | null;
        account: { name: string; code: string };
    }[];
}

export default function JournalVouchersPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // JV Form State
    const [form, setForm] = useState({
        reference: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        entries: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' },
        ]
    });

    useEffect(() => {
        fetchTransactions();
        fetchAccounts();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions?type=JOURNAL');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
            }
        } catch (err) {
            console.error('Fetch transactions failed');
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

    const totalDebit = form.entries.reduce((sum, e) => sum + Number(e.debit), 0);
    const totalCredit = form.entries.reduce((sum, e) => sum + Number(e.credit), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isBalanced) return;

        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    type: 'JOURNAL',
                    entries: form.entries.map(e => ({
                        ...e,
                        accountId: Number(e.accountId),
                        debit: Number(e.debit),
                        credit: Number(e.credit)
                    }))
                }),
            });
            if (res.ok) {
                setShowModal(false);
                fetchTransactions();
                setForm({
                    reference: '',
                    date: new Date().toISOString().split('T')[0],
                    description: '',
                    entries: [
                        { accountId: '', debit: 0, credit: 0, description: '' },
                        { accountId: '', debit: 0, credit: 0, description: '' },
                    ]
                });
            }
        } catch (err) {
            console.error('Submit JV failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Journal Vouchers</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Manual Adjustments & Provisions</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[2.5rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                    >
                        <Plus size={20} />
                        Create Manual JV
                    </button>
                </div>

                {/* JV History */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] p-20 flex flex-col items-center">
                            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Retrieving Ledger Evidence...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] p-20 text-center">
                            <ArrowRightLeft className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white">No Journal Vouchers Found</h3>
                            <p className="text-slate-500 text-sm mt-1">Create your first manual entry to start adjustments.</p>
                        </div>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] overflow-hidden group">
                                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                                    <div className="flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Reference</p>
                                            <h4 className="text-lg font-black text-white">{tx.reference}</h4>
                                        </div>
                                        <div className="w-px h-8 bg-slate-800" />
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Entry Date</p>
                                            <p className="text-sm font-bold text-slate-300">{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Transaction Type</p>
                                        <span className="text-xs font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">{tx.type}</span>
                                    </div>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-950/40">
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Account</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest">Description</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Debit</th>
                                                <th className="px-8 py-4 text-[10px] font-black text-slate-600 uppercase tracking-widest text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {tx.entries.map((entry) => (
                                                <tr key={entry.id}>
                                                    <td className="px-8 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-white">{entry.account.name}</span>
                                                            <span className="text-[10px] font-bold text-slate-500 font-mono">{entry.account.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-4 text-xs font-medium text-slate-400">{entry.description || '-'}</td>
                                                    <td className="px-8 py-4 text-right font-black text-sm text-white">{entry.debit > 0 ? entry.debit.toLocaleString() : '-'}</td>
                                                    <td className="px-8 py-4 text-right font-black text-sm text-white">{entry.credit > 0 ? entry.credit.toLocaleString() : '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* JV Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-white/5 bg-indigo-600 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">Manual Journal Voucher</h3>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Double-Entry Accuracy Protocol</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black tracking-tighter ${isBalanced ? 'text-white' : 'text-indigo-900'}`}>
                                        {totalDebit.toLocaleString()} <span className="text-xs italic uppercase">Total</span>
                                    </div>
                                    {!isBalanced && totalDebit > 0 && <span className="text-[10px] bg-indigo-900 text-indigo-400 px-2 py-0.5 rounded font-black uppercase">Out of Balance</span>}
                                    {isBalanced && <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded font-black uppercase">Balanced</span>}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6 border-b border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">JV Reference</label>
                                        <input
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="JV-2025-001"
                                            value={form.reference}
                                            onChange={e => setForm({ ...form, reference: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Entry Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2 col-span-2 md:col-span-1">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Memo / Description</label>
                                        <input
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="Adjustment for..."
                                            value={form.description}
                                            onChange={e => setForm({ ...form, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                    {form.entries.map((entry, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in slide-in-from-left-2 duration-200">
                                            <div className="col-span-4">
                                                <select
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={entry.accountId}
                                                    onChange={e => updateEntry(index, 'accountId', e.target.value)}
                                                >
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Description"
                                                    value={entry.description}
                                                    onChange={e => updateEntry(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Debit"
                                                    value={entry.debit || ''}
                                                    onChange={e => updateEntry(index, 'debit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                                    placeholder="Credit"
                                                    value={entry.credit || ''}
                                                    onChange={e => updateEntry(index, 'credit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeEntry(index)}
                                                    className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addEntry}
                                        className="flex items-center gap-2 text-indigo-400 font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl hover:bg-indigo-500/10 transition-all border border-indigo-500/20"
                                    >
                                        <Plus size={14} />
                                        Add Multi-Line Entry
                                    </button>
                                </div>

                                <div className="p-8 border-t border-white/5 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 rounded-3xl border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs hover:bg-slate-800 hover:text-white transition-all"
                                    >
                                        Cancel Adjustment
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isBalanced}
                                        className={`flex-1 ${isBalanced ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-slate-800 cursor-not-allowed'} text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95`}
                                    >
                                        Authorize & Post JV
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
