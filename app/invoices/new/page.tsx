'use client';

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    FileText, Search, Loader2, Save, X, Plus, Trash2, Printer,
    ChevronLeft, CreditCard, User, Briefcase, Hash, DollarSign, ArrowRightLeft
} from 'lucide-react';
import AccountSearch from '@/components/AccountSearch';

interface Job {
    id: number;
    jobNumber: string;
    customerId: number;
    customer: { name: string; code: string; taxNumber?: string; address?: string };
    containerNo: string | null;
    expenses: Array<{
        id: number;
        description: string;
        sellingPrice: number;
        currencyCode: string;
    }>;
}

interface Customer {
    id: number;
    name: string;
    code: string;
    taxNumber: string | null;
    address: string | null;
}

interface Vendor {
    id: number;
    name: string;
}

interface InvoiceItem {
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxPercentage: number;
    taxAmount: number;
    total: number;
    usdAmount?: number;
    productId?: string | null;
    vendorId?: string | null;
    expenseMasterId?: string | null;
    costAccountId?: string | null;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [category, setCategory] = useState<'SERVICE' | 'FREIGHT'>('SERVICE');
    const [serviceInvoiceType, setServiceInvoiceType] = useState<'SALES_TAX' | 'TRUCKING'>('SALES_TAX');
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [jobNumber, setJobNumber] = useState('');
    const [job, setJob] = useState<Job | null>(null);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [expensesMaster, setExpensesMaster] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
    const [accounts, setAccounts] = useState<any[]>([]);
    const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
    const [invoiceData, setInvoiceData] = useState({
        invoiceNumber: '',
        type: 'MASTER',
        currencyCode: 'PKR',
        usdRate: 0,
        exchangeRate: 1,
    });
    const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
    const [fetchingJobs, setFetchingJobs] = useState(false);
    const [systemSettings, setSystemSettings] = useState<any[]>([]);

    useEffect(() => {
        fetchSystemSettings();
    }, []);

    useEffect(() => {
        if (category === 'FREIGHT') {
            fetchCustomers();
            fetchVendors();
            fetchExpensesMaster();
            fetchAccounts();
        } else {
            fetchPendingJobs();
        }
    }, [category, serviceInvoiceType]);

    const generateItems = (currentJob: any) => {
        if (!currentJob) return;

        const getSetting = (key: string, defaultValue: string) =>
            systemSettings.find(s => s.key === key)?.value || defaultValue;

        const containerCount = currentJob.containerNo ? currentJob.containerNo.split(',').filter((x: string) => x.trim()).length : 0;
        const initialItems: InvoiceItem[] = [];

        // 1. Add Service Charges ONLY if Sales Tax Invoice
        if (serviceInvoiceType === 'SALES_TAX') {
            const serviceChargeRate = parseFloat(getSetting('serviceCharges', '2000'));
            const taxPercentage = parseFloat(getSetting('serviceTaxRate', '13'));
            const serviceChargeAmount = containerCount * serviceChargeRate;
            if (containerCount > 0) {
                initialItems.push({
                    description: `Service Charges | ${containerCount} Containers`,
                    quantity: containerCount,
                    rate: serviceChargeRate,
                    amount: serviceChargeAmount,
                    taxPercentage: taxPercentage,
                    taxAmount: (serviceChargeAmount * taxPercentage) / 100,
                    total: serviceChargeAmount + (serviceChargeAmount * taxPercentage) / 100,
                    productId: null
                });
            }
        }

        // 2. Add Expenses based on Category
        const targetCategory = serviceInvoiceType === 'SALES_TAX' ? 'SERVICE' : 'FREIGHT';

        const relevantExpenses = (currentJob.expenses || []).filter((e: any) =>
            (e.invoiceCategory || 'SERVICE') === targetCategory
        );

        relevantExpenses.forEach((exp: any) => {
            initialItems.push({
                description: exp.description,
                quantity: 1,
                rate: exp.sellingPrice,
                amount: exp.sellingPrice,
                taxPercentage: 0,
                taxAmount: 0,
                total: exp.sellingPrice,
                productId: null
            });
        });

        setInvoiceItems(initialItems);
    };

    // Regenerate items when invoice type changes
    useEffect(() => {
        if (job && category === 'SERVICE') {
            generateItems(job);
        }
    }, [serviceInvoiceType]);

    const fetchPendingJobs = async () => {
        setFetchingJobs(true);
        try {
            const res = await fetch(`/api/jobs?noInvoice=true&invoiceCategory=${serviceInvoiceType}`);
            if (res.ok) {
                const data = await res.json();
                setPendingJobs(data.jobs || []);
            }
        } catch (err) { console.error('Fetch pending jobs error'); }
        finally { setFetchingJobs(false); }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('/api/customers');
            if (res.ok) {
                const data = await res.json();
                setCustomers(data.customers || []);
            }
        } catch (err) { console.error('Fetch customers error'); }
    };

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const data = await res.json();
                // Filter for posting accounts (those without children)
                const postingAccounts = (data.accounts || []).filter((a: any) => !a._count || a._count.children === 0);
                setAccounts(postingAccounts);
            }
        } catch (error) {
            console.error('Failed to fetch accounts', error);
        }
    };

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors || []);
            }
        } catch (err) { console.error('Fetch vendors error'); }
    };
    const fetchExpensesMaster = async () => {
        try {
            const res = await fetch('/api/settings/expenses-master');
            if (res.ok) {
                const data = await res.json();
                setExpensesMaster(data.expensesMaster || []);
            }
        } catch (err) { console.error('Fetch expenses master error'); }
    };

    const fetchSystemSettings = async () => {
        try {
            const res = await fetch('/api/settings/system');
            if (res.ok) {
                const data = await res.json();
                setSystemSettings(data || []);
            }
        } catch (err) { console.error('Fetch settings error'); }
    };

    const handleSearchJob = async () => {
        if (!jobNumber) return;
        setSearching(true);
        setJob(null);
        try {
            const res = await fetch(`/api/jobs?jobNumber=${jobNumber}`);
            if (res.ok) {
                const data = await res.json();
                // The API returns { jobs: [...] }
                // We need to pick the first one and then fetch details?
                // Actually the API returns details (including expenses count, but logic in page needs full expenses?)
                // app/api/jobs GET returns _count expenses. It DOES NOT return actual expenses list.
                // We typically need to fetch /api/jobs/[id] to get expenses list.

                const foundJobSummary = data.jobs?.[0];

                if (foundJobSummary) {
                    const detailRes = await fetch(`/api/jobs/${foundJobSummary.id}`);
                    if (detailRes.ok) {
                        const detailData = await detailRes.json();
                        const foundJob = detailData.job;
                        setJob(foundJob);
                        generateItems(foundJob);

                        // Auto-populate invoice number based on job number serial
                        let invNum = '';
                        if (foundJob.jobNumber) {
                            const serial = foundJob.jobNumber.split('-').pop(); // e.g. 0001
                            invNum = serviceInvoiceType === 'SALES_TAX' ? `INV-${serial}` : `TRK-${serial}`;
                        }

                        setInvoiceData(prev => ({
                            ...prev,
                            invoiceNumber: invNum,
                            currencyCode: 'PKR'
                        }));
                    }
                } else {
                    alert('Job not found');
                }
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
            usdAmount: 0,
            productId: null,
            vendorId: null,
            expenseMasterId: null,
            costAccountId: null
        }]);
    };

    const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
        const newItems = [...invoiceItems];
        const item = { ...newItems[index], [field]: value };

        if (field === 'quantity' || field === 'rate' || field === 'taxPercentage' || field === 'usdAmount') {
            const qty = field === 'quantity' ? parseFloat(value) || 0 : item.quantity;
            let rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
            const taxPerc = field === 'taxPercentage' ? parseFloat(value) || 0 : item.taxPercentage;
            const usdAmt = field === 'usdAmount' ? parseFloat(value) || 0 : (item.usdAmount || 0);

            if (category === 'FREIGHT') {
                // For Freight, we prioritize USD -> PKR conversion
                if (field === 'usdAmount') {
                    rate = usdAmt * invoiceData.exchangeRate;
                    item.rate = rate;
                }
            }

            item.amount = qty * rate;
            // Force tax to 0 for Trucking Bills
            const finalTaxPerc = (category === 'SERVICE' && serviceInvoiceType === 'TRUCKING') ? 0 : taxPerc;
            item.taxPercentage = finalTaxPerc;
            item.taxAmount = (item.amount * finalTaxPerc) / 100;
            item.total = item.amount + item.taxAmount;
        }

        if (field === 'costAccountId') {
            item.costAccountId = value ? value.toString() : null;
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
        const finalCustomerId = category === 'SERVICE' ? job?.customerId : selectedCustomerId;
        if (!finalCustomerId) { alert('Please select a customer'); return; }

        setLoading(true);
        const endpoint = category === 'SERVICE' ? '/api/invoices' : '/api/invoices/freight';

        try {
            // Generate Invoice Number if strictly needed on client side, but better on server
            // For now we send the draft number or let server overwrite it
            const payload = {
                ...invoiceData,
                jobId: job?.id || null,
                customerId: parseInt(finalCustomerId.toString()),
                totalAmount: subtotal,
                taxAmount: totalTax,
                grandTotal: grandTotal,
                serviceCategory: serviceInvoiceType,
                items: invoiceItems
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/invoices/${data.invoice.id}?category=${category}`);
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

    const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);

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

                {/* Category Toggle */}
                <div className="flex glass-card p-1.5 rounded-3xl border border-border/50 w-fit mb-8">
                    <button
                        onClick={() => { setCategory('SERVICE'); setJob(null); setInvoiceItems([]); }}
                        className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${category === 'SERVICE' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-subtext hover:text-white'}`}
                    >
                        Service Invoice
                    </button>
                    <button
                        onClick={() => { setCategory('FREIGHT'); setJob(null); setInvoiceItems([]); }}
                        className={`px-8 py-3 rounded-2xl text-sm font-black transition-all ${category === 'FREIGHT' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-subtext hover:text-white'}`}
                    >
                        Freight Invoice
                    </button>
                </div>

                <div className="flex flex-col gap-8">
                    {/* Step 1: Link/Select Customer */}
                    <div className="glass-panel p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                {category === 'SERVICE' ? <Briefcase size={24} /> : <User size={24} />}
                            </div>
                            <div>
                                <h1 className="text-2xl text-heading">
                                    {category === 'SERVICE' ? 'Create Service Invoice' : 'Create Freight Invoice'}
                                </h1>
                                <p className="text-subtext">
                                    {category === 'SERVICE' ? 'Step 1: Link to a Job' : 'Step 1: Select Customer & Rates'}
                                </p>
                            </div>
                        </div>

                        {category === 'SERVICE' ? (
                            <div className="space-y-6">
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
                                        type="button"
                                        disabled={searching || !jobNumber}
                                        className="glass-button min-w-[160px]"
                                    >
                                        {searching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
                                        {searching ? 'Searching...' : 'Fetch Job'}
                                    </button>
                                </div>

                                {/* Pending Jobs List */}
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-subtext">Recent Pending Jobs (No Invoice)</label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {fetchingJobs ? (
                                            <div className="col-span-full py-4 text-center">
                                                <Loader2 className="animate-spin text-primary inline-block mr-2" size={16} />
                                                <span className="text-xs font-bold text-subtext uppercase tracking-widest">Scanning Jobs...</span>
                                            </div>
                                        ) : pendingJobs.length === 0 ? (
                                            <div className="col-span-full py-4 text-center border-2 border-dashed border-border rounded-2xl">
                                                <p className="text-xs font-bold text-subtext uppercase tracking-widest">No uninvoiced jobs found</p>
                                            </div>
                                        ) : (
                                            pendingJobs.map(pj => (
                                                <button
                                                    key={pj.id}
                                                    type="button"
                                                    onClick={() => { setJobNumber(pj.jobNumber); setTimeout(() => handleSearchJob(), 100); }}
                                                    className="flex flex-col items-start p-3 glass-card hover:bg-primary/10 border-border hover:border-primary/50 transition-all text-left group"
                                                >
                                                    <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors">{pj.jobNumber}</span>
                                                    <span className="text-[10px] font-bold text-subtext uppercase truncate w-full">{pj.customer.name}</span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Classification Toggle */}
                                <div className="space-y-3 pt-4 border-t border-border/50">
                                    <label className="text-subtext ml-1">Invoice Classification</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setServiceInvoiceType('SALES_TAX')}
                                            className={`flex-1 py-3 px-4 rounded-xl border transition-all font-bold text-sm ${serviceInvoiceType === 'SALES_TAX' ? 'bg-blue-600/10 border-blue-600 text-blue-500' : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            Sales Tax Invoice
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setServiceInvoiceType('TRUCKING')}
                                            className={`flex-1 py-3 px-4 rounded-xl border transition-all font-bold text-sm ${serviceInvoiceType === 'TRUCKING' ? 'bg-emerald-600/10 border-emerald-600 text-emerald-500' : 'bg-transparent border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            Trucking Bill
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Customer *</label>
                                    <select
                                        className="glass-input w-full appearance-none"
                                        value={selectedCustomerId}
                                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                                    >
                                        <option value="">Select Customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Freight Rate (USD)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="number"
                                            className="glass-input w-full pl-10"
                                            placeholder="0.00"
                                            value={invoiceData.usdRate}
                                            onChange={(e) => setInvoiceData({ ...invoiceData, usdRate: parseFloat(e.target.value) || 0 })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-subtext ml-1">Exchange Rate (PKR)</label>
                                    <div className="relative">
                                        <ArrowRightLeft className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                        <input
                                            type="number"
                                            className="glass-input w-full pl-10"
                                            placeholder="e.g. 280"
                                            value={invoiceData.exchangeRate}
                                            onChange={(e) => {
                                                const rate = parseFloat(e.target.value) || 1;
                                                setInvoiceData({ ...invoiceData, exchangeRate: rate });
                                                // Recalculate all items PKR if they have USD
                                                if (category === 'FREIGHT') {
                                                    setInvoiceItems(prev => prev.map(item => {
                                                        const usdAmt = item.usdAmount || 0;
                                                        if (usdAmt > 0) {
                                                            const newRate = usdAmt * rate;
                                                            const amount = item.quantity * newRate;
                                                            const taxAmount = (amount * item.taxPercentage) / 100;
                                                            return { ...item, rate: newRate, amount, total: amount + taxAmount };
                                                        }
                                                        return item;
                                                    }));
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 2: Invoice Details */}
                    {(job || category === 'FREIGHT') && (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Info Card */}
                            <div className="bg-primary/5 border border-primary/20 p-6 rounded-[2rem] flex flex-wrap gap-12 items-center">
                                <div className="flex items-center gap-3">
                                    <User className="text-primary" size={18} />
                                    <div>
                                        <p className="text-subtext">Customer</p>
                                        <p className="text-sm font-black text-foreground">
                                            {category === 'SERVICE' ? job?.customer.name : (selectedCustomer?.name || '---')}
                                        </p>
                                        {(category === 'FREIGHT' && selectedCustomer) && (
                                            <div className="flex flex-col gap-0.5 mt-1">
                                                <p className="text-[10px] text-slate-500 font-bold">{selectedCustomer.address}</p>
                                                <p className="text-[10px] text-blue-500 font-black">NTN: {selectedCustomer.taxNumber || 'N/A'}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {category === 'SERVICE' && (
                                    <div className="flex items-center gap-3">
                                        <Briefcase className="text-primary" size={18} />
                                        <div>
                                            <p className="text-subtext">Linked Job</p>
                                            <p className="text-sm font-black text-foreground">{job?.jobNumber}</p>
                                        </div>
                                    </div>
                                )}
                                {category === 'FREIGHT' && (
                                    <div className="flex items-center gap-3">
                                        <DollarSign className="text-primary" size={18} />
                                        <div>
                                            <p className="text-subtext">PKR Output</p>
                                            <p className="text-sm font-black text-foreground">
                                                Rs. {(invoiceData.usdRate * invoiceData.exchangeRate).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="ml-auto flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-subtext">Invoice Date</p>
                                        <p className="text-sm font-black text-foreground">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="glass-panel p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                    <div className="space-y-1">
                                        <label className="text-subtext ml-1">Invoice Number</label>
                                        <input
                                            className="glass-input w-full uppercase tracking-wider"
                                            placeholder="Auto-generated if blank"
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
                                            className="text-subtext text-primary hover:text-primary/80 flex items-center gap-1 transition-colors font-bold"
                                        >
                                            <Plus size={14} /> Add Line Item
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-border/50">
                                                    <th className="py-3 px-4 text-subtext">Description</th>
                                                    {category === 'FREIGHT' && <th className="py-3 px-4 text-subtext w-32">USD Amount</th>}
                                                    {category === 'FREIGHT' && <th className="py-3 px-4 text-subtext w-56">Account Mapping</th>}
                                                    {category === 'SERVICE' && <th className="py-3 px-4 text-subtext w-24">Qty</th>}
                                                    {category === 'SERVICE' && <th className="py-3 px-4 text-subtext w-32">Rate (PKR)</th>}
                                                    {category === 'SERVICE' && serviceInvoiceType !== 'TRUCKING' && <th className="py-3 px-4 text-subtext w-24 text-center">Tax %</th>}
                                                    <th className="py-3 px-4 text-subtext w-32 border-l border-border/50 text-right">
                                                        {category === 'FREIGHT' ? 'Amount (PKR)' : 'Total'}
                                                    </th>
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
                                                        {category === 'FREIGHT' && (
                                                            <td className="py-2 px-1">
                                                                <div className="relative">
                                                                    <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent pl-7 pr-3 py-2 text-sm font-black text-blue-500 focus:outline-none focus:bg-primary/5 rounded-lg transition-all"
                                                                        value={item.usdAmount || 0}
                                                                        onChange={(e) => updateItem(idx, 'usdAmount', e.target.value)}
                                                                    />
                                                                </div>
                                                            </td>
                                                        )}
                                                        {category === 'FREIGHT' && (
                                                            <td className="py-2 px-1">
                                                                <AccountSearch
                                                                    accounts={accounts}
                                                                    value={item.costAccountId || ''}
                                                                    onChange={(val: number) => updateItem(idx, 'costAccountId', val)}
                                                                />
                                                            </td>
                                                        )}
                                                        {category === 'SERVICE' && (
                                                            <>
                                                                <td className="py-2 px-1">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent px-3 py-2 text-sm font-black text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-center"
                                                                        value={item.quantity}
                                                                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                                                                    />
                                                                </td>
                                                                <td className="py-2 px-1">
                                                                    <input
                                                                        type="number"
                                                                        className="w-full bg-transparent px-3 py-2 text-sm font-black text-foreground focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-right"
                                                                        value={item.rate}
                                                                        onChange={(e) => updateItem(idx, 'rate', e.target.value)}
                                                                    />
                                                                </td>
                                                            </>
                                                        )}
                                                        {category === 'SERVICE' && serviceInvoiceType !== 'TRUCKING' && (
                                                            <td className="py-2 px-1 text-center">
                                                                <input
                                                                    type="number"
                                                                    className="w-20 bg-transparent px-3 py-2 text-sm font-black text-primary focus:outline-none focus:bg-primary/5 rounded-lg transition-all text-center"
                                                                    value={item.taxPercentage}
                                                                    onChange={(e) => updateItem(idx, 'taxPercentage', e.target.value)}
                                                                />
                                                            </td>
                                                        )}
                                                        <td className="py-2 px-4 text-right border-l border-border/50 bg-primary/5">
                                                            <span className="text-sm font-black text-foreground">{item.total.toLocaleString()}</span>
                                                        </td>
                                                        <td className="py-2 px-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeItem(idx)}
                                                                className="p-2 text-slate-600 hover:text-red-500 transition-colors"
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
                                            <span className="text-sm font-black text-foreground">{subtotal.toLocaleString()} {invoiceData.currencyCode}</span>
                                        </div>
                                        {!(category === 'SERVICE' && serviceInvoiceType === 'TRUCKING') && (
                                            <div className="flex items-center gap-4">
                                                <span className="text-subtext w-24">Tax Total :</span>
                                                <span className="text-sm font-black text-foreground">{totalTax.toLocaleString()} {invoiceData.currencyCode}</span>
                                            </div>
                                        )}
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
                                                {loading ? 'Finalizing...' : 'Finalize Invoice'}
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
