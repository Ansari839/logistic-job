'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    CreditCard, Plus, Search, X,
    ArrowDownLeft, ArrowUpRight, Trash2,
    Building2, User, Loader2
} from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface Payment {
    id: number;
    receiptNumber: string;
    date: string;
    amount: number;
    mode: string;
    reference: string | null;
    customer?: { name: string };
    vendor?: { name: string };
    transaction: {
        reference: string;
        entries: {
            id: number;
            debit: number;
            credit: number;
            description: string | null;
            account: { name: string; code: string };
        }[];
    };
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState<Payment | null>(null);
    const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');

    // JV-Style Form State
    const [form, setForm] = useState({
        receiptNumber: '',
        date: new Date().toISOString().split('T')[0],
        mode: 'CASH',
        reference: '',
        customerId: '',
        vendorId: '',
        entries: [
            { accountId: '', debit: 0, credit: 0, description: '' },
            { accountId: '', debit: 0, credit: 0, description: '' },
        ]
    });

    const [entities, setEntities] = useState<{ customers: any[], vendors: any[] }>({
        customers: [],
        vendors: []
    });

    useEffect(() => {
        fetchPayments();
        fetchAccounts();
        fetchEntities();
    }, []);

    const fetchPayments = async () => {
        try {
            const res = await fetch('/api/payments');
            if (res.ok) {
                const data = await res.json();
                setPayments(data.payments);
            }
        } catch (err) {
            console.error('Fetch payments failed');
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

    const fetchEntities = async () => {
        try {
            const [custRes, vendRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/vendors')
            ]);
            const [cust, vend] = await Promise.all([
                custRes.json(),
                vendRes.json()
            ]);
            setEntities({
                customers: cust.customers,
                vendors: vend.vendors
            });
        } catch (err) {
            console.error('Fetch entities failed');
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
            // Calculate total amount from entries
            const amount = type === 'RECEIPT' ? totalDebit : totalCredit;

            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    receiptNumber: form.receiptNumber,
                    date: form.date,
                    amount,
                    mode: form.mode,
                    reference: form.reference,
                    customerId: type === 'RECEIPT' ? Number(form.customerId) : null,
                    vendorId: type === 'PAYMENT' ? Number(form.vendorId) : null,
                    bankAccountId: Number(form.entries[0].accountId), // First entry is bank/cash
                }),
            });

            if (res.ok) {
                setShowModal(false);
                fetchPayments();
                resetForm();
            }
        } catch (err) {
            console.error('Submit payment failed');
        }
    };

    const resetForm = () => {
        setForm({
            receiptNumber: '',
            date: new Date().toISOString().split('T')[0],
            mode: 'CASH',
            reference: '',
            customerId: '',
            vendorId: '',
            entries: [
                { accountId: '', debit: 0, credit: 0, description: '' },
                { accountId: '', debit: 0, credit: 0, description: '' },
            ]
        });
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Payment Vouchers</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Cash Flow Management</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setType('RECEIPT'); setShowModal(true); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20"
                        >
                            <ArrowDownLeft size={20} />
                            Receipt Voucher
                        </button>
                        <button
                            onClick={() => { setType('PAYMENT'); setShowModal(true); }}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-[2rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-rose-600/20"
                        >
                            <ArrowUpRight size={20} />
                            Payment Voucher
                        </button>
                    </div>
                </div>

                {/* Simple Voucher List */}
                <div className="glass-panel overflow-hidden">
                    <div className="p-8 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Voucher History</h3>
                        <div className="relative group w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext" size={16} />
                            <input
                                type="text"
                                placeholder="Search vouchers..."
                                className="glass-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Voucher No.</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Party</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Type</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <Loader2 className="animate-spin w-8 h-8 text-blue-600 mx-auto mb-4" />
                                            <p className="text-subtext font-black uppercase tracking-widest text-[10px]">Loading Vouchers...</p>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <CreditCard size={48} className="text-subtext opacity-20 mx-auto mb-4" />
                                            <p className="text-subtext font-bold uppercase tracking-widest text-sm">No vouchers found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr
                                            key={p.id}
                                            onClick={() => setSelectedVoucher(p)}
                                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                        >
                                            <td className="px-8 py-5">
                                                <span className="text-slate-900 dark:text-white font-black text-sm">{p.receiptNumber}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-subtext text-xs font-bold">{new Date(p.date).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.customer ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                        {p.customer ? <User size={14} /> : <Building2 size={14} />}
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm">{p.customer?.name || p.vendor?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${p.customer ? 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20' : 'text-rose-300 bg-rose-500/10 border border-rose-500/20'}`}>
                                                    {p.customer ? 'Receipt' : 'Payment'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-lg font-black tracking-tighter ${p.customer ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {p.amount.toLocaleString()} <span className="text-[10px] uppercase ml-1">PKR</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* JV-Style Form Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <div className="relative glass-panel w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className={`p-8 border-b border-border ${type === 'RECEIPT' ? 'bg-emerald-600' : 'bg-rose-600'} text-white flex justify-between items-center`}>
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">{type === 'RECEIPT' ? 'Receipt Voucher' : 'Payment Voucher'}</h3>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Double-Entry Voucher System</p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-black tracking-tighter ${isBalanced ? 'text-white' : 'text-white/50'}`}>
                                        {totalDebit.toLocaleString()} <span className="text-xs italic uppercase">Total</span>
                                    </div>
                                    {!isBalanced && totalDebit > 0 && <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-black uppercase">Out of Balance</span>}
                                    {isBalanced && <span className="text-[10px] bg-white text-emerald-600 px-2 py-0.5 rounded font-black uppercase">Balanced</span>}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
                                <div className="p-8 grid grid-cols-2 md:grid-cols-3 gap-6 border-b border-border">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Voucher No.</label>
                                        <input
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={type === 'RECEIPT' ? 'RV-001' : 'PV-001'}
                                            value={form.receiptNumber}
                                            onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">{type === 'RECEIPT' ? 'From Customer' : 'To Vendor'}</label>
                                        <select
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={type === 'RECEIPT' ? form.customerId : form.vendorId}
                                            onChange={e => setForm({ ...form, [type === 'RECEIPT' ? 'customerId' : 'vendorId']: e.target.value })}
                                        >
                                            <option value="">Select...</option>
                                            {(type === 'RECEIPT' ? entities.customers : entities.vendors).map(e => (
                                                <option key={e.id} value={e.id}>{e.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                    {form.entries.map((entry, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in slide-in-from-left-2 duration-200">
                                            <div className="col-span-4">
                                                <select
                                                    className="glass-input w-full rounded-xl px-4 py-3 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={entry.accountId}
                                                    onChange={e => updateEntry(index, 'accountId', e.target.value)}
                                                >
                                                    <option value="">Select Account...</option>
                                                    {accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    className="glass-input w-full rounded-xl px-4 py-3 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Description"
                                                    value={entry.description}
                                                    onChange={e => updateEntry(index, 'description', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    className="glass-input w-full rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Debit"
                                                    value={entry.debit || ''}
                                                    onChange={e => updateEntry(index, 'debit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <input
                                                    type="number"
                                                    className="glass-input w-full rounded-xl px-4 py-3 text-xs font-black text-slate-900 dark:text-white text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Credit"
                                                    value={entry.credit || ''}
                                                    onChange={e => updateEntry(index, 'credit', e.target.value)}
                                                />
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => removeEntry(index)}
                                                    className="p-2 text-subtext hover:text-rose-500 transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={addEntry}
                                        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl hover:bg-blue-500/10 transition-all border border-blue-500/20"
                                    >
                                        <Plus size={14} />
                                        Add Entry Line
                                    </button>
                                </div>

                                <div className="p-8 border-t border-border flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="flex-1 px-8 py-5 rounded-3xl border border-border text-subtext font-black uppercase tracking-widest text-xs hover:bg-primary/5 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!isBalanced}
                                        className={`flex-1 ${isBalanced ? (type === 'RECEIPT' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20') : 'bg-primary/10 text-subtext cursor-not-allowed'} text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95`}
                                    >
                                        Post Voucher
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Voucher Detail Modal */}
                {selectedVoucher && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/90 backdrop-blur-md" onClick={() => setSelectedVoucher(null)} />
                        <div className="relative glass-panel w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className={`p-8 border-b border-border ${selectedVoucher.customer ? 'bg-emerald-600' : 'bg-rose-600'} text-white flex justify-between items-center`}>
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">{selectedVoucher.receiptNumber}</h3>
                                    <p className="text-white/70 text-xs font-bold uppercase tracking-widest">{selectedVoucher.customer ? 'Receipt Voucher' : 'Payment Voucher'}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedVoucher(null)}
                                    className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-3 gap-6">
                                    <div>
                                        <p className="text-[10px] text-subtext font-black uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(selectedVoucher.date).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-subtext font-black uppercase tracking-widest mb-1">Party</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedVoucher.customer?.name || selectedVoucher.vendor?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-subtext font-black uppercase tracking-widest mb-1">Mode</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{selectedVoucher.mode}</p>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-primary/5">
                                                <th className="px-6 py-4 text-[10px] font-black text-subtext uppercase tracking-widest">Account</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-subtext uppercase tracking-widest">Description</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Debit</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Credit</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {selectedVoucher.transaction.entries.map((entry: any) => (
                                                <tr key={entry.id}>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-bold text-slate-900 dark:text-white">{entry.account.name}</span>
                                                            <span className="text-[10px] font-bold text-subtext font-mono">{entry.account.code}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-medium text-subtext">{entry.description || '-'}</td>
                                                    <td className="px-6 py-4 text-right font-black text-sm text-slate-900 dark:text-white">
                                                        {entry.debit > 0 ? entry.debit.toLocaleString() : '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-black text-sm text-slate-900 dark:text-white">
                                                        {entry.credit > 0 ? entry.credit.toLocaleString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-primary/5 border-t-2 border-border">
                                                <td colSpan={2} className="px-6 py-4 text-right font-black text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                                                    Total
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-lg text-blue-600 dark:text-blue-400">
                                                    {selectedVoucher.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-lg text-blue-600 dark:text-blue-400">
                                                    {selectedVoucher.amount.toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
