'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
    FileText, Printer, ChevronLeft, Download,
    Ship, User, MapPin, Calendar, Hash,
    Package, Info, CreditCard, Building2,
    CheckCircle2, Clock, AlertCircle, DollarSign, ArrowRightLeft
} from 'lucide-react';

interface InvoiceItem {
    id: number;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
    taxPercentage: number;
    taxAmount: number;
    total: number;
}

interface Invoice {
    id: number;
    invoiceNumber: string;
    date: string;
    status: string;
    type: string;
    category: 'SERVICE' | 'FREIGHT';
    totalAmount: number;
    taxAmount: number;
    grandTotal: number;
    currencyCode: string;
    usdRate?: number;
    exchangeRate?: number;
    isApproved: boolean;
    customer: {
        name: string;
        code: string;
        email: string | null;
        phone: string | null;
        address: string | null;
    };
    job: {
        id: number;
        jobNumber: string;
        jobType: string;
        vessel: string | null;
        gdNo: string | null;
        containerNo: string | null;
        hawbBl: string | null;
    } | null;
    items: InvoiceItem[];
    company: {
        name: string;
        address: string | null;
        phone: string | null;
        email: string | null;
        taxNumber: string | null;
        logo: string | null;
    };
}

export default function InvoiceViewPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const searchParams = useSearchParams();
    const category = searchParams.get('category');
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const url = `/api/invoices/${id}${category ? `?category=${category}` : ''}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setInvoice(data.invoice);
                } else {
                    console.error('Failed to fetch invoice');
                }
            } catch (err) {
                console.error('Error fetching invoice:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchInvoice();
    }, [id, category]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
        </DashboardLayout>
    );

    if (!invoice) return (
        <DashboardLayout>
            <div className="text-center py-20 bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] max-w-4xl mx-auto">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-black text-white">Invoice Not Found</h1>
                <button onClick={() => router.push('/invoices')} className="mt-4 text-blue-400 font-bold uppercase tracking-widest text-sm underline">Back to Invoices</button>
            </div>
        </DashboardLayout>
    );

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto">
                {/* Actions Header - Hidden on Print */}
                <div className="flex items-center justify-between mb-8 print:hidden">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={16} />
                        Back
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="bg-slate-900 border border-slate-800 text-white px-6 py-3 rounded-2xl font-black transition-all hover:bg-slate-800 flex items-center gap-2 text-xs uppercase tracking-widest shadow-xl"
                        >
                            <Printer size={18} />
                            Print Invoice
                        </button>
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20">
                            <Download size={18} />
                            PDF
                        </button>
                    </div>
                </div>

                {/* Main Invoice Card */}
                <div className="bg-white text-slate-900 rounded-[2rem] overflow-hidden shadow-2xl print:shadow-none print:rounded-none">
                    {/* Header: Company & Invoice Info */}
                    {/* Header: Company & Invoice Info */}
                    <div className="bg-slate-50/50 border-b-2 border-slate-100">
                        {/* Centered Company Info */}
                        <div className="p-6 text-center border-b border-slate-100 flex flex-col items-center">
                            {invoice.company.logo ? (
                                <img src={invoice.company.logo} alt="Logo" className="h-20 mb-4" />
                            ) : (
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">L</div>
                                    <span className="text-3xl font-black tracking-tighter uppercase italic text-blue-900">{invoice.company.name}</span>
                                </div>
                            )}
                            <div className="space-y-1 text-slate-500 text-sm">
                                <p className="font-bold flex items-center justify-center gap-2"><MapPin size={14} /> {invoice.company.address || 'Address Not Set'}</p>
                                <p className="font-bold flex items-center justify-center gap-2"><Building2 size={14} /> {invoice.company.email} | {invoice.company.phone}</p>
                                {invoice.company.taxNumber && (
                                    <p className="font-black text-[10px] text-blue-600 uppercase tracking-widest mt-2">NTN: {invoice.company.taxNumber}</p>
                                )}
                            </div>
                        </div>

                        {/* Invoice Metadata Bar */}
                        <div className="p-6 flex justify-between items-end bg-white">
                            <div className="flex flex-col items-start gap-1">
                                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${(invoice.category === 'FREIGHT' || invoice.invoiceNumber.startsWith('TRK') || invoice.invoiceNumber.startsWith('FIN'))
                                    ? 'bg-purple-600/10 text-purple-600 border-purple-600/20'
                                    : 'bg-blue-600/10 text-blue-600 border-blue-600/20'
                                    }`}>
                                    {(invoice.category === 'FREIGHT' || invoice.invoiceNumber.startsWith('TRK') || invoice.invoiceNumber.startsWith('FIN')) ? 'TRUCKING BILL' : 'TAX INVOICE'}
                                </span>
                                <h1 className="text-4xl font-black text-slate-200 tracking-tighter leading-none uppercase italic">
                                    {(invoice.category === 'FREIGHT' || invoice.invoiceNumber.startsWith('TRK') || invoice.invoiceNumber.startsWith('FIN')) ? 'TRUCKING BILL' : 'SALES TAX INVOICE'}
                                </h1>
                            </div>
                            <div className="text-right space-y-2">
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Invoice Number</p>
                                    <p className="text-xl font-black font-mono text-slate-900">{invoice.invoiceNumber}</p>
                                </div>
                                <div className="flex justify-end gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Issue Date</p>
                                        <p className="font-black text-slate-700">{new Date(invoice.date).toLocaleDateString()}</p>
                                    </div>
                                    {invoice.job && (
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Job Number</p>
                                            <p className="font-black text-slate-900"># {invoice.job.jobNumber}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details */}
                    <div className="p-6 grid grid-cols-2 gap-6 bg-white">
                        <div>
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] mb-4 border-b pb-2 border-blue-50/50">Bill To</p>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">{invoice.customer.name}</h3>
                            <div className="space-y-1 text-slate-500 text-sm font-bold">
                                <p>{invoice.customer.address}</p>
                                <p>{invoice.customer.email}</p>
                                <p>{invoice.customer.phone}</p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
                            {invoice.category === 'SERVICE' && invoice.job ? (
                                <>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 border-b pb-2 border-slate-200">Job Metadata</p>
                                    <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Vessel/Voyage</p>
                                            <p className="text-xs font-black text-slate-700">{invoice.job.vessel || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">GD Number</p>
                                            <p className="text-xs font-black text-slate-700">{invoice.job.gdNo || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">B/L / HAWB</p>
                                            <p className="text-xs font-black text-slate-700">{invoice.job.hawbBl || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Container #</p>
                                            <p className="text-xs font-black text-slate-700 font-mono tracking-tighter">{invoice.job.containerNo || 'N/A'}</p>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] text-purple-600 font-black uppercase tracking-[0.2em] mb-4 border-b pb-2 border-purple-50/50">Freight Rates</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 font-black uppercase">Freight Rate</span>
                                            <span className="text-sm font-black text-slate-900">$ {invoice.usdRate?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] text-slate-400 font-black uppercase">Exchange Rate</span>
                                            <span className="text-sm font-black text-slate-900">Rs. {invoice.exchangeRate?.toLocaleString()}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                                            <span className="text-[9px] text-slate-400 font-black uppercase">Total (PKR)</span>
                                            <span className="text-sm font-black text-purple-600">Rs. {((invoice.usdRate || 0) * (invoice.exchangeRate || 1)).toLocaleString()}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-6 pb-6">
                        <div className="rounded-3xl border border-slate-100 overflow-hidden">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest">Detail Description</th>
                                        <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-center">Qty</th>
                                        <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-right">Unit Rate</th>
                                        <th className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-right">
                                            {invoice.category === 'SERVICE' ? 'Amount (Excl. Tax)' : `Total (${invoice.currencyCode})`}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {invoice.items.map((item, idx) => (
                                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                                            <td className="px-4 py-2 font-bold text-slate-800 text-sm">{item.description}</td>
                                            <td className="px-4 py-2 text-center font-bold text-slate-600 text-sm">{item.quantity}</td>
                                            <td className="px-4 py-2 text-right font-mono text-slate-600 text-sm">{item.rate.toLocaleString()}</td>
                                            <td className="px-4 py-2 text-right font-black text-slate-900 text-sm">
                                                {invoice.category === 'SERVICE' ? item.amount.toLocaleString() : item.total.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-6 bg-slate-50/50 border-t-2 border-slate-100 grid grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 px-6">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Info size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none">Document Status</p>
                                    <p className="text-sm font-black text-blue-900 uppercase tracking-tighter">{invoice.isApproved ? 'Official Document' : 'Proforma / Draft'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Subtotal</span>
                                <span className="text-lg font-bold text-slate-600">{invoice.totalAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                    {invoice.category === 'SERVICE' ? 'Sales Tax (17%)' : 'WHT / Other Taxes'}
                                </span>
                                <span className="text-lg font-bold text-slate-600">{invoice.taxAmount.toLocaleString()}</span>
                            </div>
                            <div className={`flex justify-between items-center p-6 rounded-[2.5rem] shadow-xl ${invoice.category === 'SERVICE' ? 'bg-blue-600 shadow-blue-600/20 text-white' : 'bg-purple-600 shadow-purple-600/20 text-white'}`}>
                                <span className="text-[10px] text-blue-100 font-black uppercase tracking-[0.2em]">Grand Total ({invoice.currencyCode})</span>
                                <span className="text-3xl font-black italic tracking-tighter leading-none">{invoice.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signature */}
                    <div className="px-6 pb-6 pt-6 grid grid-cols-2">
                        <div className="self-end">
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Generated By System At</p>
                            <p className="text-xs font-black text-slate-400">{new Date().toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <div className="w-48 h-1 bg-slate-200 ml-auto mb-2" />
                            <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Authorized Signature</p>
                            <p className="text-[9px] text-slate-400 font-bold italic">This is a computer generated document and does not require a physical seal.</p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 0;
                    }
                    nav, button, .print\\:hidden {
                        display: none !important;
                    }
                    body {
                        background: white !important;
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    .max-w-5xl {
                        max-width: 210mm !important;
                        min-height: 297mm !important;
                        margin: 0 auto !important;
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </DashboardLayout >
    );
}
