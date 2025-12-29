'use client';

import React, { useState, useEffect } from 'react';
import { Percent, Plus, Trash2, Edit2 } from 'lucide-react';

export default function TaxesPage() {
    const [loading, setLoading] = useState(true);
    const [taxes, setTaxes] = useState<any[]>([]);

    useEffect(() => {
        // Simulated fetch
        setTaxes([
            { id: 1, name: 'General Sales Tax', percentage: 17.0, type: 'SALES', branch: 'All Branches' },
            { id: 2, name: 'Income WHT', percentage: 10.0, type: 'WHT', branch: 'Head Office' },
        ]);
        setLoading(false);
    }, []);

    if (loading) return <div className="text-white">Loading tax rules...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Tax Rules</h2>
                    <p className="text-slate-400 mt-1">Configure applicable taxes for branches and transactions</p>
                </div>
                <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors border border-slate-700">
                    <Plus size={18} />
                    <span className="text-sm font-medium">Add Tax Rule</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {taxes.map((tax) => (
                    <div key={tax.id} className="p-6 bg-slate-900/50 border border-slate-800 rounded-2xl group hover:border-slate-700 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                                <Percent size={20} />
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-400/10 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-1">{tax.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-slate-400">
                            <span className="text-2xl font-black text-white italic">{tax.percentage}%</span>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
                                {tax.type}
                            </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center text-xs text-slate-500">
                            <span className="font-medium">Applied to:</span>
                            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800">
                                {tax.branch}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
