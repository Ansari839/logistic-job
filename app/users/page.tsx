'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Users, Plus, Edit3, Trash2, Search, Loader2, Shield } from 'lucide-react';

interface User {
    id: number;
    email: string;
    name: string | null;
    role: 'ADMIN' | 'ACCOUNTS' | 'OPERATOR' | 'SALES';
    branch: string | null;
    department: string | null;
    region: string | null;
    division: string | null;
    createdAt: string;
    updatedAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        name: '',
        password: '',
        role: 'OPERATOR' as 'ADMIN' | 'ACCOUNTS' | 'OPERATOR' | 'SALES',
        branch: '',
        department: '',
        region: '',
        division: 'logistics',
    });

    useEffect(() => {
        fetchUsers();
    }, [search]);

    const fetchUsers = async () => {
        try {
            const res = await fetch(`/api/users?search=${search}`);
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
            const method = editingUser ? 'PATCH' : 'POST';

            // Clean payload
            const payload: any = { ...formData };
            if (editingUser) {
                delete payload.email; // Email usually not editable
                if (!payload.password) delete payload.password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                await fetchUsers();
                setShowModal(false);
                resetForm();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Failed to save user');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchUsers();
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to delete user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            name: user.name || '',
            password: '',
            role: user.role,
            branch: user.branch || '',
            department: user.department || '',
            region: user.region || '',
            division: user.division || 'logistics',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingUser(null);
        setFormData({
            email: '',
            name: '',
            password: '',
            role: 'OPERATOR',
            branch: '',
            department: '',
            region: '',
            division: 'logistics',
        });
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'ACCOUNTS': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'SALES': return 'bg-green-500/20 text-green-400 border-green-500/30';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-[1400px] mx-auto min-h-screen pb-10">
                {/* Header */}
                <div className="glass-panel mb-6 p-6 shadow-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center border border-blue-500/20">
                                <Users size={28} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-heading tracking-tight uppercase">
                                    User Management
                                </h1>
                                <p className="text-sm text-muted-foreground font-medium">Manage system users and permissions</p>
                            </div>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowModal(true); }}
                            className="glass-button flex items-center gap-2"
                        >
                            <Plus size={20} />
                            Add User
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="glass-card p-4 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 glass-input placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="glass-card overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="animate-spin text-blue-500" size={40} />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-20 text-slate-500">
                            <Users size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-semibold">No users found</p>
                            <p className="text-sm">Add your first user to get started</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-secondary/50 border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Name</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Email</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Role</th>
                                        <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-muted-foreground">Branch</th>
                                        <th className="px-6 py-4 text-right text-xs font-black uppercase tracking-widest text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                                        <span className="text-blue-400 font-bold text-sm">
                                                            {user.name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-foreground">{user.name || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{user.branch || '-'}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="p-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                                                        title="Edit User"
                                                    >
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id)}
                                                        className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* User Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="glass-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-border">
                                <h2 className="text-2xl font-black text-heading uppercase tracking-tight">
                                    {editingUser ? 'Edit User' : 'Add New User'}
                                </h2>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            disabled={!!editingUser}
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full glass-input disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">
                                            Password {editingUser ? '(leave blank to keep current)' : '*'}
                                        </label>
                                        <input
                                            type="password"
                                            required={!editingUser}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Role *</label>
                                        <select
                                            required
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                            className="w-full glass-input"
                                        >
                                            <option className="bg-card text-foreground" value="OPERATOR">Operator</option>
                                            <option className="bg-card text-foreground" value="SALES">Sales</option>
                                            <option className="bg-card text-foreground" value="ACCOUNTS">Accounts</option>
                                            <option className="bg-card text-foreground" value="ADMIN">Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Branch</label>
                                        <input
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Department</label>
                                        <input
                                            type="text"
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-muted-foreground mb-2">Region</label>
                                        <input
                                            type="text"
                                            value={formData.region}
                                            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                                            className="w-full glass-input"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); resetForm(); }}
                                        className="glass-button-secondary flex-1"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="glass-button flex-1"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : null}
                                        {editingUser ? 'Update User' : 'Create User'}
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
