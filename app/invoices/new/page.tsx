'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    FileText, Search, Loader2, Save, X, Plus, Trash2, Printer,
    ChevronLeft, CreditCard, User, Briefcase, Hash
} from 'lucide-react';

interface Job {
    id: number;
    jobNumber: string;
    customerId: number;
    customer: { name: string; code: string };
    containerNo: string | null;
    expenses: Array<{
        id: number;
        description: string;
        sellingPrice: number;
        currencyCode: string;
    }>;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxPercentage: number;
    taxAmount: number;
    total: number;
    productId: string | null;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [jobNumber, setJobNumber] = useState('');
    const [job, setJob] = useState<Job | null>(null);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        type: 'MASTER',
        currencyCode: 'PKR',
        taxAmount: 0,
    });

    const handleSearchJob = async () => {
        if (!jobNumber) return;
        setSearching(true);
        setJob(null);
        try {
            const res = await fetch(`/api/jobs/by-number/${jobNumber}`);
            if (res.ok) {
                const data = await res.json();
                const foundJob = data.job;
                setJob(foundJob);

                // Pre-populate invoice items from job expenses (selling prices)
                const initialItems = (foundJob.expenses || []).map((exp: any) => ({
                    description: exp.description,
                    quantity: 1,
                    rate: exp.sellingPrice,
                    amount: exp.sellingPrice,
                    taxPercentage: 0,
                    taxAmount: 0,
                    total: exp.sellingPrice,
                    productId: null
                }));
                setInvoiceItems(initialItems);

                if (initialItems.length === 0) {
                    addInvoiceItem();
                }

                // Generate a draft invoice number if possible or leave blank
                setInvoiceData(prev => ({
                    ...prev,
                    invoiceNumber: `INV-${foundJob.jobNumber}`,
                    currencyCode: foundJob.expenses?.[0]?.currencyCode || 'PKR'
                }));
            } else {
                const error = await res.json();
                alert(error.error || 'Job not found');
            }
        } catch (err) {
            alert('Error searching for job');
        } finally {
            setSearching(false);
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
            productId: null
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
        if (!job) return;
        setLoading(true);

        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...invoiceData,
                    jobId: job.id,
                    customerId: job.customerId,
                    totalAmount: subtotal,
                    taxAmount: totalTax,
                    grandTotal: grandTotal,
                    items: invoiceItems
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/invoices/${data.invoice.id}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create invoice');
            }
        } catch (err) {
            alert('An error occurred while creating the invoice');
        } finally {
            setLoading(false);
        }
    };

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
                    {/* Step 1: Search Job */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                <Search size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl text-heading">Create New Invoice</h1>
                                <p className="text-subtext">Step 1: Link to a Job</p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative group">
                                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Enter Job Number (e.g., JOB-1001)..."
                                    className="glass-input w-full pl-12 uppercase tracking-widest"
                                    value={jobNumber}
                                    onChange={(e) => setJobNumber(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearchJob()}
                                />
                            </div>
                            <button
                                onClick={handleSearchJob}
                                disabled={searching || !jobNumber}
                                className="glass-button min-w-[160px]"
                            >
                                {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                {searching ? 'Searching...' : 'Fetch Job'}
                            </button>
                        </div>
                    </div>

                    {/* Step 2: Invoice Details */}
                    {job && (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Job Info Summary Card */}
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex flex-wrap gap-12 items-center">
                                <div className="flex items-center gap-3">
                                    <User className="text-primary" size={18} />
                                    <div>
                                        <p className="text-subtext">Customer</p>
                                        <p className="text-sm font-black text-foreground">{job.customer.name} ({job.customer.code})</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Briefcase className="text-primary" size={18} />
                                    <div>
                                        <p className="text-subtext">Linked Job</p>
                                        <p className="text-sm font-black text-foreground">{job.jobNumber}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Hash className="text-primary" size={18} />
                                    <div>
                                        <p className="text-subtext">Containers</p>
                                        <p className="text-sm font-black text-foreground">
                                            {job.containerNo ? job.containerNo.split(',').filter(x => x.trim()).length : 0} Total
                                        </p>
                                    </div>
                                </div>
                                <div className="ml-auto flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-subtext">Invoice Date</p>
                                        <p className="text-sm font-black text-foreground">{new Date().toLocaleDateString()}</p>
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
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4 mb-10">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-sm text-heading flex items-center gap-2">
                                            <CreditCard size={16} className="text-primary" />
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
                                                    <th className="py-3 px-4 text-subtext w-24">Qty</th>
                                                    <th className="py-3 px-4 text-subtext w-32">Rate</th>
                                                    <th className="py-3 px-4 text-subtext w-24 text-center">Tax %</th>
                                                    <th className="py-3 px-4 text-subtext w-32 border-l border-border/50 text-right">Total</th>
                                                    <th className="py-3 px-4 w-12 text-center"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800/50">
                                                {invoiceItems.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-primary/5 transition-colors border-b border-border/10 last:border-0">
                                                        <td className="py-2 px-1">
                                                            <input
                                                                className="w-full bg-transparent px-3 py-2 text-sm font-bold text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all"
                                                                value={item.description}
                                                                onChange={(e) => updateItem(idx, 'description', e.target.value)}
                                                                placeholder="Item description..."
                                                            />
                                                        </td>
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
                                                                className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                                            <p className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
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
                                                disabled={loading}
                                                className="glass-button flex-1"
                                            >
                                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                                {loading ? 'Creating...' : 'Finalize Invoice'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
