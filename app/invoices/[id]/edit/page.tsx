'use client';

import React, { useState, useEffect, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    FileText, Search, Loader2, Save, X, Plus, Trash2, Printer,
    ChevronLeft, CreditCard, User, Briefcase, Hash, DollarSign, ArrowRightLeft
} from 'lucide-react';

interface Job {
    id: number;
    jobNumber: string;
    customerId: number;
    customer: { name: string; code: string };
    containerNo: string | null;
}

interface InvoiceItem {
    id?: number;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxPercentage: number;
    taxAmount: number;
    total: number;
    productId: string | null;
    vendorId?: string | null;
}

interface Vendor {
    id: number;
    name: string;
}

export default function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const searchParams = useSearchParams();
    const category = searchParams.get('category') as 'SERVICE' | 'FREIGHT' || 'SERVICE';
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [job, setJob] = useState<Job | null>(null);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        type: 'MASTER',
        currencyCode: 'PKR',
        taxAmount: 0,
        status: 'DRAFT',
        usdRate: '0',
        exchangeRate: '1.0',
        customerId: ''
    });

    useEffect(() => {
        fetchInvoice();
        if (category === 'FREIGHT') {
            fetchVendors();
        }
    }, [id, category]);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (err) {
            console.error('Fetch vendors failed');
        }
    };

    const fetchInvoice = async () => {
        try {
            const res = await fetch(`/api/invoices/${id}?category=${category}`);
            if (res.ok) {
                const data = await res.json();
                const inv = data.invoice;
                if (inv) {
                    if (inv.status === 'SENT') {
                        alert('Cannot edit an approved invoice. Revert to draft first.');
                        router.push('/invoices');
                        return;
                    }
                    setInvoiceData({
                        invoiceNumber: inv.invoiceNumber,
                        type: inv.type || 'MASTER',
                        currencyCode: inv.currencyCode,
                        taxAmount: inv.taxAmount,
                        status: inv.status,
                        usdRate: inv.usdRate?.toString() || '0',
                        exchangeRate: inv.exchangeRate?.toString() || '1.0',
                        customerId: inv.customerId?.toString() || ''
                    });
                    setJob(inv.job);
                    setInvoiceItems(inv.items.map((item: any) => ({
                        ...item,
                        productId: item.productId?.toString() || null,
                        vendorId: item.vendorId?.toString() || null
                    })));
                } else {
                    alert('Invoice not found');
                    router.push('/invoices');
                }
            }
        } catch (err) {
            console.error('Fetch invoice failed', err);
        } finally {
            setLoading(false);
        }
    };

    const addInvoiceItem = () => {
        setInvoiceItems([...invoiceItems, {
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0,
            taxPercentage: 0,
            taxAmount: 0,
            total: 0,
            productId: null,
            vendorId: null
        }]);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...invoiceItems];
        const item = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'rate' || field === 'taxPercentage') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
            const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
            const taxPerc = field === 'taxPercentage' ? parseFloat(value) || 0 : item.taxPercentage;

            item.amount = qty * rate;
            item.taxAmount = (item.amount * taxPerc) / 100;
            item.total = item.amount + item.taxAmount;
        }

        newItems[index] = item;
        setInvoiceItems(newItems);
    };

    const removeItem = (index: number) => {
        setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
    };

    const subtotal = invoiceItems.reduce((sum, item) => sum + item.amount, 0);
    const totalTax = invoiceItems.reduce((sum, item) => sum + item.taxAmount, 0);
    const grandTotal = subtotal + totalTax;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        const endpoint = category === 'SERVICE' ? '/api/invoices' : '/api/invoices/freight';

        try {
            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    action: 'UPDATE',
                    ...invoiceData,
                    totalAmount: subtotal,
                    taxAmount: totalTax,
                    grandTotal: grandTotal,
                    items: invoiceItems
                }),
            });

            if (response.ok) {
                router.push(`/invoices/${id}?category=${category}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to update invoice');
            }
        } catch (err) {
            alert('An error occurred while updating the invoice');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto pb-20">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ChevronLeft size={16} />
                    Back
                </button>

                <div className="flex flex-col gap-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Job Info Summary Card */}
                        <div className={`border p-6 rounded-[2rem] flex flex-wrap gap-12 items-center ${category === 'SERVICE' ? 'bg-blue-600/5 border-blue-600/20' : 'bg-purple-600/5 border-purple-600/20'}`}>
                            <div className="flex items-center gap-3">
                                <User className={category === 'SERVICE' ? 'text-blue-600' : 'text-purple-600'} size={18} />
                                <div>
                                    <p className="text-subtext">Customer</p>
                                    <p className="text-sm font-black text-foreground">{job?.customer?.name || '---'}</p>
                                </div>
                            </div>
                            {category === 'SERVICE' && (
                                <div className="flex items-center gap-3">
                                    <Briefcase className="text-blue-600" size={18} />
                                    <div>
                                        <p className="text-subtext">Linked Job</p>
                                        <p className="text-sm font-black text-foreground">{job?.jobNumber || '---'}</p>
                                    </div>
                                </div>
                            )}
                            {category === 'SERVICE' && (
                                <div className="flex items-center gap-3">
                                    <Hash className="text-blue-600" size={18} />
                                    <div>
                                        <p className="text-subtext">Containers</p>
                                        <p className="text-sm font-black text-foreground">
                                            {job?.containerNo ? job.containerNo.split(',').filter(x => x.trim()).length : 0} Total
                                        </p>
                                    </div>
                                </div>
                            )}
                            <div className="ml-auto flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-subtext">Status</p>
                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20">
                                        {invoiceData.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Main Form Area */}
                        <div className="glass-panel p-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Invoice Number *</label>
                                    <input
                                        required
                                        className="glass-input w-full uppercase tracking-wider"
                                        value={invoiceData.invoiceNumber}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Type</label>
                                    <select
                                        className="glass-input w-full appearance-none"
                                        value={invoiceData.type}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, type: e.target.value })}
                                    >
                                        <option value="MASTER">MASTER INVOICE</option>
                                        <option value="PROFORMA">PROFORMA</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Currency</label>
                                    <select
                                        className="glass-input w-full appearance-none"
                                        value={invoiceData.currencyCode}
                                        onChange={(e) => setInvoiceData({ ...invoiceData, currencyCode: e.target.value })}
                                    >
                                        <option value="PKR">PKR - Pakistani Rupee</option>
                                        <option value="USD">USD - US Dollar</option>
                                        <option value="EUR">EUR - Euro</option>
                                    </select>
                                </div>

                                {category === 'FREIGHT' && (
                                    <>
                                        <div className="space-y-1">
                                            <label className="text-subtext ml-1">Freight Rate (USD)</label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="glass-input w-full pl-10"
                                                    value={invoiceData.usdRate}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, usdRate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-subtext ml-1">Exchange Rate (PKR)</label>
                                            <div className="relative">
                                                <ArrowRightLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    className="glass-input w-full pl-10"
                                                    value={invoiceData.exchangeRate}
                                                    onChange={(e) => setInvoiceData({ ...invoiceData, exchangeRate: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Items Table */}
                            <div className="space-y-4 mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm text-heading flex items-center gap-2">
                                        <CreditCard size={16} className={category === 'SERVICE' ? 'text-blue-600' : 'text-purple-600'} />
                                        Invoice Items
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={addInvoiceItem}
                                        className="text-subtext text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                                    >
                                        <Plus size={14} /> Add Item
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="py-3 px-4 text-subtext">Description</th>
                                                {category === 'FREIGHT' && <th className="py-3 px-4 text-subtext w-48">Vendor / Expense</th>}
                                                <th className="py-3 px-4 text-subtext w-24">Qty</th>
                                                <th className="py-3 px-4 text-subtext w-32">Rate</th>
                                                <th className="py-3 px-4 text-subtext w-24">Tax %</th>
                                                <th className="py-3 px-4 text-subtext w-32 border-l border-border/50 text-right">Total</th>
                                                <th className="py-3 px-4 w-12 text-center"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/10">
                                            {invoiceItems.map((item, idx) => (
                                                <tr key={idx} className="group hover:bg-primary/5 transition-colors">
                                                    <td className="py-2 px-1">
                                                        <input
                                                            className="w-full bg-transparent px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all"
                                                            value={item.description}
                                                            onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                            placeholder="Item description..."
                                                        />
                                                    </td>
                                                    {category === 'FREIGHT' && (
                                                        <td className="py-2 px-1">
                                                            <select
                                                                className="w-full bg-transparent px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all"
                                                                value={item.vendorId || ''}
                                                                onChange={(e) => updateItem(idx, 'vendorId', e.target.value)}
                                                            >
                                                                <option value="">No Vendor (Direct)</option>
                                                                {vendors.map(v => (
                                                                    <option key={v.id} value={v.id}>{v.name}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    )}
                                                    <td className="py-2 px-1">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-center"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-1">
                                                        <input
                                                            type="number"
                                                            className="w-full bg-transparent px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-right"
                                                            value={item.rate}
                                                            onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-1 text-center">
                                                        <input
                                                            type="number"
                                                            className="w-20 bg-transparent px-3 py-2 text-sm font-bold text-muted-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-center"
                                                            value={item.taxPercentage}
                                                            onChange={(e) => updateItem(idx, 'taxPercentage', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="py-2 px-4 text-right border-l border-border/50 bg-primary/5">
                                                        <span className="text-sm font-black text-foreground">{item.total.toLocaleString()}</span>
                                                    </td>
                                                    <td className="py-2 px-2 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(idx)}
                                                            className="p-2 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Summary & Actions */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12 pt-8 border-t border-border">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <span className="text-subtext w-24">Subtotal :</span>
                                        <span className="text-sm font-bold text-foreground">{subtotal.toLocaleString()} {invoiceData.currencyCode}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-subtext w-24">Tax Total :</span>
                                        <span className="text-sm font-bold text-foreground">{totalTax.toLocaleString()} {invoiceData.currencyCode}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-6 w-full md:w-auto">
                                    <div className="text-right">
                                        <p className="text-subtext mb-1">Grand Total</p>
                                        <p className={`text-5xl font-black tracking-tighter leading-none ${category === 'SERVICE' ? 'text-blue-600' : 'text-purple-600'}`}>
                                            <span className="text-xs text-primary mr-2 uppercase tracking-widest font-black">{invoiceData.currencyCode}</span>
                                            {grandTotal.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-4 w-full">
                                        <button
                                            type="button"
                                            onClick={() => router.back()}
                                            className="glass-button-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="glass-button flex-1"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            {saving ? 'Updating...' : 'Update Invoice'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </DashboardLayout>
    );
}
