'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    ShoppingBag, Plus, Search, Trash2,
    ArrowRight, Loader2, Calendar,
    Hash, User, DollarSign, Package,
    CheckCircle2, AlertCircle
} from 'lucide-react';

interface Purchase {
    id: number;
    purchaseNumber: string;
    date: string;
    grandTotal: number;
    vendor: { name: string; code: string };
    items: { product: { name: string }; quantity: number; total: number }[];
}

interface Product {
    id: number;
    name: string;
    purchasePrice: number;
}

interface Vendor {
    id: number;
    name: string;
}

export default function PurchasesPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [form, setForm] = useState({
        purchaseNumber: `PUR-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0],
        vendorId: '',
        items: [{ productId: '', quantity: 1, rate: 0, taxPercentage: 0 }]
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [purRes, prodRes, vendRes] = await Promise.all([
                fetch('/api/purchases'),
                fetch('/api/inventory/products'),
                fetch('/api/vendors')
            ]);
            if (purRes.ok) setPurchases((await purRes.json()).purchases);
            if (prodRes.ok) setProducts((await prodRes.json()).products);
            if (vendRes.ok) setVendors((await vendRes.json()).vendors);
        } catch (err) {
            console.error('Fetch failed');
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => setForm({ ...form, items: [...form.items, { productId: '', quantity: 1, rate: 0, taxPercentage: 0 }] });
    const removeItem = (index: number) => {
        if (form.items.length === 1) return;
        const next = [...form.items];
        next.splice(index, 1);
        setForm({ ...form, items: next });
    };
    const updateItem = (index: number, field: string, value: any) => {
        const next = [...form.items];
        let rate = next[index].rate;
        if (field === 'productId') {
            const p = products.find(prod => prod.id === parseInt(value));
            if (p) rate = p.purchasePrice;
        }
        next[index] = { ...next[index], [field]: value, ...(field === 'productId' && { rate }) };
        setForm({ ...form, items: next });
    };

    const totalAmount = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate)), 0);
    const totalTax = form.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.rate) * Number(item.taxPercentage) / 100), 0);
    const grandTotal = totalAmount + totalTax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/purchases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    vendorId: parseInt(form.vendorId),
                    items: form.items.map(i => ({ ...i, productId: parseInt(i.productId), quantity: parseFloat(i.quantity as any), rate: parseFloat(i.rate as any) }))
                }),
            });
            if (res.ok) {
                setShowModal(false);
                fetchData();
                setForm({
                    purchaseNumber: `PUR-${Date.now().toString().slice(-6)}`,
                    date: new Date().toISOString().split('T')[0],
                    vendorId: '',
                    items: [{ productId: '', quantity: 1, rate: 0, taxPercentage: 0 }]
                });
            }
        } catch (err) {
            console.error('Submit failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Purchase Management</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Vendor Acquisitions & Procurement</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-[2.5rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20"
                    >
                        <Plus size={20} />
                        New Purchase Invoice
                    </button>
                </div>

                {/* Purchase History */}
                <div className="grid gap-6">
                    {loading ? (
                        <div className="p-20 text-center bg-slate-900/40 border border-slate-800/60 rounded-[3rem]">
                            <Loader2 className="animate-spin text-emerald-500 mx-auto mb-4" size={32} />
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Loading Procurement Logs...</p>
                        </div>
                    ) : purchases.length === 0 ? (
                        <div className="p-20 text-center bg-slate-900/40 border border-slate-800/60 rounded-[3rem]">
                            <ShoppingBag className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">No Purchases Found</h3>
                            <p className="text-slate-500 text-sm mt-1">Start by recording your first vendor acquisition.</p>
                        </div>
                    ) : (
                        purchases.map(pur => (
                            <div key={pur.id} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 flex flex-col md:flex-row justify-between items-center group hover:border-emerald-500/30 transition-all">
                                <div className="flex items-center gap-8">
                                    <div className="bg-emerald-500/10 p-5 rounded-[1.5rem] border border-emerald-500/20">
                                        <ShoppingBag className="text-emerald-400" size={28} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">Verified</span>
                                            <h3 className="text-xl font-black text-white tracking-tight">{pur.purchaseNumber}</h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-slate-500 text-xs font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><User size={12} /> {pur.vendor.name}</span>
                                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                                            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(pur.date).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 md:mt-0 text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Purchase Value</p>
                                    <h4 className="text-2xl font-black text-white tracking-tighter">{pur.grandTotal.toLocaleString()} <span className="text-xs uppercase ml-1 italic opacity-50 text-emerald-400">PKR</span></h4>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Purchase Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-white/5 bg-emerald-600 text-white flex justify-between items-center">
                                <div>
                                    <h3 className="text-3xl font-black italic tracking-tighter uppercase">Purchase Execution</h3>
                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Stock Acquisition Protocol</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black tracking-tighter text-white">
                                        {grandTotal.toLocaleString()} <span className="text-xs italic uppercase">PKR Total</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded font-black uppercase">Auto-Posting Active</span>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col h-[70vh]">
                                <div className="p-8 grid grid-cols-3 gap-6 border-b border-white/5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Purchase No</label>
                                        <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono"
                                            value={form.purchaseNumber} onChange={e => setForm({ ...form, purchaseNumber: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vendor</label>
                                        <select required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold"
                                            value={form.vendorId} onChange={e => setForm({ ...form, vendorId: e.target.value })}>
                                            <option value="">Select Vendor...</option>
                                            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Date</label>
                                        <input type="date" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold"
                                            value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 space-y-4">
                                    {form.items.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-4 items-center animate-in slide-in-from-left-2 duration-200">
                                            <div className="col-span-4">
                                                <select required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white"
                                                    value={item.productId} onChange={e => updateItem(index, 'productId', e.target.value)}>
                                                    <option value="">Select Product...</option>
                                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" step="any" placeholder="Qty" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white"
                                                    value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} />
                                            </div>
                                            <div className="col-span-2">
                                                <input type="number" placeholder="Rate" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs font-black text-white"
                                                    value={item.rate} onChange={e => updateItem(index, 'rate', e.target.value)} />
                                            </div>
                                            <div className="col-span-1">
                                                <input type="number" placeholder="Tax %" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-[10px] font-bold text-slate-400"
                                                    value={item.taxPercentage} onChange={e => updateItem(index, 'taxPercentage', e.target.value)} />
                                            </div>
                                            <div className="col-span-2 text-right">
                                                <span className="text-sm font-black text-white">{(Number(item.quantity) * Number(item.rate) * (1 + Number(item.taxPercentage) / 100)).toLocaleString()}</span>
                                            </div>
                                            <div className="col-span-1 flex justify-end">
                                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors">
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    <button type="button" onClick={addItem} className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px] px-4 py-2 rounded-xl hover:bg-emerald-500/10 transition-all border border-emerald-500/20">
                                        <Plus size={14} /> Add Line Item
                                    </button>
                                </div>

                                <div className="p-8 border-t border-white/5 flex gap-4">
                                    <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 rounded-3xl border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs">Abort Acquisition</button>
                                    <button type="submit" className="flex-1 bg-emerald-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl transition-all">Authorize & Post Purchase</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
