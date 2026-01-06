'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Users, Search, Filter, Plus,
    Mail, Phone, MapPin, ChevronRight,
    Building2, Briefcase, DollarSign, ArrowUpRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Partner {
    id: number;
    name: string;
    code: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    taxNumber: string | null;
}

export default function VendorsPage() {
    const [partners, setPartners] = useState<Partner[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeDivision, setActiveDivision] = useState<string | null>(null);
    const [partnerType, setPartnerType] = useState<'vendor' | 'customer'>('vendor');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({
        name: '', code: '', email: '', phone: '', address: '', taxNumber: ''
    });

    const router = useRouter();

    useEffect(() => {
        const getCookie = (name: string) => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(';').shift();
        };

        const cookieDiv = getCookie('app_division');
        setActiveDivision(cookieDiv || localStorage.getItem('app_division') || 'logistics');
    }, []);

    useEffect(() => {
        fetchPartners();
    }, [partnerType]);

    const isAnimalFeed = activeDivision === 'animal-feed';
    const accentColor = isAnimalFeed ? 'emerald' : 'blue';

    const fetchPartners = async () => {
        setLoading(true);
        try {
            const endpoint = partnerType === 'vendor' ? '/api/vendors' : '/api/customers';
            const res = await fetch(endpoint);
            if (res.ok) {
                const data = await res.json();
                setPartners(partnerType === 'vendor' ? data.vendors : data.customers);
            }
        } catch (err) {
            console.error('Fetch partners failed');
        } finally {
            setLoading(false);
        }
    };

    const [error, setError] = useState('');

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            const endpoint = partnerType === 'vendor' ? '/api/vendors' : '/api/customers';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (res.ok) {
                setShowModal(false);
                setForm({ name: '', code: '', email: '', phone: '', address: '', taxNumber: '' });
                fetchPartners();
            } else {
                setError(data.error || 'Failed to create partner');
            }
        } catch (err) {
            console.error('Create partner failed', err);
            setError('Something went wrong. Please try again.');
        }
    };

    const filteredPartners = partners.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Partner Registry</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Manage Vendors & Customers</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className={`bg-${accentColor}-600 hover:bg-${accentColor}-500 text-white px-8 py-4 rounded-3xl font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-${accentColor}-600/20`}
                    >
                        <Plus size={20} />
                        Add {partnerType === 'vendor' ? 'Vendor' : 'Customer'}
                    </button>
                </div>

                {/* Tab Switcher & Search Bar */}
                <div className="glass-panel p-4 rounded-[2.5rem] flex flex-col lg:flex-row gap-6 items-center">
                    <div className="flex p-1 bg-background/50 border border-border rounded-2xl w-full lg:w-auto">
                        <button
                            onClick={() => setPartnerType('vendor')}
                            className={`flex-1 lg:px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${partnerType === 'vendor' ? `bg-${accentColor}-600 text-white shadow-lg` : 'text-subtext hover:text-primary'}`}
                        >
                            Vendors
                        </button>
                        <button
                            onClick={() => setPartnerType('customer')}
                            className={`flex-1 lg:px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${partnerType === 'customer' ? `bg-${accentColor}-600 text-white shadow-lg` : 'text-subtext hover:text-primary'}`}
                        >
                            Customers
                        </button>
                    </div>

                    <div className="relative flex-1 group w-full">
                        <Search className={`absolute left-5 top-1/2 -translate-y-1/2 text-subtext transition-colors group-focus-within:text-${accentColor}-500`} size={20} />
                        <input
                            type="text"
                            placeholder={`Search by ${partnerType} Name or Code...`}
                            className={`glass-input w-full rounded-2xl py-4 pl-14 pr-6 text-slate-900 dark:text-white text-sm font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500/40 transition-all`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Partners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="glass-card shadow-sm p-8 animate-pulse">
                                <div className="w-16 h-16 bg-primary/10 rounded-2xl mb-6" />
                                <div className="h-6 bg-primary/10 w-3/4 mb-2 rounded" />
                                <div className="h-4 bg-primary/10 w-1/2 rounded" />
                            </div>
                        ))
                    ) : filteredPartners.length === 0 ? (
                        <div className="col-span-full glass-panel p-20 text-center">
                            <Users className="w-16 h-16 text-subtext opacity-20 mx-auto mb-4" />
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No {partnerType === 'vendor' ? 'Vendors' : 'Customers'} Found</h3>
                            <p className="text-subtext font-bold max-w-sm mx-auto">Start building your network by adding your first {partnerType}.</p>
                        </div>
                    ) : (
                        filteredPartners.map((p) => (
                            <div
                                key={p.id}
                                className={`glass-card shadow-sm hover:border-${accentColor}-500/40 p-8 transition-all group relative overflow-hidden`}
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="bg-primary/5 hover:bg-primary/10 p-3 rounded-2xl text-slate-900 dark:text-white transition-all border border-border">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>

                                <div className={`w-16 h-16 rounded-2xl bg-${accentColor}-600/10 flex items-center justify-center text-${accentColor}-400 border border-${accentColor}-500/20 mb-6`}>
                                    {partnerType === 'vendor' ? <Building2 size={32} /> : <Users size={32} />}
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter mb-1 line-clamp-1">{p.name}</h3>
                                    <p className="text-subtext text-xs font-black uppercase tracking-widest">{p.code}</p>
                                </div>

                                <div className="space-y-4 pt-6 border-t border-border">
                                    <div className="flex items-center gap-3 text-subtext">
                                        <Mail size={16} className="text-primary/40" />
                                        <span className="text-xs font-bold truncate">{p.email || 'No email provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-subtext">
                                        <Phone size={16} className="text-primary/40" />
                                        <span className="text-xs font-bold">{p.phone || 'No phone provided'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-subtext">
                                        <Briefcase size={16} className="text-primary/40" />
                                        <span className="text-xs font-bold">NTN: {p.taxNumber || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Creation Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setShowModal(false)} />
                    <div className="relative glass-panel w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                        <div className={`p-8 border-b border-border bg-${accentColor}-600 text-white flex justify-between items-center`}>
                            <div>
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">New {partnerType === 'vendor' ? 'Vendor' : 'Customer'} Registered</h3>
                                <p className={`text-${accentColor}-100 text-[10px] font-black uppercase tracking-widest mt-1`}>Identity & Tax Management</p>
                            </div>
                        </div>
                        <form onSubmit={handleCreate} className="p-10 space-y-8">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-200">
                                    {error}
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">{partnerType} Name</label>
                                    <input
                                        required
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Business Name..."
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Unique Code</label>
                                    <input
                                        required
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary uppercase"
                                        placeholder="CUST-001..."
                                        value={form.code}
                                        onChange={e => setForm({ ...form, code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Tax Number (NTN)</label>
                                    <input
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="NTN-1234..."
                                        value={form.taxNumber}
                                        onChange={e => setForm({ ...form, taxNumber: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Telephone</label>
                                    <input
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="+92..."
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="contact@business.com"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Physical Address</label>
                                    <textarea
                                        className="glass-input w-full rounded-2xl px-6 py-4 text-slate-900 dark:text-white font-medium h-32 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                        placeholder="Complete business address..."
                                        value={form.address}
                                        onChange={e => setForm({ ...form, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-8 py-5 rounded-3xl border border-border text-subtext font-black uppercase tracking-widest text-xs hover:bg-primary/5 transition-all">Cancel</button>
                                <button type="submit" className={`flex-1 bg-${accentColor}-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-${accentColor}-600/20 transition-all active:scale-95`}>Register {partnerType}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
