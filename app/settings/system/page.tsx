'use client';

import React, { useState, useEffect } from 'react';

export default function SystemConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<any[]>([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetch('/api/settings/system')
            .then(res => res.json())
            .then(data => {
                setSettings(data);
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
            const response = await fetch('/api/settings/system', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setMessage('System configurations updated successfully');
            } else {
                setMessage('Failed to update settings');
            }
        } catch (error) {
            setMessage('An error occurred. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-white">Loading configurations...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">System Configuration</h2>
                <p className="text-slate-400 mt-1">Manage global rules, formats, and feature flags</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {message && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-sm font-medium">
                        {message}
                    </div>
                )}

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Localization</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Default Timezone</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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
                            <label className="text-sm font-medium text-slate-300">Date Format</label>
                            <select
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
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

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-slate-800 pb-2">Feature Flags</h3>
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-900 transition-colors">
                            <div>
                                <p className="font-bold text-white">Email Notifications</p>
                                <p className="text-xs text-slate-400 mt-1">Enable automated status updates via email</p>
                            </div>
                            <input
                                type="checkbox"
                                className="w-6 h-6 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                checked={getSetting('emailNotifications') === 'true'}
                                onChange={e => updateSetting('emailNotifications', e.target.checked.toString())}
                            />
                        </label>

                        <label className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-900 transition-colors">
                            <div>
                                <p className="font-bold text-white">Multi-Currency Support</p>
                                <p className="text-xs text-slate-400 mt-1">Allow transactions in multiple currencies</p>
                            </div>
                            <input
                                type="checkbox"
                                className="w-6 h-6 rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                                checked={getSetting('multiCurrency') === 'true'}
                                onChange={e => updateSetting('multiCurrency', e.target.checked.toString())}
                            />
                        </label>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-800">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Update Configurations'}
                    </button>
                </div>
            </form>
        </div>
    );
}
