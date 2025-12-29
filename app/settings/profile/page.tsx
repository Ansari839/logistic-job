'use client';

import React, { useState, useEffect } from 'react';

export default function CompanyProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/company')
            .then(res => res.json())
            .then(data => {
                setCompany(data);
                setLoading(false);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');

        try {
            const response = await fetch('/api/company', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(company),
            });

            if (response.ok) {
                setMessage('Company profile updated successfully');
            } else {
                setMessage('Failed to update company profile');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading company profile...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Company Profile</h2>
                <p className="text-slate-400 mt-1">Manage your company information and branding</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {message && (
                    <div className={`p-4 rounded-xl text-sm font-medium ${message.includes('successfully')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                        {message}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Company Name</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={company.name}
                            onChange={e => setCompany({ ...company, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Industry</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={company.industry || ''}
                            onChange={e => setCompany({ ...company, industry: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Email Address</label>
                        <input
                            type="email"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={company.email || ''}
                            onChange={e => setCompany({ ...company, email: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Phone Number</label>
                        <input
                            type="text"
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={company.phone || ''}
                            onChange={e => setCompany({ ...company, phone: e.target.value })}
                        />
                    </div>

                    <div className="md:col-span-2 space-y-2">
                        <label className="text-sm font-medium text-slate-300">Address</label>
                        <textarea
                            rows={3}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            value={company.address || ''}
                            onChange={e => setCompany({ ...company, address: e.target.value })}
                        />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </form>
        </div>
    );
}
