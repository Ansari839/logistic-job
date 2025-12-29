'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Users, Search, Filter, Plus,
    Mail, Phone, MapPin, ChevronRight,
    Building2, Briefcase, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Vendor {
    id: number;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
}

export default function VendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const router = useRouter();

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            const res = await fetch('/api/vendors');
            if (res.ok) {
                const data = await res.json();
                setVendors(data.vendors);
            }
        } catch (err) {
            console.error('Fetch vendors failed');
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter(v =>
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Vendor Registry</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Partner Network Management</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-3xl font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20">
                        <Plus size={20} />
                        Add New Vendor
                    </button>
                </div>

                {/* Search Bar */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 p-4 rounded-[2.5rem] flex flex-col lg:flex-row gap-4 items-center">
                    <div className="relative flex-1 group w-full">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-blue-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by Vendor Name or Code..."
                            className="w-full bg-slate-950/50 border border-slate-800/50 rounded-3xl py-4 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/40 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 animate-pulse">
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl mb-6" />
                                <div className="h-6 bg-slate-800 w-3/4 mb-2 rounded" />
                                <div className="h-4 bg-slate-800 w-1/2 rounded" />
                            </div>
                        ))
                    ) : filteredVendors.length === 0 ? (
                        <div className="col-span-full bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-20 text-center">
                            <Users className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-white mb-2">No Vendors Found</h3>
                            <p className="text-slate-500 font-bold max-w-sm mx-auto">Start building your logistics partner network by adding your first vendor.</p>
                        </div>
                    ) : (
                        filteredVendors.map((v) => (
                            <div
                                key={v.id}
                                className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 hover:border-blue-500/40 rounded-[2.5rem] p-8 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl text-white transition-all">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>

                                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-6">
                                    <Building2 size={32} />
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-white tracking-tighter mb-1 line-clamp-1">{v.name}</h3>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{v.code}</p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-slate-800/60">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Mail size={16} className="text-slate-600" />
                                        <span className="text-xs font-bold truncate">{v.email || 'No email provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Phone size={16} className="text-slate-600" />
                                        <span className="text-xs font-bold">{v.phone || 'No phone provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Briefcase size={16} className="text-slate-600" />
                                        <span className="text-xs font-bold">NTN: {v.taxNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
