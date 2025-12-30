'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    Ship, User, FileText, Package,
    ChevronLeft, Save, Loader2, Info,
    Calendar, MapPin, Hash, Anchor,
    DollarSign, Plus, Trash2
} from 'lucide-react';

interface Customer {
    id: number;
    name: string;
    code: string;
}

interface Branch {
    id: number;
    name: string;
}

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [branches, setBranches] = useState<Branch[]>([]);

    const [expenses, setExpenses] = useState([
        { code: '', name: '', description: '', cost: '', selling: '' },
        { code: '', name: '', description: '', cost: '', selling: '' },
        { code: '', name: '', description: '', cost: '', selling: '' },
        { code: '', name: '', description: '', cost: '', selling: '' },
    ]);

    const addExpenseRow = () => {
        setExpenses([...expenses, { code: '', name: '', description: '', cost: '', selling: '' }]);
    };

    const updateExpense = (index: number, field: string, value: string) => {
        const newExpenses = [...expenses];
        newExpenses[index] = { ...newExpenses[index], [field]: value };
        setExpenses(newExpenses);
    };

    const removeExpense = (index: number) => {
        const newExpenses = [...expenses];
        newExpenses.splice(index, 1);
        setExpenses(newExpenses);
    };

    const [formData, setFormData] = useState({
        jobNumber: '',
        jobType: 'EXPORT',
        customerId: '',
        branchId: '',
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
        jobDate: new Date().toISOString().split('T')[0], // Default to today
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [custRes, branchRes] = await Promise.all([
                    fetch('/api/customers'),
                    fetch('/api/company').then(res => res.json()).then(data => ({ branches: data.company.branches }))
                ]);

                if (custRes.ok) {
                    const custData = await custRes.json();
                    setCustomers(custData.customers);
                }
                setBranches(branchRes.branches || []);
            } catch (err) {
                console.error('Failed to load form data');
            }
        };
        fetchData();
        // Job Number is auto-generated on Server.
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, expenses }),
            });

            if (response.ok) {
                router.push('/jobs');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create job');
            }
        } catch (err) {
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6 text-sm font-bold uppercase tracking-widest"
                >
                    <ChevronLeft size={16} />
                    Back to Jobs
                </button>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-8 rounded-[2rem]">
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 rounded-3xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
                                <FileText size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter">Job Sheet</h1>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-0.5">New Shipment Entry</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-2xl border border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-black uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 text-sm uppercase tracking-widest"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                {loading ? 'Saving...' : 'Save Job'}
                            </button>
                        </div>
                    </div>

                    {/* Main Form Area - 2 Columns */}
                    <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem]">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                            {/* LEFT COLUMN */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Number</label>
                                    <input
                                        name="jobNumber"
                                        readOnly
                                        placeholder="Auto-Generated"
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-slate-400 focus:outline-none font-mono cursor-not-allowed"
                                        value="Auto-Generated"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer Code / Name *</label>
                                    <select
                                        name="customerId"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        value={formData.customerId}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Customer...</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vessel</label>
                                    <input
                                        name="vessel"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.vessel}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Place</label>
                                    <input
                                        name="place"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.place}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Shipper Ref #</label>
                                    <input
                                        name="shipperRef"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.shipperRef}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">G.D No.</label>
                                    <input
                                        name="gdNo"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                        value={formData.gdNo}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Form E</label>
                                    <input
                                        name="formE"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                        value={formData.formE}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commodity</label>
                                    <input
                                        name="commodity"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.commodity}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume</label>
                                    <input
                                        name="volume"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.volume}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Container #</label>
                                    <input
                                        name="containerNo"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono"
                                        value={formData.containerNo}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Date *</label>
                                    <input
                                        type="date"
                                        name="jobDate"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.jobDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">No. Of Packages</label>
                                    <input
                                        type="number"
                                        name="packages"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.packages}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type</label>
                                    <select
                                        name="jobType"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase"
                                        value={formData.jobType}
                                        onChange={handleChange}
                                    >
                                        <option value="EXPORT">EXPORT</option>
                                        <option value="IMPORT">IMPORT</option>
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Weight</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="weight"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.weight}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Hawb / House</label>
                                    <input
                                        name="hawbBl"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.hawbBl}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Shpt Handle By</label>
                                    <input
                                        name="handledBy"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.handledBy}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">G.D Date</label>
                                    <input
                                        type="date"
                                        name="gdDate"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.gdDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Form E Date</label>
                                    <input
                                        type="date"
                                        name="formEDate"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.formEDate}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sales Person</label>
                                    <input
                                        name="salesPerson"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.salesPerson}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
