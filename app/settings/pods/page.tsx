'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Anchor } from 'lucide-react';

interface Port {
    id: number;
    name: string;
}

export default function PortsSettingsPage() {
    const [ports, setPorts] = useState<Port[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPortName, setNewPortName] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchPorts();
    }, []);

    const fetchPorts = async () => {
        try {
            const res = await fetch('/api/settings/ports');
            if (res.ok) {
                const data = await res.json();
                setPorts(data.ports);
            }
        } catch (err) {
            console.error('Failed to fetch ports');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPort = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPortName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch('/api/settings/ports', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPortName }),
            });
            if (res.ok) {
                setNewPortName('');
                fetchPorts();
            }
        } catch (err) {
            console.error('Failed to add port');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePort = async (id: number) => {
        if (!editName.trim()) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/settings/ports/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName }),
            });
            if (res.ok) {
                setEditingId(null);
                fetchPorts();
            }
        } catch (err) {
            console.error('Failed to update port');
        } finally {
            setSaving(false);
        }
    };

    const handleDeletePort = async (id: number) => {
        if (!confirm('Are you sure you want to delete this port?')) return;
        try {
            const res = await fetch(`/api/settings/ports/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchPorts();
            }
        } catch (err) {
            console.error('Failed to delete port');
        }
    };

    const startEditing = (port: Port) => {
        setEditingId(port.id);
        setEditName(port.name);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest italic">Ports of Discharge (POD)</h2>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Manage delivery destinations</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                    <Anchor size={20} />
                </div>
            </div>

            <form onSubmit={handleAddPort} className="flex gap-2">
                <input
                    type="text"
                    placeholder="Enter Port Name (e.g., JEBEL ALI)..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold uppercase tracking-wider"
                    value={newPortName}
                    onChange={(e) => setNewPortName(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={saving || !newPortName.trim()}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-2 text-xs uppercase tracking-widest"
                >
                    <Plus size={16} />
                    Add POD
                </button>
            </form>

            <div className="space-y-2">
                {loading ? (
                    <div className="py-10 text-center animate-pulse text-slate-500 text-xs font-black uppercase tracking-widest italic">
                        Loading Ports...
                    </div>
                ) : ports.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-800 rounded-2xl p-12 text-center">
                        <Anchor className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">No PODs configured yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {ports.map((port) => (
                            <div key={port.id} className="group flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 hover:border-blue-500/30 rounded-xl transition-all">
                                {editingId === port.id ? (
                                    <div className="flex-1 flex gap-2 mr-4">
                                        <input
                                            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold uppercase"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdatePort(port.id)}
                                            className="p-1 px-3 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 px-3 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 hover:text-white transition-all"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-black text-white uppercase tracking-wider">{port.name}</span>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => startEditing(port)}
                                                className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePort(port.id)}
                                                className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
