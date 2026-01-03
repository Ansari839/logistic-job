'use client';

import React, { useEffect, useState, use } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    ChevronLeft, Save, Loader2,
    Copy, Edit3, Trash2, RotateCcw, LogOut,
    Plus, Book
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    code: string;
}

interface ExpenseMaster {
    id: number;
    code: string;
    name: string;
}

interface Port {
    id: number;
    name: string;
}

export default function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [expenseMasters, setExpenseMasters] = useState<ExpenseMaster[]>([]);
    const [ports, setPorts] = useState<Port[]>([]);

    const [expenses, setExpenses] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        jobNumber: '',
        jobType: 'EXPORT',
        customerId: '',
        vessel: '',
        place: '',
        shipperRef: '',
        gdNo: '',
        gdDate: '',
        formE: '',
        formEDate: '',
        commodity: '',
        volume: '',
        containerNo: '',
        packages: '',
        weight: '',
        hawbBl: '',
        handledBy: '',
        salesPerson: '',
        podId: '',
        jobDate: '',
    });

    const [containers, setContainers] = useState<string[]>(['']);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch Metadata
                const [custRes, expMasterRes, portRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/settings/expenses-master'),
                    fetch('/api/settings/ports')
                ]);

                if (custRes.ok) {
                    const custData = await custRes.json();
                    setCustomers(custData.customers);
                }
                if (expMasterRes.ok) {
                    const expMData = await expMasterRes.json();
                    setExpenseMasters(expMData.expensesMaster || []);
                }
                if (portRes.ok) {
                    const portData = await portRes.json();
                    setPorts(portData.ports || []);
                }

                // 2. Fetch Job Details
                const jobRes = await fetch(`/api/jobs/${id}`);
                if (jobRes.ok) {
                    const data = await jobRes.json();
                    const job = data.job;

                    setFormData({
                        jobNumber: job.jobNumber,
                        jobType: job.jobType,
                        customerId: job.customerId.toString(),
                        vessel: job.vessel || '',
                        place: job.place || '',
                        shipperRef: job.shipperRef || '',
                        gdNo: job.gdNo || '',
                        gdDate: job.gdDate ? new Date(job.gdDate).toISOString().split('T')[0] : '',
                        formE: job.formE || '',
                        formEDate: job.formEDate ? new Date(job.formEDate).toISOString().split('T')[0] : '',
                        commodity: job.commodity || '',
                        volume: job.volume || '',
                        containerNo: job.containerNo || '',
                        packages: job.packages ? job.packages.toString() : '',
                        weight: job.weight ? job.weight.toString() : '',
                        hawbBl: job.hawbBl || '',
                        handledBy: job.handledBy || '',
                        salesPerson: job.salesPerson || '',
                        podId: job.podId ? job.podId.toString() : '',
                        jobDate: job.jobDate ? new Date(job.jobDate).toISOString().split('T')[0] : '',
                    });

                    // Set containers
                    if (job.containerNo) {
                        setContainers(job.containerNo.split(', ').map((c: string) => c.trim()));
                    } else {
                        setContainers(['']);
                    }

                    // Map existing expenses
                    const existingExpenses = (job.expenses || []).map((e: any) => ({
                        code: e.code || '',
                        name: e.description?.split(' - ')[0] || '',
                        description: e.description?.split(' - ')[1] || '',
                        cost: e.costPrice.toString(),
                        selling: e.sellingPrice.toString(),
                        vendorId: e.vendorId
                    }));

                    // Fill up to 15 rows
                    const paddedExpenses = [...existingExpenses];
                    while (paddedExpenses.length < 15) {
                        paddedExpenses.push({ code: '', name: '', description: '', cost: '', selling: '' });
                    }
                    setExpenses(paddedExpenses);
                } else {
                    alert('Failed to load job details');
                    router.push('/jobs');
                }
            } catch (err) {
                console.error('Failed to load data', err);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
    }, [id, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const updateExpense = (index: number, field: string, value: string) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], [field]: value };

        if (field === 'code') {
            const master = expenseMasters.find(m => m.code === value);
            if (master) newExpenses[index].name = master.name;
        }

        setExpenses(newExpenses);
    };

    const handleContainerChange = (index: number, value: string) => {
        const newContainers = [...containers];
        newContainers[index] = value;
        setContainers(newContainers);
    };

    const addContainer = () => setContainers([...containers, '']);
    const removeContainer = (index: number) => {
        if (containers.length > 1) {
            setContainers(containers.filter((_, i) => i !== index));
        } else {
            setContainers(['']);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`/api/jobs/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    containerNo: containers.filter(c => c.trim() !== '').join(', '),
                    expenses
                }),
            });

            if (response.ok) {
                router.push(`/jobs/${id}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to update job');
            }
        } catch (err) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full shadow-xl shadow-blue-600/20" />
                </div>
            </DashboardLayout>
        );
    }

    const totalInvoice = expenses.reduce((sum, e) => sum + (parseFloat(e.selling) || 0), 0);

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto min-h-screen pb-10">
                {/* TOOLBAR HEADER */}
                <div className="glass-panel mb-6 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                            <span className="text-blue-600 dark:text-blue-400 font-black text-xl italic leading-none">JS</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-widest uppercase italic">Edit Job Sheet: {formData.jobNumber}</h1>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Update Mode</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white">
                            <Copy size={16} /> <span className="text-[8px] font-black uppercase tracking-widest">Copy</span>
                        </button>
                        <div className="w-px h-8 bg-slate-800 mx-2 hidden lg:block"></div>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="flex flex-col items-center gap-1 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            <span className="text-[8px] font-black uppercase tracking-widest">Update</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-white"
                        >
                            <RotateCcw size={16} /> <span className="text-[8px] font-black uppercase tracking-widest">Reset</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex flex-col items-center gap-1 px-4 py-2 hover:bg-slate-800 rounded-xl transition-all text-slate-400 hover:text-red-400 underline decoration-2 underline-offset-4"
                        >
                            <LogOut size={16} /> <span className="text-[8px] font-black uppercase tracking-widest">Exit</span>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* TOP FORM SECTION (Same as New Page) */}
                    <div className="glass-card p-8 lg:p-12 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-[100px] -z-10 group-hover:bg-blue-600/10 transition-colors"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-20 gap-y-6">
                            {/* Left Side */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Job Number :</label>
                                    <div className="sm:col-span-2 relative">
                                        <input
                                            readOnly
                                            className="glass-input w-full cursor-not-allowed opacity-50 italic"
                                            value={formData.jobNumber}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1">
                                            <Book size={14} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Customer Code :</label>
                                    <div className="sm:col-span-2 flex gap-2">
                                        <select
                                            name="customerId"
                                            required
                                            className="glass-input flex-1 appearance-none"
                                            value={formData.customerId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Customer...</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" className="p-3 bg-background border border-border rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                            <Book size={16} />
                                        </button>
                                    </div>
                                </div>

                                {[
                                    { label: 'Vessel', name: 'vessel' },
                                    { label: 'Place', name: 'place' },
                                    { label: 'Shipper Ref. #', name: 'shipperRef' },
                                    { label: 'G.D No.', name: 'gdNo', mono: true },
                                    { label: 'Form E', name: 'formE', mono: true },
                                ].map((field) => (
                                    <div key={field.name} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <label className="text-subtext">{field.label} :</label>
                                        <input
                                            name={field.name}
                                            className={`sm:col-span-2 glass-input w-full ${field.mono ? 'font-mono' : 'font-bold'}`}
                                            value={(formData as any)[field.name]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Commodity :</label>
                                    <div className="sm:col-span-2 flex gap-2">
                                        <input
                                            name="commodity"
                                            className="glass-input flex-1"
                                            value={formData.commodity}
                                            onChange={handleChange}
                                        />
                                        <button type="button" className="p-3 bg-background border border-border rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                                            <Book size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Volume :</label>
                                    <input
                                        name="volume"
                                        className="sm:col-span-2 glass-input w-full font-bold"
                                        value={formData.volume}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-4">
                                    <div className="flex flex-col">
                                        <label className="text-subtext">Container(s) :</label>
                                        <span className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mt-1">Total: {containers.filter(c => c.trim() !== '').length}</span>
                                    </div>
                                    <div className="sm:col-span-2 space-y-2">
                                        {containers.map((container, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <input
                                                    className="flex-1 glass-input font-mono"
                                                    placeholder={`Container #${idx + 1}`}
                                                    value={container}
                                                    onChange={(e) => handleContainerChange(idx, e.target.value)}
                                                />
                                                {idx === containers.length - 1 ? (
                                                    <button
                                                        type="button"
                                                        onClick={addContainer}
                                                        className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-lg shadow-blue-600/5 group"
                                                        title="Add Container"
                                                    >
                                                        <Plus size={16} className="group-hover:scale-125 transition-transform" />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeContainer(idx)}
                                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg shadow-red-500/5 group"
                                                        title="Remove Container"
                                                    >
                                                        <Trash2 size={16} className="group-hover:scale-110 transition-transform" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side */}
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Job Date :</label>
                                    <input
                                        type="date"
                                        name="jobDate"
                                        required
                                        className="sm:col-span-2 glass-input w-full"
                                        value={formData.jobDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext text-nowrap">No. Of Packages :</label>
                                    <div className="sm:col-span-2 flex gap-2">
                                        <input
                                            type="number"
                                            name="packages"
                                            className="glass-input flex-1"
                                            value={formData.packages}
                                            onChange={handleChange}
                                        />
                                        <div className="w-1/3 p-2 bg-background border border-border rounded-xl"></div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Type :</label>
                                    <select
                                        name="jobType"
                                        className="sm:col-span-2 glass-input w-full uppercase tracking-widest"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                    >
                                        <option value="EXPORT">EXPORT</option>
                                        <option value="IMPORT">IMPORT</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">POD :</label>
                                    <select
                                        name="podId"
                                        className="sm:col-span-2 glass-input w-full uppercase tracking-widest"
                                        value={formData.podId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select POD...</option>
                                        {ports.map((port) => (
                                            <option key={port.id} value={port.id}>{port.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">Weight :</label>
                                    <div className="sm:col-span-2 flex gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            name="weight"
                                            className="glass-input flex-1"
                                            value={formData.weight}
                                            onChange={handleChange}
                                        />
                                        <div className="w-1/3 p-2 bg-background border border-border rounded-xl"></div>
                                    </div>
                                </div>

                                {[
                                    { label: formData.jobType === 'EXPORT' ? 'Booking No.' : 'B/L No.', name: 'hawbBl' },
                                    { label: 'Shpt Handel By', name: 'handledBy' },
                                ].map((field) => (
                                    <div key={field.name} className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                        <label className="text-subtext">{field.label} :</label>
                                        <input
                                            name={field.name}
                                            className="sm:col-span-2 glass-input w-full"
                                            value={(formData as any)[field.name]}
                                            onChange={handleChange}
                                        />
                                    </div>
                                ))}

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext">G.D Date :</label>
                                    <input
                                        type="date"
                                        name="gdDate"
                                        className="sm:col-span-2 glass-input w-full"
                                        value={formData.gdDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext text-nowrap">Form E Date :</label>
                                    <input
                                        type="date"
                                        name="formEDate"
                                        className="sm:col-span-2 glass-input w-full"
                                        value={formData.formEDate}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                                    <label className="text-subtext text-nowrap">Sales Person :</label>
                                    <select
                                        name="salesPerson"
                                        className="sm:col-span-2 glass-input w-full appearance-none"
                                        value={formData.salesPerson}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Sales Person...</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Manager">Manager</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* EXPENSES TABLE SECTION */}
                    <div className="glass-panel overflow-hidden shadow-2xl">
                        <div className="p-0 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-500/5 dark:bg-slate-950">
                                        <th className="w-12 px-4 py-4 text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest border-r border-border/50 dark:border-slate-800 text-center">A</th>
                                        <th className="w-32 px-4 py-4 text-subtext border-r border-border/50 dark:border-slate-800">Code</th>
                                        <th className="px-4 py-4 text-subtext border-r border-border/50 dark:border-slate-800 text-center">Expense Name</th>
                                        <th className="w-1/3 px-4 py-4 text-subtext border-r border-border/50 dark:border-slate-800">Description</th>
                                        <th className="w-32 px-4 py-4 text-subtext border-r border-border/50 dark:border-slate-800 text-right">COST</th>
                                        <th className="w-32 px-4 py-4 text-subtext text-right">SELLING</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.map((expense, idx) => (
                                        <tr key={idx} className="border-b border-border/50 dark:border-slate-800 hover:bg-slate-500/5 transition-colors group">
                                            <td className="px-4 py-2 border-r border-border/50 dark:border-slate-800 text-center group-hover:bg-blue-600/10 transition-colors">
                                                <input type="checkbox" className="w-3 h-3 rounded bg-background border-border" />
                                            </td>
                                            <td className="px-1 py-1 border-r border-border/50 dark:border-slate-800">
                                                <input
                                                    className="w-full bg-transparent px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:bg-slate-500/10 rounded-lg transition-all"
                                                    value={expense.code}
                                                    onChange={(e) => updateExpense(idx, 'code', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-border/50 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-800/30">
                                                <input
                                                    className="w-full bg-transparent px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:bg-slate-500/10 rounded-lg transition-all text-center"
                                                    value={expense.name}
                                                    onChange={(e) => updateExpense(idx, 'name', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-border/50 dark:border-slate-800">
                                                <input
                                                    className="w-full bg-transparent px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:bg-slate-500/10 rounded-lg transition-all"
                                                    value={expense.description}
                                                    onChange={(e) => updateExpense(idx, 'description', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-1 py-1 border-r border-border/50 dark:border-slate-800 bg-slate-500/5 dark:bg-slate-800/30">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent px-3 py-2 text-xs font-black text-red-500 dark:text-red-400 focus:outline-none focus:bg-slate-500/10 rounded-lg transition-all text-right font-mono"
                                                    placeholder="0.00"
                                                    value={expense.cost}
                                                    onChange={(e) => updateExpense(idx, 'cost', e.target.value)}
                                                />
                                            </td>
                                            <td className="px-1 py-1">
                                                <input
                                                    type="number"
                                                    className="w-full bg-transparent px-3 py-2 text-xs font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:bg-slate-500/10 rounded-lg transition-all text-right font-mono"
                                                    placeholder="0.00"
                                                    value={expense.selling}
                                                    onChange={(e) => updateExpense(idx, 'selling', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-slate-500/5 dark:bg-slate-950 p-6 flex justify-between items-center border-t border-border/50 dark:border-slate-800">
                            <button
                                type="button"
                                onClick={() => setExpenses([...expenses, { code: '', name: '', description: '', cost: '', selling: '' }])}
                                className="flex items-center gap-2 group"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                    <Plus size={16} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-all">Add Line Expense</span>
                            </button>

                            <div className="flex items-center gap-8">
                                <div className="flex flex-col items-end">
                                    <span className="text-subtext mb-1">Invoice Total :</span>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white tracking-widest flex items-baseline gap-2">
                                        <span className="text-xs text-blue-600 dark:text-blue-500 uppercase italic">PKR</span>
                                        {totalInvoice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div >
        </DashboardLayout >
    );
}
