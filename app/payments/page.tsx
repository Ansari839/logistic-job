'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    CreditCard, Plus, Search, Filter,
    ArrowDownLeft, ArrowUpRight, Clock,
    CheckCircle2, AlertCircle, DollarSign,
    Building2, User, Calendar, Hash, Loader2
} from 'lucide-react';

interface Payment {
    id: number;
    receiptNumber: string;
    date: string;
    amount: number;
    mode: string;
    reference: string | null;
    customer?: { name: string };
    vendor?: { name: string };
    transaction: { reference: string };
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [type, setType] = useState<'RECEIPT' | 'PAYMENT'>('RECEIPT');

    // Form State
    const [form, setForm] = useState({
        receiptNumber: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        mode: 'CASH',
        reference: '',
        customerId: '',
        vendorId: '',
        bankAccountId: '',
    });

    const [entities, setEntities] = useState<{ customers: any[], vendors: any[], accounts: any[] }>({
        customers: [],
        vendors: [],
        accounts: []
    });

    useEffect(() => {
        fetchPayments();
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

    const fetchEntities = async () => {
        try {
            const [custRes, vendRes, accRes] = await Promise.all([
                fetch('/api/customers'),
                fetch('/api/vendors'),
                fetch('/api/accounts')
            ]);
            const [cust, vend, acc] = await Promise.all([
                custRes.json(),
                vendRes.json(),
                accRes.json()
            ]);
            setEntities({
                customers: cust.customers,
                vendors: vend.vendors,
                accounts: acc.accounts.filter((a: any) => a.code.startsWith('1110') || a.code.startsWith('1120')) // Cash or Bank
            });
        } catch (err) {
            console.error('Fetch entities failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: Number(form.amount),
                    customerId: type === 'RECEIPT' ? Number(form.customerId) : null,
                    vendorId: type === 'PAYMENT' ? Number(form.vendorId) : null,
                    bankAccountId: Number(form.bankAccountId)
                }),
            });
            if (res.ok) {
                setShowModal(false);
                fetchPayments();
                setForm({
                    receiptNumber: '',
                    date: new Date().toISOString().split('T')[0],
                    amount: '',
                    mode: 'CASH',
                    reference: '',
                    customerId: '',
                    vendorId: '',
                    bankAccountId: '',
                });
            }
        } catch (err) {
            console.error('Submit payment failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Settlements & Payments</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Cash Flow Management</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => { setType('RECEIPT'); setShowModal(true); }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-[2rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20"
                        >
                            <ArrowDownLeft size={20} />
                            Customer Receipt
                        </button>
                        <button
                            onClick={() => { setType('PAYMENT'); setShowModal(true); }}
                            className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-[2rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-rose-600/20"
                        >
                            <ArrowUpRight size={20} />
                            Vendor Payment
                        </button>
                    </div>
                </div>

                {/* History Table */}
                <div className="glass-panel overflow-hidden">
                    <div className="p-8 border-b border-border flex items-center justify-between">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Recent Transactions</h3>
                        <div className="relative group w-64">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext" size={16} />
                            <input
                                type="text"
                                placeholder="Search payments..."
                                className="glass-input w-full rounded-xl py-2 pl-10 pr-4 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Ref / Date</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Entity</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Mode</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Reference</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                                            <p className="text-subtext font-black uppercase tracking-widest text-[10px]">Updating Registry...</p>
                                        </td>
                                    </tr>
                                ) : payments.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center">
                                            <CreditCard size={48} className="text-subtext opacity-20 mx-auto mb-4" />
                                            <p className="text-subtext font-bold uppercase tracking-widest text-sm">No payment history found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-white font-black text-sm">{p.receiptNumber}</span>
                                                    <span className="text-subtext text-[10px] uppercase font-bold tracking-wider">{new Date(p.date).toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.customer ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                        {p.customer ? <User size={14} /> : <Building2 size={14} />}
                                                    </div>
                                                    <span className="text-slate-700 dark:text-slate-300 font-bold text-sm tracking-tight">{p.customer?.name || p.vendor?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-[10px] font-black text-subtext uppercase tracking-widest bg-background px-2.5 py-1 rounded-full border border-border">
                                                    {p.mode}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-subtext font-mono text-xs">{p.reference || '-'}</td>
                                            <td className="px-8 py-5 text-right">
                                                <span className={`text-lg font-black tracking-tighter ${p.customer ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                                    {p.customer ? '+' : '-'}{p.amount.toLocaleString()} <span className="text-[10px] uppercase ml-1">PKR</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <div className="relative glass-panel w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className={`p-10 ${type === 'RECEIPT' ? 'bg-emerald-600' : 'bg-rose-600'} text-white`}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-3xl font-black tracking-tighter uppercase italic">{type === 'RECEIPT' ? 'Cash Receipt' : 'Vendor Payout'}</h3>
                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Transaction Authorization Panel</p>
                                    </div>
                                    <div className="w-16 h-16 rounded-3xl bg-white/20 flex items-center justify-center">
                                        {type === 'RECEIPT' ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Reference Number</label>
                                        <input
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={type === 'RECEIPT' ? 'REC-2025-001' : 'PAY-2025-001'}
                                            value={form.receiptNumber}
                                            onChange={e => setForm({ ...form, receiptNumber: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Transaction Date</label>
                                        <input
                                            type="date"
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                                            value={form.date}
                                            onChange={e => setForm({ ...form, date: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">
                                            {type === 'RECEIPT' ? 'From Customer' : 'To Vendor'}
                                        </label>
                                        <select
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={type === 'RECEIPT' ? form.customerId : form.vendorId}
                                            onChange={e => setForm({ ...form, [type === 'RECEIPT' ? 'customerId' : 'vendorId']: e.target.value })}
                                        >
                                            <option value="">Select {type === 'RECEIPT' ? 'Customer' : 'Vendor'}...</option>
                                            {(type === 'RECEIPT' ? entities.customers : entities.vendors).map(e => (
                                                <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Amount (PKR)</label>
                                            <input
                                                type="number"
                                                required
                                                className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black text-xl tracking-tighter focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                placeholder="0.00"
                                                value={form.amount}
                                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Payment Mode</label>
                                            <select
                                                className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={form.mode}
                                                onChange={e => setForm({ ...form, mode: e.target.value })}
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="BANK">Bank Transfer</option>
                                                <option value="CHEQUE">Cheque</option>
                                                <option value="ONLINE">Online Portal</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Deposit To / Pay From (Account)</label>
                                        <select
                                            required
                                            className="glass-input w-full rounded-2xl px-5 py-4 text-slate-900 dark:text-white font-black text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={form.bankAccountId}
                                            onChange={e => setForm({ ...form, bankAccountId: e.target.value })}
                                        >
                                            <option value="">Choose Bank/Cash account...</option>
                                            {entities.accounts.map(a => (
                                                <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-8 py-5 rounded-3xl border border-border text-subtext font-black uppercase tracking-widest text-xs hover:bg-primary/5 hover:text-slate-900 dark:hover:text-white transition-all"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        className={`flex-1 ${type === 'RECEIPT' ? 'bg-emerald-600 shadow-emerald-600/20' : 'bg-rose-600 shadow-rose-600/20'} text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl transition-all active:scale-95`}
                                    >
                                        Confirm & Post
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
