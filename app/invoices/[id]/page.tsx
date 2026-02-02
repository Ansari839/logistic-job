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
    usdAmount?: number;
    costAccount?: { name: string; code: string };
    serviceCategory?: string;
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
        taxNumber: string | null;
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
    const [settings, setSettings] = useState<any>({});

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings/system');
                if (res.ok) {
                    const data = await res.json();
                    const settingsMap = data.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
                    setSettings(settingsMap);
                }
            } catch (error) {
                console.error('Failed to load settings', error);
            }
        };
        fetchSettings();
    }, []);

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
                        <div className="p-8 print:p-12 text-center border-b border-slate-100 flex flex-col items-center">
                            {invoice.company.logo ? (
                                <img src={invoice.company.logo} alt="Logo" className="h-24 print:h-16 mb-4 print:mb-2" />
                            ) : (
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-3xl font-black tracking-tighter uppercase italic text-blue-900">{invoice.company.name}</span>
                                </div>
                            )}
                            <div className="space-y-1 text-slate-500 text-xs">
                                <p className="font-bold flex items-center justify-center gap-2"><MapPin size={14} /> {invoice.company.address || 'Address Not Set'}</p>
                                <p className="font-bold flex items-center justify-center gap-2"><Building2 size={14} /> {invoice.company.email} | {invoice.company.phone}</p>
                                {invoice.company.taxNumber && (
                                    <p className="font-black text-xs text-blue-600 uppercase tracking-widest mt-2">NTN: {invoice.company.taxNumber}</p>
                                )}
                            </div>
                        </div>

                        {/* Invoice Metadata Bar */}
                        <div className="p-4 flex justify-between items-end bg-white border-b border-slate-100">
                            <div className="flex flex-col items-start gap-1">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none uppercase italic">
                                    {invoice.category === 'FREIGHT' ? 'FREIGHT INVOICE' : (invoice.invoiceNumber.startsWith('TRK') || (invoice as any).serviceCategory === 'TRUCKING') ? 'TRUCKING BILL' : 'SALES TAX INVOICE'}
                                </h1>
                            </div>
                            <div className="text-right space-y-1">
                                <div>
                                    <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Invoice Number</p>
                                    <p className="text-lg font-black font-mono text-slate-900">{invoice.invoiceNumber}</p>
                                </div>
                                <div className="flex justify-end gap-4">
                                    <div className="text-right">
                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest leading-none">Issue Date</p>
                                        <p className="text-xs font-black text-slate-700">{new Date(invoice.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Billing Details */}
                    <div className="p-4 print:p-8 grid grid-cols-2 gap-4 bg-white">
                        <div>
                            <p className="text-[9px] text-blue-600 font-black uppercase tracking-[0.2em] mb-2 border-b pb-1 border-blue-50/50">Bill To</p>
                            <h3 className="text-xl font-black text-slate-900 mb-1">{invoice.customer.name}</h3>
                            <div className="space-y-0.5 text-slate-500 text-xs font-bold">
                                <p>{invoice.customer.address}</p>
                                <p>{invoice.customer.email}</p>
                                <p>{invoice.customer.phone}</p>
                                <p className="text-blue-600 font-black uppercase text-[10px] mt-1">
                                    NTN: {invoice.customer.taxNumber || 'Not Provided'}
                                </p>
                            </div>
                        </div>
                        <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-center">
                            {invoice.job ? (
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
                                    {invoice.category === 'FREIGHT' && (
                                        <div className="mt-6 pt-4 border-t border-slate-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Exchange Rate</span>
                                                <span className="text-sm font-black text-slate-900">{invoice.exchangeRate?.toLocaleString()} PKR</span>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="text-[10px] text-purple-600 font-black uppercase tracking-[0.2em] mb-4 border-b pb-2 border-purple-50/50">Freight Rates</p>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-blue-600 font-black uppercase tracking-widest">Exchange Rate</span>
                                            <span className="text-sm font-black text-slate-900">{invoice.exchangeRate?.toLocaleString()} PKR</span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-4 pb-4">
                        <div className="border-2 border-slate-900 overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 text-white">
                                        <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-r border-slate-700">Detail Description</th>
                                        {invoice.category === 'FREIGHT' && (
                                            <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-right border-r border-slate-700">USD Amount</th>
                                        )}
                                        {invoice.category === 'SERVICE' && (
                                            <>
                                                <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-center border-r border-slate-700">Qty</th>
                                                <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-right border-r border-slate-700">Unit Rate</th>
                                            </>
                                        )}
                                        <th className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-right">
                                            {invoice.category === 'SERVICE' ? 'Amount' : `Amount (PKR)`}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-900">
                                    {(() => {
                                        const sortedItems = [...invoice.items].sort((a, b) => {
                                            const isAService = a.description.toLowerCase().includes('service charge');
                                            const isBService = b.description.toLowerCase().includes('service charge');
                                            if (isAService && !isBService) return 1;
                                            if (!isAService && isBService) return -1;
                                            return 0;
                                        });
                                        return Array.from({ length: Math.max(6, sortedItems.length) }).map((_, idx) => {
                                            const item = sortedItems[idx];
                                            return (
                                                <tr key={item?.id || `empty-${idx}`} className={`h-8 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                                    <td className="px-3 py-1 border-r-2 border-slate-900 font-bold text-slate-800 text-xs text-wrap max-w-[200px]">
                                                        {item?.description || ''}
                                                    </td>
                                                    {invoice.category === 'FREIGHT' && (
                                                        <td className="px-3 py-1 border-r-2 border-slate-900 text-right font-black text-blue-600 text-[10px]">
                                                            {item?.usdAmount ? `$ ${item.usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : ''}
                                                        </td>
                                                    )}
                                                    {invoice.category === 'SERVICE' && (
                                                        <>
                                                            <td className="px-3 py-1 border-r-2 border-slate-900 text-center font-bold text-slate-600 text-xs">
                                                                {item?.quantity || ''}
                                                            </td>
                                                            <td className="px-3 py-1 border-r-2 border-slate-900 text-right font-mono text-slate-600 text-[10px]">
                                                                {item?.rate?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || ''}
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="px-3 py-1 text-right font-black text-slate-900 text-xs">
                                                        {item ? (invoice.category === 'SERVICE' ? item.amount.toLocaleString() : item.total.toLocaleString()) : ''}
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Summary Footer */}
                    <div className="p-6 print:p-3 bg-slate-50/50 border-t-2 border-slate-100 grid grid-cols-2 gap-10 print:gap-4">
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
                            {invoice.taxAmount > 0 && (
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Subtotal</span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-400">{invoice.totalAmount.toLocaleString()}</span>
                                </div>
                            )}
                            {!(invoice.category === 'SERVICE' && ((invoice as any).serviceCategory === 'TRUCKING' || invoice.invoiceNumber.startsWith('TRK'))) && (
                                <div className="flex justify-between items-center px-4">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                                        {invoice.category === 'SERVICE' ? `Sales Tax (${settings.serviceTaxRate || '17'}%)` : 'WHT / Other Taxes'}
                                    </span>
                                    <span className="text-lg font-bold text-slate-900 dark:text-slate-400">{invoice.taxAmount.toLocaleString()}</span>
                                </div>
                            )}
                            <div className={`flex justify-between items-center p-6 rounded-[2.5rem] shadow-xl ${invoice.category === 'SERVICE' ? 'bg-blue-600 shadow-blue-600/20 text-white' : 'bg-purple-600 shadow-purple-600/20 text-white'}`}>
                                <span className="text-[10px] text-white/80 font-black uppercase tracking-[0.2em]">Grand Total ({invoice.currencyCode})</span>
                                <span className="text-3xl font-black italic tracking-tighter leading-none text-white">{invoice.grandTotal.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Authorized Signature */}
                    <div className="px-6 pb-6 pt-6 print:p-2 print:mt-12 grid grid-cols-2">
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

                    /* Hide all UI elements */
                    nav, button, header, aside, [role="complementary"] {
                        display: none !important;
                    }

                    /* Reset backgrounds */
                    html, body, main {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }

                    /* Force color printing */
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                        box-shadow: none !important;
                    }

                    /* Container */
                    .max-w-5xl {
                        max-width: 100% !important;
                        padding: 10mm !important;
                        margin: 0 !important;
                    }

                    /* Keep colors */
                    .bg-blue-600 { background-color: #2563eb !important; }
                    .bg-purple-600 { background-color: #9333ea !important; }
                    .bg-slate-800 { background-color: #1e293b !important; }
                    
                    .bg-blue-600 *, .bg-purple-600 *, .bg-slate-800 * {
                        color: white !important;
                    }
                }
            `}</style>
        </DashboardLayout >
    );
}
