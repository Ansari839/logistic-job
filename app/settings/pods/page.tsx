'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, Anchor, Loader2 } from 'lucide-react';

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
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to add port');
            }
        } catch (err) {
            console.error('Failed to add port');
            alert('An unexpected error occurred');
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
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to update port');
            }
        } catch (err) {
            console.error('Failed to update port');
            alert('An unexpected error occurred');
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
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete port');
            }
        } catch (err) {
            console.error('Failed to delete port');
            alert('An unexpected error occurred');
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
                    <h2 className="text-xl font-black text-heading uppercase tracking-widest italic">Ports of Discharge (POD)</h2>
                    <p className="text-subtext mt-1">Manage delivery destinations</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <Anchor size={20} />
                </div>
            </div>

            <form onSubmit={handleAddPort} className="flex gap-2">
                <div className="flex-1 relative">
                    <input
                        type="text"
                        placeholder="Enter Port Name (e.g., JEBEL ALI)..."
                        className="w-full glass-input text-sm font-bold uppercase tracking-wider pr-10"
                        value={newPortName}
                        onChange={(e) => setNewPortName(e.target.value)}
                    />
                    {newPortName && (
                        <button
                            type="button"
                            onClick={() => setNewPortName('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            title="Clear Input"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={saving || !newPortName.trim()}
                    className="glass-button h-[42px] px-6 shrink-0"
                >
                    {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Plus size={16} />
                    )}
                    <span>Add POD</span>
                </button>
            </form>

            <div className="space-y-2">
                {loading ? (
                    <div className="py-10 text-center animate-pulse text-subtext text-xs font-black uppercase tracking-widest italic">
                        Loading Ports...
                    </div>
                ) : ports.length === 0 ? (
                    <div className="border-2 border-dashed border-border rounded-2xl p-12 text-center">
                        <Anchor className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-subtext">No PODs configured yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2">
                        {ports.map((port) => (
                            <div key={port.id} className="group flex items-center justify-between p-4 glass-card hover:border-blue-500/30 transition-all rounded-xl">
                                {editingId === port.id ? (
                                    <div className="flex-1 flex gap-2 mr-4">
                                        <input
                                            className="flex-1 glass-input py-1 text-sm font-bold uppercase"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => handleUpdatePort(port.id)}
                                            className="p-1 px-3 bg-primary/10 text-primary rounded-lg hover:bg-primary hover:text-primary-foreground transition-all"
                                            title="Save Changes"
                                        >
                                            <Save size={16} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 px-3 bg-secondary/10 text-secondary-foreground rounded-lg hover:bg-secondary hover:text-secondary-foreground transition-all"
                                            title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="text-sm font-black text-foreground uppercase tracking-wider">{port.name}</span>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => startEditing(port)}
                                                className="p-2 text-muted-foreground hover:text-primary transition-colors hover:bg-primary/5 rounded-lg"
                                                title="Edit Name"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeletePort(port.id)}
                                                className="p-2 text-muted-foreground hover:text-destructive transition-colors hover:bg-destructive/5 rounded-lg"
                                                title="Delete Port"
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
