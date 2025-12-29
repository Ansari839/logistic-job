'use client';

import React, { useState, useEffect } from 'react';
import { Globe, Plus, Trash2 } from 'lucide-react';

export default function CurrenciesPage() {
    const [loading, setLoading] = useState(true);
    const [currencies, setCurrencies] = useState<any[]>([]);

    useEffect(() => {
        // Simulated fetch for sample
        setCurrencies([
            { id: 1, code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', exchangeRate: 1.0, isDefault: true },
            { id: 2, code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 278.5, isDefault: false },
        ]);
        setLoading(false);
    }, []);

    if (loading) return <div className="text-white">Loading currencies...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Currencies</h2>
                    <p className="text-slate-400 mt-1">Configure supported currencies and exchange rates</p>
                </div>
                <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors border border-slate-700">
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Currency</span>
                </button>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 border-b border-slate-800">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Currency</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Rate (Base: PKR)</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Default</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {currencies.map((curr) => (
                            <tr key={curr.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs border border-blue-500/20">
                                            {curr.code}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{curr.name}</p>
                                            <p className="text-xs text-slate-500">{curr.symbol}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-300 font-mono">
                                    {curr.exchangeRate.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    {curr.isDefault ? (
                                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            Default
                                        </span>
                                    ) : (
                                        <button className="text-[10px] font-bold text-slate-500 hover:text-white uppercase tracking-wider transition-colors">
                                            Set Default
                                        </button>
                                    )
                                    }
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-400/10">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
