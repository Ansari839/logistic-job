'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/navigation';
import {
    Ship, User, FileText, Package,
    ChevronLeft, Save, Loader2, Info,
    Calendar, MapPin, Hash, Anchor
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

    const [formData, setFormData] = useState({
        jobNumber: '',
        jobType: 'EXPORT',
        customerId: '',
        branchId: '',
        vessel: '',
        place: '',
        shipperRef: '',
        gdNo: '',
        formE: '',
        commodity: '',
        volume: '',
        containerNo: '',
        packages: '',
        weight: '',
        hawbBl: '',
        handledBy: '',
        salesPerson: '',
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

        // Auto-generate a temporary job number
        setFormData(prev => ({ ...prev, jobNumber: `JOB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}` }));
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
                body: JSON.stringify(formData),
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
            <div className="max-w-5xl mx-auto">
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
                                <Ship size={32} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-white tracking-tighter">Initialize Job</h1>
                                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest mt-0.5">Shipment Registration</p>
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
                                {loading ? 'Saving...' : 'Confirm Job'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content Side */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Core Details */}
                            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6">
                                    <Info size={18} className="text-blue-400" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Core Shipment Info</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Number</label>
                                        <div className="relative">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                            <input
                                                name="jobNumber"
                                                required
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                                value={formData.jobNumber}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Job Type</label>
                                        <select
                                            name="jobType"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-black uppercase tracking-widest text-xs"
                                            value={formData.jobType}
                                            onChange={handleChange}
                                        >
                                            <option value="EXPORT">Export Shipment</option>
                                            <option value="IMPORT">Import Shipment</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Customer / Client</label>
                                        <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                            <select
                                                name="customerId"
                                                required
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                                value={formData.customerId}
                                                onChange={handleChange}
                                            >
                                                <option value="">Select Customer...</option>
                                                {customers.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Vessel / Carrier</label>
                                        <div className="relative">
                                            <Ship className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                            <input
                                                name="vessel"
                                                placeholder="e.g. MSC ORION"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-12 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                value={formData.vessel}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Logistics Details */}
                            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6">
                                    <Package size={18} className="text-blue-400" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Logistics & Cargo</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Commodity</label>
                                        <input
                                            name="commodity"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                            value={formData.commodity}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Volume (e.g. 1x40HC)</label>
                                        <input
                                            name="volume"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                            value={formData.volume}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Container Number</label>
                                        <input
                                            name="containerNo"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono"
                                            value={formData.containerNo}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Packages</label>
                                            <input
                                                type="number"
                                                name="packages"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                value={formData.packages}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Weight (KG)</label>
                                            <input
                                                type="number"
                                                name="weight"
                                                step="0.01"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                                value={formData.weight}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar / Additional Info */}
                        <div className="space-y-8">
                            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6">
                                    <FileText size={18} className="text-blue-400" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">References</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GD Number</label>
                                        <input
                                            name="gdNo"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                            value={formData.gdNo}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">HAWB / BL</label>
                                        <input
                                            name="hawbBl"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm"
                                            value={formData.hawbBl}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Shipper Ref</label>
                                        <input
                                            name="shipperRef"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                            value={formData.shipperRef}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-800/60 p-8 rounded-[2rem] space-y-6">
                                <div className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6">
                                    <MapPin size={18} className="text-blue-400" />
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Assignment</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Branch</label>
                                        <select
                                            name="branchId"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm font-bold"
                                            value={formData.branchId}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select Branch...</option>
                                            {branches.map(b => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Handled By</label>
                                        <input
                                            name="handledBy"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                            value={formData.handledBy}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </DashboardLayout>
    );
}
