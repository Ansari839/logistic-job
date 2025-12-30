'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    Box, Plus, Search, Filter,
    MoreVertical, Edit, Trash2,
    BarChart3, ArrowRight, Package,
    Loader2, Tag, Database,
    AlertTriangle, TrendingUp, DollarSign
} from 'lucide-react';

interface Product {
    id: number;
    sku: string | null;
    name: string;
    unit: string;
    purchasePrice: number;
    sellingPrice: number;
    category: { name: string };
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
        purchasePrice: '', sellingPrice: '', initialStock: '0'
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
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Inventory Registry</h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-[0.2em] mt-1">Animal Feed Stock Management</p>
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
                    {[
                        { label: 'Total Products', value: stats.totalItems, icon: Database, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                        { label: 'Total Valuation', value: `${stats.totalValuation.toLocaleString()} PKR`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Low Stock Items', value: stats.lowStock, icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                    ].map((stat, i) => (
                        <div key={i} className={`p-8 rounded-[2.5rem] border border-white/5 bg-slate-900/40 relative overflow-hidden group`}>
                            <div className={`absolute top-0 right-0 p-10 ${stat.bg} rounded-bl-[5rem] group-hover:scale-110 transition-transform`}>
                                <stat.icon className={stat.color} size={32} />
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                            <h3 className="text-3xl font-black text-white tracking-tighter">{stat.value}</h3>
                        </div>
                    ))}
                </div>

                {/* Product List */}
                <div className="bg-slate-900/40 border border-slate-800/60 rounded-[3rem] overflow-hidden">
                    <div className="p-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                            <input
                                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Search products, SKU or category..."
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 hover:text-white transition-all">
                                <Filter size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-950/40">
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Product Details</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Category</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Unit</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Purchase (PKR)</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Selling (PKR)</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Loader2 className="animate-spin text-indigo-500 mx-auto mb-4" size={32} />
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Warehouse Data...</p>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center">
                                            <Package className="w-16 h-16 text-slate-800 mx-auto mb-4" />
                                            <h3 className="text-xl font-black text-white">No Products Registered</h3>
                                            <p className="text-slate-500 text-sm mt-1">Start by adding your first animal feed item.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-white">{product.name}</span>
                                                    <span className="text-[10px] font-bold text-slate-500 font-mono tracking-widest">{product.sku || 'NO SKU'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="text-xs font-black text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full">{product.category.name}</span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-medium text-slate-400 uppercase">{product.unit}</td>
                                            <td className="px-8 py-5 text-right font-black text-white">{product.purchasePrice.toLocaleString()}</td>
                                            <td className="px-8 py-5 text-right font-black text-white">{product.sellingPrice.toLocaleString()}</td>
                                            <td className="px-8 py-5 text-right">
                                                <button className="p-2 text-slate-600 hover:text-white transition-colors">
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

                {/* Combined Modals implementation... */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-indigo-600 text-white">
                                <h3 className="text-3xl font-black italic tracking-tighter uppercase">Register Feed Product</h3>
                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Central Asset Cataloging</p>
                            </div>
                            <form onSubmit={handleCreateProduct} className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                                        <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SKU / Code</label>
                                        <input className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono"
                                            value={productForm.sku} onChange={e => setProductForm({ ...productForm, sku: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category</label>
                                        <select required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold"
                                            value={productForm.categoryId} onChange={e => setProductForm({ ...productForm, categoryId: e.target.value })}>
                                            <option value="">Select Category...</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Purchase Rate</label>
                                        <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black"
                                            value={productForm.purchasePrice} onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selling Rate</label>
                                        <input type="number" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black"
                                            value={productForm.sellingPrice} onChange={e => setProductForm({ ...productForm, sellingPrice: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Base Unit</label>
                                        <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold"
                                            value={productForm.unit} onChange={e => setProductForm({ ...productForm, unit: e.target.value })}>
                                            <option value="bags">Bags (50kg)</option>
                                            <option value="kg">Kilograms</option>
                                            <option value="ton">Metric Ton</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Initial Opening Stock</label>
                                        <input type="number" className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white font-black"
                                            value={productForm.initialStock} onChange={e => setProductForm({ ...productForm, initialStock: e.target.value })} />
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-5 rounded-3xl border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-xs">Cancel</button>
                                    <button type="submit" className="flex-1 bg-indigo-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all active:scale-95">Register Item</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showCategoryModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowCategoryModal(false)} />
                        <div className="relative bg-slate-900 border border-slate-800 w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
                            <div className="p-8 border-b border-white/5 bg-slate-800 text-white">
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter">New Stock Category</h3>
                            </div>
                            <form onSubmit={handleCreateCategory} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Category Name</label>
                                    <input required className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white"
                                        value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Description</label>
                                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white h-32"
                                        value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
                                </div>
                                <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl text-sm uppercase tracking-widest shadow-xl transition-all">Create Category</button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
