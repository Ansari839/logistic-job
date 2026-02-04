'use client';

import React, { useState, useEffect } from 'react';
import {
    Globe,
    Save,
    Loader2,
    Coins,
    Percent,
    Settings,
    Plus,
    Trash2,
    CheckCircle2,
    Building2,
    Scale,
    Edit2,
    X,
    MapPin,
    AlertCircle,
    Info
} from 'lucide-react';

export default function SystemConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('profile');

    // Data States
    const [settings, setSettings] = useState<any[]>([]);
    const [currencies, setCurrencies] = useState<any[]>([]);
    const [availableCurrencies, setAvailableCurrencies] = useState<any[]>([]);
    const [taxes, setTaxes] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [companyData, setCompanyData] = useState<any>({
        name: '', tagline: '', address: '', phone: '', email: '', website: '', taxNumber: '', registrationNo: ''
    });

    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [sRes, cRes, tRes, compRes, brRes, acRes] = await Promise.all([
                    fetch('/api/settings/system').then(res => res.json()),
                    fetch('/api/settings/currencies').then(res => res.json()),
                    fetch('/api/settings/taxes').then(res => res.json()),
                    fetch('/api/company').then(res => res.json()),
                    fetch('/api/branches').then(res => res.json()),
                    fetch('/api/settings/currencies/all').then(res => res.json())
                ]);

                setSettings(Array.isArray(sRes) ? sRes : []);
                setCurrencies(cRes.currencies || []);
                setTaxes(tRes.taxes || []);
                setBranches(brRes || []);
                setAvailableCurrencies(acRes || []);

                if (compRes.company) {
                    setCompanyData(compRes.company);
                }

            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getSetting = (key: string) => settings.find(s => s.key === key)?.value || '';

    const updateSetting = (key: string, value: string) => {
        setSettings(prev => {
            const existing = prev.find(s => s.key === key);
            if (existing) {
                return prev.map(s => s.key === key ? { ...s, value } : s);
            }
            return [...prev, { key, value, type: 'CONFIG' }];
        });
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(companyData),
            });
            if (res.ok) {
                setMessage('Business profile updated!');
            } else {
                const data = await res.json();
                setMessage(data.error || 'Failed to save profile');
            }
        } catch (error) {
            setMessage('Network error: Failed to save profile');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleSaveGeneral = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/settings/system', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });
            if (res.ok) {
                setMessage('General preferences saved!');
            } else {
                const data = await res.json();
                setMessage(data.error || 'Failed to save settings');
            }
        } catch (error) {
            setMessage('Network error: Failed to save settings');
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(''), 5000);
        }
    };

    const handleCurrencyAction = async (data: any) => {
        setSaving(true);
        try {
            const method = data.id ? 'PATCH' : 'POST';
            const res = await fetch('/api/settings/currencies', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await fetch('/api/settings/currencies').then(r => r.json());
                setCurrencies(updated.currencies);
                setShowModal(null);
                setEditingItem(null);
                setMessage(data.id ? 'Currency updated' : 'Currency added');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCurrency = async (id: number) => {
        if (!confirm('Remove this currency from company support?')) return;
        try {
            const res = await fetch(`/api/settings/currencies?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setCurrencies(prev => prev.filter(c => c.id !== id));
                setMessage('Currency removed');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleTaxAction = async (data: any) => {
        setSaving(true);
        try {
            const method = data.id ? 'PATCH' : 'POST';
            const res = await fetch('/api/settings/taxes', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (res.ok) {
                const updated = await fetch('/api/settings/taxes').then(r => r.json());
                setTaxes(updated.taxes);
                setShowModal(null);
                setEditingItem(null);
                setMessage(data.id ? 'Tax rule updated' : 'Tax rule created');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            setMessage('Action failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTax = async (id: number) => {
        if (!confirm('Are you sure you want to delete this tax rule?')) return;
        try {
            const res = await fetch(`/api/settings/taxes?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                setTaxes(prev => prev.filter(t => t.id !== id));
                setMessage('Tax rule removed');
                setTimeout(() => setMessage(''), 3000);
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="animate-spin text-blue-500" size={48} />
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs italic">Syncing Management Hub...</p>
        </div>
    );

    return (
        <div className="space-y-8 pb-20 relative">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">
                        Logistics Control Center
                    </h2>
                    <p className="text-subtext mt-2 font-medium">Configure core business identity and operational parameters.</p>
                </div>
                <div className="hidden lg:flex items-center gap-2 bg-blue-500/5 px-4 py-2 rounded-2xl border border-blue-500/10">
                    <AlertCircle size={16} className="text-blue-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Settings affect entire organization</span>
                </div>
            </div>

            {/* Notification */}
            {message && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right duration-300">
                    <div className={`glass-panel p-4 border flex items-center gap-3 shadow-2xl ${message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        }`}>
                        {message.toLowerCase().includes('failed') || message.toLowerCase().includes('error')
                            ? <AlertCircle size={20} />
                            : <CheckCircle2 size={20} />
                        }
                        <span className="text-sm font-black uppercase italic tracking-tight">{message}</span>
                    </div>
                </div>
            )}

            {/* Icons & Tabs Strategy (Simulated Pagination) */}
            <div className="flex flex-wrap gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/50 rounded-[1.5rem] w-fit border border-slate-200 dark:border-slate-800 shadow-inner">
                {[
                    { id: 'profile', label: 'Business Profile', icon: Building2 },
                    { id: 'general', label: 'Localizations', icon: Globe },
                    { id: 'currencies', label: 'Currency Matrix', icon: Coins },
                    { id: 'taxes', label: 'Fiscal Rules', icon: Scale }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                            flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-500 transform
                            ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-[0_10px_40px_-10px_rgba(59,130,246,0.3)] scale-[1.05] z-10 border border-blue-500/10'
                                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}
                        `}
                    >
                        <tab.icon size={20} className={activeTab === tab.id ? 'text-blue-500' : ''} />
                        <span className="text-xs font-black uppercase italic tracking-tighter">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Tab Content Rendering */}
            <div className="transition-all duration-700 ease-out">
                {activeTab === 'profile' && (
                    <form onSubmit={handleSaveProfile} className="glass-panel p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center gap-6 mb-12 pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[2rem] shadow-2xl shadow-blue-500/30 ring-8 ring-blue-500/5">
                                <Building2 className="text-white" size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Business Identity</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mt-1.5 ml-0.5">Edit Official Organizational Credentials</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Official Company Nomenclature</label>
                                <input
                                    required
                                    type="text"
                                    className="glass-input w-full text-2xl font-black uppercase italic tracking-tight focus:ring-8 focus:ring-blue-500/5 transition-all py-5"
                                    value={companyData.name}
                                    onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Global Tagline / Brand Vision</label>
                                <input
                                    type="text"
                                    className="glass-input w-full font-bold py-4"
                                    placeholder="Define your business mission..."
                                    value={companyData.tagline}
                                    onChange={e => setCompanyData({ ...companyData, tagline: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Tax Number (NTN)</label>
                                <div className="relative group">
                                    <input
                                        type="text"
                                        className="glass-input w-full font-mono font-black py-4 pl-12"
                                        value={companyData.taxNumber}
                                        onChange={e => setCompanyData({ ...companyData, taxNumber: e.target.value })}
                                    />
                                    <Info size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Registration Number</label>
                                <input
                                    type="text"
                                    className="glass-input w-full font-mono font-black py-4"
                                    value={companyData.registrationNo}
                                    onChange={e => setCompanyData({ ...companyData, registrationNo: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Communication Line</label>
                                <input
                                    type="tel"
                                    className="glass-input w-full font-black py-4"
                                    value={companyData.phone}
                                    onChange={e => setCompanyData({ ...companyData, phone: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Digital Liaison (Email)</label>
                                <input
                                    type="email"
                                    className="glass-input w-full font-black lowercase py-4"
                                    value={companyData.email}
                                    onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2 md:col-span-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Physical Headquarters Deployment Address</label>
                                <textarea
                                    className="glass-input w-full font-bold py-4 min-h-[100px]"
                                    value={companyData.address}
                                    onChange={e => setCompanyData({ ...companyData, address: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="glass-button min-w-[280px] flex items-center justify-center gap-5 py-5 rounded-[1.25rem] bg-slate-900 dark:bg-blue-600 text-white shadow-[0_20px_50px_-10px_rgba(59,130,246,0.4)] active:scale-95 transition-all group"
                            >
                                {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} className="group-hover:scale-110 transition-transform" />}
                                <span className="text-lg font-black uppercase italic tracking-[0.2em]">
                                    {saving ? 'SYNCHRONIZING...' : 'COMMIT PROFILE'}
                                </span>
                            </button>
                        </div>
                    </form>
                )}

                {activeTab === 'general' && (
                    <div className="glass-panel p-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center gap-6 mb-12 pb-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="p-6 bg-blue-600/10 rounded-[2rem] border border-blue-500/20 shadow-inner">
                                <Globe className="text-blue-600 dark:text-blue-500" size={40} />
                            </div>
                            <div>
                                <h3 className="text-4xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Localizations</h3>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.5em] mt-1.5 ml-0.5">Define Regional Operational Preferences</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Global System Timezone</label>
                                <select
                                    className="glass-input w-full font-black text-xl py-5 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                    value={getSetting('timezone')}
                                    onChange={e => updateSetting('timezone', e.target.value)}
                                >
                                    <option value="Asia/Karachi">PAKISTAN (PKT - GMT+5)</option>
                                    <option value="UTC">UNIVERSAL COORDINATED (UTC)</option>
                                    <option value="America/New_York">USA EASTERN (EST - GMT-5)</option>
                                    <option value="Europe/London">LONDON (GMT - GMT+0)</option>
                                    <option value="Asia/Dubai">DUBAI (GST - GMT+4)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Dashboard Chronology Format</label>
                                <select
                                    className="glass-input w-full font-black text-xl py-5 uppercase italic hover:bg-white dark:hover:bg-slate-800 transition-colors"
                                    value={getSetting('dateFormat')}
                                    onChange={e => updateSetting('dateFormat', e.target.value)}
                                >
                                    <option value="DD-MM-YYYY">DD - MM - YYYY (INTL STANDARD)</option>
                                    <option value="MM-DD-YYYY">MM - DD - YYYY (NORTH AMERICAN)</option>
                                    <option value="YYYY-MM-DD">YYYY - MM - DD (ISO TECHNICAL)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Default Service Tax Rate (%)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="glass-input w-full font-black text-xl py-5 pr-12 focus:ring-blue-500/10"
                                        value={getSetting('serviceTaxRate')}
                                        onChange={e => updateSetting('serviceTaxRate', e.target.value)}
                                        placeholder="17"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">%</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-1.5">Default Service Charges (%)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="glass-input w-full font-black text-xl py-5 pr-12 focus:ring-blue-500/10"
                                        value={getSetting('serviceCharges')}
                                        onChange={e => updateSetting('serviceCharges', e.target.value)}
                                        placeholder="0"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">%</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                            <button
                                onClick={handleSaveGeneral}
                                disabled={saving}
                                className="glass-button min-w-[280px] flex items-center justify-center gap-5 py-5 rounded-[1.25rem] shadow-2xl active:scale-95 transition-all text-blue-600 dark:text-blue-400 group border-2 border-blue-500/10"
                            >
                                {saving ? <Loader2 className="animate-spin" size={24} /> : <X size={24} className="rotate-45 group-hover:rotate-[135deg] transition-transform duration-500" />}
                                <span className="text-lg font-black uppercase italic tracking-[0.2em]">
                                    {saving ? 'SAVING...' : 'SYNC CONFIG'}
                                </span>
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'currencies' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-amber-500/5 p-10 rounded-[3rem] border border-amber-500/10 shadow-inner gap-6">
                            <div className="flex items-center gap-8">
                                <div className="p-7 bg-amber-500/20 rounded-[2.5rem] border border-amber-500/30 shadow-2xl shadow-amber-500/10 ring-12 ring-amber-500/5">
                                    <Coins className="text-amber-500" size={48} />
                                </div>
                                <div>
                                    <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Currency Hub</h3>
                                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.5em] mt-2 ml-0.5 whitespace-nowrap">Global Conversion Matrix & Liquidity</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setEditingItem(null); setShowModal('currency'); }}
                                className="glass-panel px-10 py-5 bg-white dark:bg-slate-900 flex items-center gap-4 group transition-all hover:scale-105 hover:shadow-2xl active:scale-95 border-amber-500/20"
                            >
                                <Plus size={28} className="text-amber-500 group-hover:rotate-180 transition-transform duration-700" />
                                <span className="text-base font-black uppercase italic tracking-tight">Deploy Support</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {currencies.map(curr => (
                                <div key={curr.id} className={`
                                    glass-panel p-10 relative overflow-hidden group hover:shadow-[0_30px_100px_-15px_rgba(245,158,11,0.2)] transition-all duration-700
                                    border-b-8 ${curr.isDefault ? 'border-b-emerald-500' : 'border-b-transparent hover:border-b-amber-500'}
                                `}>
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="w-20 h-20 rounded-[1.75rem] bg-amber-500/10 flex items-center justify-center font-black text-3xl text-amber-600 border border-amber-500/20 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                                            {curr.currency.code}
                                        </div>
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                            <button
                                                onClick={() => { setEditingItem(curr); setShowModal('currency'); }}
                                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            {!curr.isDefault && (
                                                <button
                                                    onClick={() => handleDeleteCurrency(curr.id)}
                                                    className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-1 mb-10">
                                        <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">{curr.currency.name}</h4>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{curr.currency.symbol} Digital Symbol Identifier</div>
                                    </div>

                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between transition-colors group-hover:border-amber-500/10">
                                        <div>
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Live Exchange Rate</div>
                                            <div className="text-4xl font-mono font-black text-amber-600 tracking-tighter">
                                                {curr.exchangeRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                                                <span className="text-[12px] ml-1.5 uppercase text-slate-400 font-sans tracking-widest">PKR</span>
                                            </div>
                                        </div>
                                        {curr.isDefault && (
                                            <div className="bg-emerald-500/10 text-emerald-500 px-5 py-2.5 rounded-2xl border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 shadow-2xl shadow-emerald-500/10">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
                                                SYSTEM BASE
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'taxes' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col sm:flex-row justify-between items-center bg-rose-500/5 p-10 rounded-[3rem] border border-rose-500/10 shadow-inner gap-6">
                            <div className="flex items-center gap-8">
                                <div className="p-7 bg-rose-500/20 rounded-[2.5rem] border border-rose-500/30 shadow-2xl shadow-rose-500/10 ring-12 ring-rose-500/5">
                                    <Scale className="text-rose-500" size={48} />
                                </div>
                                <div>
                                    <h3 className="text-5xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Fiscal Matrix</h3>
                                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-[0.5em] mt-2 ml-0.5 whitespace-nowrap">Taxation Directives & Revenue Controls</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setEditingItem(null); setShowModal('tax'); }}
                                className="glass-panel px-10 py-5 bg-white dark:bg-slate-900 flex items-center gap-4 group transition-all hover:scale-105 hover:shadow-2xl active:scale-95 border-rose-500/20"
                            >
                                <Plus size={28} className="text-rose-500 group-hover:rotate-90 transition-transform duration-700" />
                                <span className="text-base font-black uppercase italic tracking-tight">Deploy Directive</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {taxes.map(tax => (
                                <div key={tax.id} className="glass-panel p-10 relative overflow-hidden group hover:shadow-[0_30px_100px_-15px_rgba(244,63,94,0.15)] transition-all duration-700 border-l-[10px] border-l-rose-500 shadow-2xl ring-1 hover:ring-rose-500/20 transition-all">
                                    <div className="flex justify-between items-start mb-10">
                                        <div className="px-5 py-2.5 bg-slate-900/5 dark:bg-slate-900/50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border border-slate-200 dark:border-slate-800 ring-4 ring-slate-100 dark:ring-slate-900 group-hover:scale-105 transition-all">{tax.type} REVENUE</div>
                                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0">
                                            <button
                                                onClick={() => { setEditingItem(tax); setShowModal('tax'); }}
                                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-lg"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTax(tax.id)}
                                                className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-12 leading-[1.1] min-h-[66px] group-hover:text-rose-500 transition-colors">{tax.name}</h4>

                                    <div className="flex items-end justify-between pt-10 border-t border-slate-100 dark:border-slate-800 transition-colors group-hover:border-rose-500/20">
                                        <div className="text-6xl font-black text-rose-500 italic tracking-tighter group-hover:scale-110 group-hover:rotate-[-2deg] origin-left transition-all duration-500">
                                            {tax.percentage}<span className="text-2xl ml-1 opacity-40">%</span>
                                        </div>
                                        <div className="text-right pb-1">
                                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-1.5 justify-end mb-1">
                                                <MapPin size={12} className="text-rose-400" /> GEOGRAPHIC SCOPE
                                            </div>
                                            <div className="text-[13px] font-black text-blue-600 dark:text-blue-400 uppercase italic tracking-tighter truncate max-w-[150px]">
                                                {tax.branch?.name || 'ENTIRE ORGANIZATION'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Premium Modals Strategy */}
            {showModal === 'currency' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in zoom-in-95 duration-500">
                    <div className="glass-panel w-full max-w-xl p-12 relative overflow-hidden shadow-[0_50px_150px_-30px_rgba(245,158,11,0.3)] border-amber-500/30 ring-1 ring-amber-500/10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 shadow-2xl shadow-amber-500/20">
                                    <Coins className="text-amber-500" size={28} />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                    {editingItem ? 'Refine Logic' : 'Provision Token'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(null)} className="p-3 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-all transform hover:rotate-90">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleCurrencyAction({
                                id: editingItem?.id,
                                currencyId: formData.get('currencyId'),
                                exchangeRate: formData.get('exchangeRate'),
                                isDefault: formData.get('isDefault') === 'on'
                            });
                        }} className="space-y-8">
                            {!editingItem && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Currency Definition (ISO 4217)</label>
                                    <select name="currencyId" className="glass-input w-full font-black text-xl py-5" required>
                                        <option value="">Select Global Token...</option>
                                        {availableCurrencies.map(c => (
                                            <option key={c.id} value={c.id}>{c.code} - {c.name} ({c.symbol})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Synchro Exchange Rate (Relative to PKR)</label>
                                <div className="relative group">
                                    <input
                                        name="exchangeRate"
                                        type="number"
                                        step="0.000001"
                                        className="glass-input w-full text-5xl font-mono font-black py-8 pr-24 focus:ring-[20px] focus:ring-amber-500/5 transition-all"
                                        defaultValue={editingItem?.exchangeRate || 1}
                                        required
                                    />
                                    <span className="absolute right-8 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400 opacity-50">PKR</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 p-6 bg-slate-900/60 rounded-[1.5rem] border border-slate-800 ring-1 ring-white/5 shadow-2xl group hover:border-emerald-500/30 transition-all">
                                <input
                                    name="isDefault"
                                    type="checkbox"
                                    className="w-10 h-10 rounded-xl bg-slate-800 border-slate-700 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 transition-all cursor-pointer"
                                    defaultChecked={editingItem?.isDefault}
                                />
                                <div className="space-y-1">
                                    <label className="text-base font-black text-white uppercase italic tracking-tighter cursor-pointer">ANCHOR CONFIGURATION</label>
                                    <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.1em]">Set this token as the Organization Base Currency</p>
                                </div>
                            </div>

                            <button type="submit" disabled={saving} className="glass-button w-full py-6 rounded-[1.25rem] bg-amber-600 text-white font-black text-xl uppercase italic tracking-[0.25em] shadow-[0_20px_60px_-15px_rgba(245,158,11,0.5)] active:scale-95 transition-all mt-6 overflow-hidden relative">
                                {saving ? <Loader2 className="animate-spin inline mr-3" size={28} /> : null}
                                <span className="relative z-10">{editingItem ? 'COMMIT CHANGES' : 'DEPLOY TOKEN'}</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showModal === 'tax' && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                    <div className="glass-panel w-full max-w-xl p-12 relative overflow-hidden shadow-[0_50px_150px_-30px_rgba(225,29,72,0.3)] border-rose-500/30 ring-1 ring-rose-500/10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500/30 shadow-2xl shadow-rose-500/20">
                                    <Plus className="text-rose-500" size={28} />
                                </div>
                                <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                                    {editingItem ? 'Refine Directive' : 'New Fiscal Protocol'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(null)} className="p-3 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-all transform hover:rotate-90">
                                <X size={32} />
                            </button>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.currentTarget);
                            handleTaxAction({
                                id: editingItem?.id,
                                name: formData.get('name'),
                                percentage: formData.get('percentage'),
                                type: formData.get('type'),
                                branchId: formData.get('branchId') || null
                            });
                        }} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Official Policy Nomenclature</label>
                                <input name="name" type="text" className="glass-input w-full font-black text-xl py-5 uppercase focus:ring-rose-500/10" defaultValue={editingItem?.name} required placeholder="e.g. FEDERAL EXCISE DUTY (FED)" />
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Directivity Type</label>
                                    <select name="type" className="glass-input w-full font-black text-lg py-5" defaultValue={editingItem?.type || 'SALES'}>
                                        <option value="SALES">SALES TAXATION</option>
                                        <option value="WHT">WITHHOLDING</option>
                                        <option value="VAT">VALUE ADDED</option>
                                        <option value="CUSTOMS">CUSTOMS & DUTY</option>
                                        <option value="INCOME">CORPORATE INCOME</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Protocol Rate (%)</label>
                                    <div className="relative group">
                                        <input
                                            name="percentage"
                                            type="number"
                                            step="0.01"
                                            className="glass-input w-full text-4xl font-black font-mono py-4 pr-16"
                                            defaultValue={editingItem?.percentage || 0}
                                            required
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl font-black text-rose-500 opacity-50">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 ml-1.5">Jurisdictional Governance</label>
                                <select name="branchId" className="glass-input w-full font-black text-lg py-5" defaultValue={editingItem?.branchId || ''}>
                                    <option value="">GLOBAL ENTITY (ALL UNITS)</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name.toUpperCase()} JURISDICTION</option>
                                    ))}
                                </select>
                            </div>

                            <button type="submit" disabled={saving} className="glass-button w-full py-6 rounded-[1.25rem] bg-rose-600 text-white font-black text-xl uppercase italic tracking-[0.25em] shadow-[0_20px_60px_-15px_rgba(225,29,72,0.5)] active:scale-95 transition-all mt-6 shadow-2xl ring-4 ring-rose-500/5 group">
                                {saving ? <Loader2 className="animate-spin inline mr-3" size={28} /> : null}
                                <span className="group-hover:scale-105 transition-transform inline-block">
                                    {editingItem ? 'SYNC DIRECTIVE' : 'REGISTER PROTOCOL'}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
