'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Globe, Save, Loader2 } from 'lucide-react';

export default function SystemConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [message, setMessage] = useState('');

    // Company form data
    const [companyData, setCompanyData] = useState({
        name: '',
        tagline: '',
        industry: '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'Pakistan',
        phone: '',
        email: '',
        website: '',
        taxNumber: '',
        registrationNo: '',
        fiscalYearStart: '',
        fiscalYearEnd: '',
    });

    useEffect(() => {
        Promise.all([
            fetch('/api/settings/system').then(res => res.json()),
            fetch('/api/company').then(res => res.json())
        ]).then(([settingsData, companyData]) => {
            setSettings(settingsData);
            if (companyData.company) {
                setCompany(companyData.company);
                setCompanyData({
                    name: companyData.company.name || '',
                    tagline: companyData.company.tagline || '',
                    industry: companyData.company.industry || '',
                    address: companyData.company.address || '',
                    city: companyData.company.city || '',
                    state: companyData.company.state || '',
                    postalCode: companyData.company.postalCode || '',
                    country: companyData.company.country || 'Pakistan',
                    phone: companyData.company.phone || '',
                    email: companyData.company.email || '',
                    website: companyData.company.website || '',
                    taxNumber: companyData.company.taxNumber || '',
                    registrationNo: companyData.company.registrationNo || '',
                    fiscalYearStart: companyData.company.fiscalYearStart ? companyData.company.fiscalYearStart.split('T')[0] : '',
                    fiscalYearEnd: companyData.company.fiscalYearEnd ? companyData.company.fiscalYearEnd.split('T')[0] : '',
                });
            }
            setLoading(false);
        });
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            // Save system settings
            const settingsRes = await fetch('/api/settings/system', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            // Save company info
            const companyRes = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...companyData,
                    fiscalYearStart: companyData.fiscalYearStart ? new Date(companyData.fiscalYearStart).toISOString() : null,
                    fiscalYearEnd: companyData.fiscalYearEnd ? new Date(companyData.fiscalYearEnd).toISOString() : null,
                }),
            });

            if (settingsRes.ok && companyRes.ok) {
                setMessage('All settings updated successfully');
                setTimeout(() => setMessage(''), 3000);
            } else {
                setMessage('Failed to update some settings');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-foreground text-center pt-20">Loading configurations...</div>;

    return (
        <div className="space-y-8 pb-10">
            <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">System Configuration</h2>
                <p className="text-subtext mt-2">Manage company profile and system settings</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 glass-panel p-8">
                {message && (
                    <div className={`p-4 ${message.includes('success') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'} border rounded-xl text-sm font-bold`}>
                        {message}
                    </div>
                )}

                {/* Company Profile Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-border pb-2 flex items-center gap-2">
                        <Building2 size={20} className="text-blue-500" />
                        Company Profile
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Company Name *</label>
                            <input
                                required
                                type="text"
                                className="glass-input w-full"
                                value={companyData.name}
                                onChange={e => setCompanyData({ ...companyData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Tagline / Slogan</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                placeholder="e.g., Freight Forwarding & Logistics Solutions"
                                value={companyData.tagline}
                                onChange={e => setCompanyData({ ...companyData, tagline: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Industry</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                placeholder="e.g., Logistics, Trading"
                                value={companyData.industry}
                                onChange={e => setCompanyData({ ...companyData, industry: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Tax Number (NTN)</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.taxNumber}
                                onChange={e => setCompanyData({ ...companyData, taxNumber: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Registration No.</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.registrationNo}
                                onChange={e => setCompanyData({ ...companyData, registrationNo: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Phone</label>
                            <input
                                type="tel"
                                className="glass-input w-full"
                                value={companyData.phone}
                                onChange={e => setCompanyData({ ...companyData, phone: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Email</label>
                            <input
                                type="email"
                                className="glass-input w-full"
                                value={companyData.email}
                                onChange={e => setCompanyData({ ...companyData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Website</label>
                            <input
                                type="url"
                                className="glass-input w-full"
                                placeholder="https://www.company.com"
                                value={companyData.website}
                                onChange={e => setCompanyData({ ...companyData, website: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Address</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.address}
                                onChange={e => setCompanyData({ ...companyData, address: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">City</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.city}
                                onChange={e => setCompanyData({ ...companyData, city: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">State</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.state}
                                onChange={e => setCompanyData({ ...companyData, state: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Postal Code</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.postalCode}
                                onChange={e => setCompanyData({ ...companyData, postalCode: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Country</label>
                            <input
                                type="text"
                                className="glass-input w-full"
                                value={companyData.country}
                                onChange={e => setCompanyData({ ...companyData, country: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Fiscal Year Start</label>
                            <input
                                type="date"
                                className="glass-input w-full"
                                value={companyData.fiscalYearStart}
                                onChange={e => setCompanyData({ ...companyData, fiscalYearStart: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Fiscal Year End</label>
                            <input
                                type="date"
                                className="glass-input w-full"
                                value={companyData.fiscalYearEnd}
                                onChange={e => setCompanyData({ ...companyData, fiscalYearEnd: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* System Settings Section */}
                <div className="space-y-6">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white border-b border-border pb-2 flex items-center gap-2">
                        <Globe size={20} className="text-blue-500" />
                        System Preferences
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Default Timezone</label>
                            <select
                                className="glass-input w-full"
                                value={getSetting('timezone')}
                                onChange={e => updateSetting('timezone', e.target.value)}
                            >
                                <option value="Asia/Karachi">Asia/Karachi (GMT+5)</option>
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New_York (GMT-5)</option>
                                <option value="Europe/London">Europe/London (GMT+0)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-500 dark:text-slate-400">Date Format</label>
                            <select
                                className="glass-input w-full"
                                value={getSetting('dateFormat')}
                                onChange={e => updateSetting('dateFormat', e.target.value)}
                            >
                                <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-border">
                    <button
                        type="submit"
                        disabled={saving}
                        className="glass-button w-full sm:w-auto"
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Saving...' : 'Save All Settings'}
                    </button>
                </div>
            </form>
        </div>
    );
}
