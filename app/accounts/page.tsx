'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    BookOpen, Plus, Search, ChevronDown,
    ChevronRight, Folder, FileText,
    MoreVertical, Edit3, Trash2,
    PieChart, Layers, Info, Users, Building2
} from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    description: string | null;
    parentId: number | null;
    children?: Account[];
    _count?: { children: number };
}

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
    const [showModal, setShowModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [formData, setFormData] = useState({
        id: '',
        code: '',
        name: '',
        type: 'EXPENSE' as any,
        description: '',
        parentId: '',
        partnerDetails: {
            address: '',
            phone: '',
            email: '',
            taxNumber: '',
            type: '' as 'CUSTOMER' | 'VENDOR' | ''
        }
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts);
            }
        } catch (err) {
            console.error('Fetch accounts failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const fetchSuggestedCode = async () => {
            if (!formData.parentId || editingAccount) return;
            try {
                const res = await fetch(`/api/accounts?suggestCode=true&parentId=${formData.parentId}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.nextCode) {
                        setFormData(prev => ({ ...prev, code: data.nextCode }));
                    }
                }
            } catch (err) {
                console.error('Fetch suggested code failed');
            }
        };
        fetchSuggestedCode();
    }, [formData.parentId, editingAccount]);

    const buildTree = (list: Account[], parentId: number | null = null): Account[] => {
        return list
            .filter(a => a.parentId === parentId)
            .map(a => ({ ...a, children: buildTree(list, a.id) }));
    };

    const toggleExpand = (id: number) => {
        const next = new Set(expandedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setExpandedIds(next);
    };

    const handleSaveAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const method = editingAccount ? 'PATCH' : 'POST';
            const res = await fetch('/api/accounts', {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setShowModal(false);
                fetchAccounts();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to save account');
            }
        } catch (err) {
            console.error('Save account error:', err);
        }
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Are you sure you want to delete this account? This will check for children and transactions.')) return;
        try {
            const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchAccounts();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete account');
            }
        } catch (err) {
            console.error('Delete account error:', err);
        }
    };

    const tree = buildTree(accounts);

    const renderNode = (node: Account, depth: number = 0) => {
        const isExpanded = expandedIds.has(node.id);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div key={node.id} className="select-none">
                <div
                    className={`flex items-center group py-3 px-4 rounded-2xl transition-all ${depth === 0 ? 'glass-panel shadow-sm mb-2' : 'hover:bg-primary/5'
                        }`}
                    style={{ marginLeft: `${depth * 24}px` }}
                >
                    <button
                        onClick={() => hasChildren && toggleExpand(node.id)}
                        className={`p-1 rounded-lg transition-colors ${hasChildren ? 'text-slate-400 hover:text-white' : 'text-transparent cursor-default'}`}
                    >
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </button>

                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 ${node.type === 'ASSET' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        node.type === 'LIABILITY' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            node.type === 'REVENUE' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                        {hasChildren ? <Folder size={18} /> : <FileText size={18} />}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center gap-3">
                            <span className="text-slate-900 dark:text-white font-black tracking-tight">{node.name}</span>
                            <span className="text-[10px] font-black text-subtext uppercase tracking-widest bg-background px-2 py-0.5 rounded-full border border-border">
                                {node.code}
                            </span>
                        </div>
                        <p className="text-[10px] text-subtext font-bold uppercase tracking-wider">{node.type}</p>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <button
                            onClick={() => {
                                setEditingAccount(node);
                                setFormData({
                                    id: node.id.toString(),
                                    code: node.code,
                                    name: node.name,
                                    type: node.type,
                                    description: node.description || '',
                                    parentId: node.parentId?.toString() || '',
                                    partnerDetails: {
                                        address: '',
                                        phone: '',
                                        email: '',
                                        taxNumber: '',
                                        type: '' as '' | 'CUSTOMER' | 'VENDOR'
                                    }
                                });
                                setShowModal(true);
                            }}
                            className="p-2 rounded-xl bg-background border border-border text-subtext hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold"
                        >
                            <Edit3 size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setEditingAccount(null);
                                setFormData({
                                    id: '',
                                    code: '',
                                    name: '',
                                    type: node.type,
                                    description: '',
                                    parentId: node.id.toString(),
                                    partnerDetails: {
                                        address: '',
                                        phone: '',
                                        email: '',
                                        taxNumber: '',
                                        type: '' as '' | 'CUSTOMER' | 'VENDOR'
                                    }
                                });
                                setShowModal(true);
                            }}
                            className="p-2 rounded-xl bg-background border border-border text-subtext hover:text-emerald-600 dark:hover:text-emerald-400 transition-all font-bold"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => handleDeleteAccount(node.id)}
                            className="p-2 rounded-xl bg-background border border-border text-subtext hover:text-red-600 dark:hover:text-red-400 transition-all font-bold"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
                {isExpanded && hasChildren && (
                    <div className="animate-in slide-in-from-top-1 duration-200">
                        {node.children!.map(child => renderNode(child, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Chart of Accounts</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Financial Structure & Hierarchy</p>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 glass-panel text-subtext px-6 py-4 rounded-[2rem] font-black transition-all hover:bg-primary/5 hover:text-slate-900 dark:hover:text-white text-xs uppercase tracking-widest shadow-xl">
                            <Layers size={18} />
                            Full Expand
                        </button>
                        <button
                            onClick={() => {
                                setEditingAccount(null);
                                setFormData({
                                    id: '', code: '', name: '', type: 'ASSET', description: '', parentId: '',
                                    partnerDetails: {
                                        address: '',
                                        phone: '',
                                        email: '',
                                        taxNumber: '',
                                        type: '' as '' | 'CUSTOMER' | 'VENDOR'
                                    }
                                });
                                setShowModal(true);
                            }}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-[2rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-blue-600/20"
                        >
                            <Plus size={20} />
                            New Account
                        </button>
                    </div>
                </div>

                {/* Search & Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-subtext group-focus-within:text-blue-600 dark:group-focus-within:text-blue-500 transition-colors" size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, code or type..."
                                className="glass-input w-full rounded-[2.5rem] py-5 pl-16 pr-8 text-slate-900 dark:text-white font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 dark:from-indigo-600/20 dark:to-blue-600/20 border border-blue-500/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Total Accounts</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{accounts.length}</p>
                        </div>
                        <PieChart size={32} className="text-blue-600 dark:text-blue-400 opacity-50" />
                    </div>
                </div>

                {/* Tree View */}
                <div className="glass-panel rounded-[2.5rem] p-8 space-y-2">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center">
                            <div className="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4" />
                            <p className="text-subtext font-black uppercase tracking-widest text-[10px]">Loading Hierarchy...</p>
                        </div>
                    ) : tree.length === 0 ? (
                        <div className="py-20 text-center">
                            <BookOpen size={48} className="text-slate-300 dark:text-slate-800 mx-auto mb-4" />
                            <p className="text-subtext font-bold uppercase tracking-widest text-sm">No accounts configured</p>
                        </div>
                    ) : (
                        tree.map(node => renderNode(node))
                    )}
                </div>

                {/* Info Card */}
                <div className="glass-card shadow-sm p-8 flex items-start gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-subtext flex-shrink-0 border border-border">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tight mb-2">Hierarchy Management</h4>
                        <p className="text-subtext text-sm font-medium leading-relaxed">
                            Use the Chart of Accounts to define your financial reporting structure. Parent accounts act as headers (aggregators), while child accounts are used for direct transaction entries.
                        </p>
                    </div>
                </div>
                {/* Management Modal */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                        <div className="relative glass-panel w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-border">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{editingAccount ? 'Edit Account' : 'New Account'}</h3>
                                <p className="text-subtext text-xs font-bold uppercase tracking-widest mt-1">Manage Financial Structure</p>
                            </div>
                            <form onSubmit={handleSaveAccount} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Account Code</label>
                                        <input
                                            required
                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="e.g. 1000"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Type</label>
                                        <select
                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-black uppercase tracking-widest"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                                        >
                                            <option value="ASSET">Asset</option>
                                            <option value="LIABILITY">Liability</option>
                                            <option value="EQUITY">Equity</option>
                                            <option value="REVENUE">Revenue</option>
                                            <option value="EXPENSE">Expense</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Account Name</label>
                                    <input
                                        required
                                        className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Cash in Hand"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Parent Account</label>
                                    <select
                                        className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold"
                                        value={formData.parentId}
                                        onChange={e => {
                                            const pid = e.target.value;
                                            const parent = accounts.find(a => a.id === parseInt(pid));
                                            setFormData({
                                                ...formData,
                                                parentId: pid,
                                                type: parent ? parent.type : formData.type
                                            });
                                        }}
                                    >
                                        <option value="">Root Account (No Parent)</option>
                                        {accounts.filter(a => a.id !== parseInt(formData.id)).map(a => (
                                            <option key={a.id} value={a.id}>({a.code}) {a.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Description</label>
                                    <textarea
                                        rows={2}
                                        className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                {/* Dynamic Partner Form Logic */}
                                {(() => {
                                    const parent = accounts.find(a => a.id.toString() === formData.parentId);
                                    const isCustomer = parent?.code === '1230'; // Accounts Receivable
                                    const isVendor = parent?.code === '2210';   // Accounts Payable

                                    if (isCustomer || isVendor) {
                                        return (
                                            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-4 animate-in slide-in-from-top-4">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                                        {isCustomer ? <Users size={20} /> : <Building2 size={20} />}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{isCustomer ? 'Customer' : 'Vendor'} Details</h4>
                                                        <p className="text-[10px] text-subtext font-bold uppercase tracking-widest">Additional info for Partner Registry</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Tax Number (NTN)</label>
                                                        <input
                                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs font-bold"
                                                            placeholder="NTN-..."
                                                            onChange={e => setFormData({ ...formData, partnerDetails: { ...formData.partnerDetails, taxNumber: e.target.value, type: isCustomer ? 'CUSTOMER' : 'VENDOR' } } as any)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Phone</label>
                                                        <input
                                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs font-bold"
                                                            placeholder="+92..."
                                                            onChange={e => setFormData({ ...formData, partnerDetails: { ...formData.partnerDetails, phone: e.target.value, type: isCustomer ? 'CUSTOMER' : 'VENDOR' } } as any)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Email</label>
                                                        <input
                                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs font-bold"
                                                            placeholder="Email Address"
                                                            onChange={e => setFormData({ ...formData, partnerDetails: { ...formData.partnerDetails, email: e.target.value, type: isCustomer ? 'CUSTOMER' : 'VENDOR' } } as any)}
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-2">
                                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Address</label>
                                                        <textarea
                                                            rows={2}
                                                            className="glass-input w-full rounded-2xl px-4 py-3 text-slate-900 dark:text-white text-xs font-medium resize-none"
                                                            placeholder="Full Business Address"
                                                            onChange={e => setFormData({ ...formData, partnerDetails: { ...formData.partnerDetails, address: e.target.value, type: isCustomer ? 'CUSTOMER' : 'VENDOR' } } as any)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 px-6 py-4 rounded-2xl border border-border text-subtext font-bold uppercase tracking-widest text-xs hover:bg-primary/5 hover:text-slate-900 dark:hover:text-white transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95"
                                    >
                                        {editingAccount ? 'Update Account' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
