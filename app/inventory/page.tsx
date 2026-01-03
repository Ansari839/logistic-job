'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Box, Plus, Search, Filter,
    MoreVertical, Edit, Trash2,
    BarChart3, ArrowRight, Package,
    Loader2, Tag, Database,
    AlertTriangle, TrendingUp, DollarSign,
    Layers, AlertCircle
} from 'lucide-react';

interface Product {
    id: number;
    sku: string | null;
    name: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    costPrice: number;
    currentStock: number;
    category: { name: string };
    categoryId: number;
}

interface Category {
    id: number;
    name: string;
}

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [stats, setStats] = useState({ totalItems: 0, totalValuation: 0, lowStock: 0 });
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Form States
    const [productForm, setProductForm] = useState({
        name: '', sku: '', categoryId: '', unit: 'bags',
        purchasePrice: '', sellingPrice: '', costPrice: '', initialStock: '0'
    });
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes, stockRes] = await Promise.all([
                fetch('/api/inventory/products'),
                fetch('/api/inventory/categories'),
                fetch('/api/inventory/stock')
            ]);

            if (prodRes.ok) {
                const data = await prodRes.json();
                setProducts(data.products);
            }
            if (catRes.ok) {
                const data = await catRes.json();
                setCategories(data.categories);
            }
            if (stockRes.ok) {
                const data = await stockRes.json();
                setStats({
                    totalItems: data.report.length,
                    totalValuation: data.totalValuation,
                    lowStock: data.report.filter((i: any) => i.currentStock < 10).length
                });
            }
        } catch (err) {
            console.error('Fetch data failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/inventory/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...productForm,
                    categoryId: parseInt(productForm.categoryId),
                    purchasePrice: parseFloat(productForm.purchasePrice),
                    sellingPrice: parseFloat(productForm.sellingPrice),
                    costPrice: parseFloat(productForm.costPrice),
                    initialStock: parseFloat(productForm.initialStock)
                }),
            });
            if (res.ok) {
                setShowAddModal(false);
                fetchData();
            }
        } catch (err) {
            console.error('Create product failed');
        }
    };

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/inventory/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(categoryForm),
            });
            if (res.ok) {
                setShowCategoryModal(false);
                fetchData();
            }
        } catch (err) {
            console.error('Create category failed');
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Inventory Registry</h1>
                        <p className="text-subtext text-sm font-bold uppercase tracking-[0.2em] mt-1">Product & Category Management</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowCategoryModal(true)}
                            className="bg-slate-900 border border-slate-800 text-slate-400 px-6 py-4 rounded-[2rem] font-black transition-all hover:bg-slate-800 hover:text-white text-xs uppercase tracking-widest flex items-center gap-2"
                        >
                            <Tag size={18} />
                            Add Category
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-[2.5rem] font-black transition-all flex items-center gap-2 text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20"
                        >
                            <Plus size={20} />
                            Register Product
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600/10 to-blue-600/10 dark:from-indigo-600/20 dark:to-blue-600/20 border border-blue-500/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-1">Total Products</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{stats.totalItems}</p>
                        </div>
                        <Package size={32} className="text-indigo-600 dark:text-indigo-400 opacity-50" />
                    </div>
                    <div className="bg-gradient-to-br from-emerald-600/10 to-teal-600/10 dark:from-emerald-600/20 dark:to-teal-600/20 border border-emerald-500/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">Total Categories</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{categories.length}</p>
                        </div>
                        <Layers size={32} className="text-emerald-600 dark:text-emerald-400 opacity-50" />
                    </div>
                    <div className="bg-gradient-to-br from-amber-600/10 to-orange-600/10 dark:from-amber-600/20 dark:to-orange-600/20 border border-amber-500/20 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-1">Low Stock Items</p>
                            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter text-amber-600 dark:text-amber-400">{stats.lowStock}</p>
                        </div>
                        <AlertCircle size={32} className="text-amber-600 dark:text-amber-400 opacity-50" />
                    </div>
                </div>

                {/* Product List */}
                <div className="glass-panel overflow-hidden">
                    <div className="p-8 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-subtext" size={18} />
                            <input
                                className="glass-input w-full rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search products, SKU or category..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-3 glass-button rounded-xl text-subtext hover:text-primary transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-primary/5">
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Item Info</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Pricing</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest">Stock</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-subtext uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center"> {/* Adjusted colSpan */}
                                            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                            <p className="text-subtext font-bold uppercase tracking-widest text-xs">Accessing Warehouse Data...</p>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-20 text-center"> {/* Adjusted colSpan */}
                                            <Package className="w-16 h-16 text-border mx-auto mb-4" /> {/* Changed text-slate-800 to text-border */}
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">No Products Registered</h3> {/* Changed text-white */}
                                            <p className="text-subtext text-sm mt-1">Start by adding your first animal feed item.</p> {/* Changed text-slate-500 */}
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((p) => ( // Changed product to p
                                        <tr key={p.id} className="hover:bg-primary/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-white font-black tracking-tight">{p.name}</span>
                                                    <span className="text-[10px] font-black text-subtext uppercase tracking-widest">{p.sku || 'NO SKU'}</span> {/* Added || 'NO SKU' */}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-background border border-border text-subtext text-[10px] font-black rounded-full uppercase tracking-widest">
                                                    {p.category.name}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-900 dark:text-white font-bold text-sm">Sell: {p.sellingPrice.toLocaleString()} PKR</span>
                                                    <span className="text-subtext text-[10px]">Cost: {p.purchasePrice.toLocaleString()} PKR</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${p.currentStock > 10 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`} />
                                                    <span className="text-slate-900 dark:text-white font-black text-sm">{p.currentStock} {p.unit}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 text-subtext hover:text-primary transition-colors">
                                                    <MoreVertical size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modals */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <div className="relative glass-panel w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-border bg-indigo-600 text-white">
                                <h3 className="text-2xl font-black italic tracking-tighter uppercase">Product Registration</h3>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1">Stock Master Entry</p>
                            </div>
                            <form onSubmit={handleCreateProduct} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Product Name</label>
                                        <input required className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">SKU / Code</label>
                                        <input
                                            required
                                            className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={productForm.sku}
                                            onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Category</label>
                                        <select
                                            required
                                            className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold text-xs uppercase"
                                            value={productForm.categoryId}
                                            onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}
                                        >
                                            <option value="">Select Category...</option>
                                            {categories.map(c => <option key={c.id} value={c.id.toString()}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Purchase Rate</label>
                                        <input type="number" required className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black"
                                            value={productForm.purchasePrice} onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Selling Rate</label>
                                        <input type="number" required className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black"
                                            value={productForm.sellingPrice} onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Cost Price</label>
                                        <input type="number" required className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black"
                                            value={productForm.costPrice} onChange={e => setProductForm({ ...productForm, costPrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Base Unit</label>
                                        <select className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold"
                                            value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })}>
                                            <option value="bags">Bags (50kg)</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="ton">Metric Ton</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Initial Opening Stock</label>
                                        <input type="number" className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-black"
                                            value={productForm.initialStock} onChange={e => setProductForm({ ...productForm, initialStock: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-5 rounded-3xl border border-border text-subtext font-black uppercase tracking-widest text-xs hover:bg-primary/5 transition-all">Cancel</button>
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Register Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCategoryModal(false)} />
                        <div className="relative glass-panel w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                            <div className="p-8 border-b border-border bg-emerald-600 text-white">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">New Stock Category</h3>
                            </div>
                            <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Category Name</label>
                                    <input
                                        required
                                        className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={categoryForm.name}
                                        onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-subtext uppercase tracking-widest ml-1">Description</label>
                                    <textarea className="glass-input w-full rounded-xl px-4 py-3 text-slate-900 dark:text-white h-32"
                                        value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all active:scale-95">Create Category</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
