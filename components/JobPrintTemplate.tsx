'use client';

import React from 'react';

interface Expense {
    id: number;
    description: string;
    costPrice: number;
    sellingPrice: number;
    currencyCode: string;
    vendor: { id: number; name: string; code: string } | null;
}

interface Job {
    id: number;
    jobNumber: string;
    createdAt: string;
    jobType: 'IMPORT' | 'EXPORT';
    customerId: number;
    customer: { name: string; code: string; email: string | null };
    vessel: string | null;
    commodity: string | null;
    containerNo: string | null;
    gdNo: string | null;
    hawbBl: string | null;
    expenses: Expense[];
    place?: string;
    shipperRef?: string;
    formE?: string;
    volume?: string;
    packages?: number;
    weight?: number;
    handledBy?: string;
    salesPerson?: string;
    jobDate?: string;
    gdDate?: string;
    formEDate?: string;
    pod?: { name: string } | null;
    status: 'DRAFT' | 'IN_PROGRESS' | 'CLOSED';
}

interface JobPrintTemplateProps {
    job: Job;
}

export default function JobPrintTemplate({ job }: JobPrintTemplateProps) {
    const totalCost = job.expenses.reduce((sum, e) => sum + e.costPrice, 0);
    const totalSelling = job.expenses.reduce((sum, e) => sum + e.sellingPrice, 0);
    const profit = totalSelling - totalCost;
    const margin = totalSelling > 0 ? (profit / totalSelling) * 100 : 0;

    return (
        <div className="bg-white text-black p-8 max-w-[210mm] mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4;
                        margin: 15mm;
                    }
                    
                    * {
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    body {
                        background: white;
                    }
                    
                    .page-break-avoid {
                        page-break-inside: avoid;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="border-b-4 border-blue-600 pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-black text-blue-600 uppercase tracking-tight">LogisticOS</h1>
                        <p className="text-sm text-gray-600 mt-1">Freight Forwarding & Logistics Solutions</p>
                        <p className="text-xs text-gray-500 mt-1">Email: info@logisticos.com | Phone: +92-XXX-XXXXXXX</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-2xl font-black uppercase tracking-tight">Job Sheet</h2>
                        <p className="text-sm font-bold text-gray-600 mt-1">Job #: {job.jobNumber}</p>
                        <p className="text-xs text-gray-500">Date: {new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
            </div>

            {/* Job Information */}
            <div className="mb-6 page-break-avoid">
                <h3 className="text-lg font-black uppercase border-b-2 border-gray-300 pb-2 mb-4">Job Information</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Customer:</span>
                        <span className="text-gray-900">{job.customer.name}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Job Date:</span>
                        <span className="text-gray-900">{job.jobDate ? new Date(job.jobDate).toLocaleDateString() : '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Job Type:</span>
                        <span className="text-gray-900 font-bold">{job.jobType}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Status:</span>
                        <span className="text-gray-900">{job.status}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Vessel:</span>
                        <span className="text-gray-900">{job.vessel || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">POD:</span>
                        <span className="text-gray-900">{job.pod?.name || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Commodity:</span>
                        <span className="text-gray-900">{job.commodity || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">{job.jobType === 'EXPORT' ? 'Booking No.' : 'B/L No.'}:</span>
                        <span className="text-gray-900">{job.hawbBl || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">G.D No.:</span>
                        <span className="text-gray-900">{job.gdNo || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Packages:</span>
                        <span className="text-gray-900">{job.packages || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Handled By:</span>
                        <span className="text-gray-900">{job.handledBy || '-'}</span>
                    </div>
                    <div className="flex">
                        <span className="font-bold text-gray-700 w-32">Sales Person:</span>
                        <span className="text-gray-900">{job.salesPerson || '-'}</span>
                    </div>
                </div>

                {job.containerNo && (
                    <div className="mt-4">
                        <span className="font-bold text-gray-700">Containers:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {job.containerNo.split(',').map((c, i) => (
                                <span key={i} className="px-3 py-1 bg-gray-100 border border-gray-300 rounded text-sm font-mono">
                                    {c.trim()}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Expense Breakdown */}
            <div className="mb-6 page-break-avoid">
                <h3 className="text-lg font-black uppercase border-b-2 border-gray-300 pb-2 mb-4">Expense Breakdown</h3>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 px-3 py-2 text-left font-bold">#</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-bold">Description</th>
                            <th className="border border-gray-300 px-3 py-2 text-left font-bold">Vendor</th>
                            <th className="border border-gray-300 px-3 py-2 text-right font-bold">Cost (PKR)</th>
                            <th className="border border-gray-300 px-3 py-2 text-right font-bold">Selling (PKR)</th>
                            <th className="border border-gray-300 px-3 py-2 text-right font-bold">Profit (PKR)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {job.expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="border border-gray-300 px-3 py-4 text-center text-gray-500">
                                    No expenses recorded
                                </td>
                            </tr>
                        ) : (
                            job.expenses.map((exp, idx) => (
                                <tr key={exp.id}>
                                    <td className="border border-gray-300 px-3 py-2">{idx + 1}</td>
                                    <td className="border border-gray-300 px-3 py-2">{exp.description}</td>
                                    <td className="border border-gray-300 px-3 py-2">{exp.vendor?.name || '-'}</td>
                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                        {exp.costPrice.toLocaleString()}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                        {exp.sellingPrice.toLocaleString()}
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2 text-right font-mono font-bold">
                                        {(exp.sellingPrice - exp.costPrice).toLocaleString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {job.expenses.length > 0 && (
                        <tfoot>
                            <tr className="bg-gray-100 font-bold">
                                <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right">TOTAL</td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                    {totalCost.toLocaleString()}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-mono">
                                    {totalSelling.toLocaleString()}
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-mono text-blue-600">
                                    {profit.toLocaleString()}
                                </td>
                            </tr>
                            <tr className="bg-gray-50">
                                <td colSpan={5} className="border border-gray-300 px-3 py-2 text-right font-bold">
                                    Profit Margin:
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-right font-mono font-bold text-blue-600">
                                    {margin.toFixed(2)}%
                                </td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 mb-8 page-break-avoid">
                <div className="border-2 border-gray-300 p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Cost</p>
                    <p className="text-xl font-black text-red-600">{totalCost.toLocaleString()} PKR</p>
                </div>
                <div className="border-2 border-gray-300 p-4 text-center">
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">Total Selling</p>
                    <p className="text-xl font-black text-blue-600">{totalSelling.toLocaleString()} PKR</p>
                </div>
                <div className="border-2 border-blue-600 p-4 text-center bg-blue-50">
                    <p className="text-xs text-gray-600 uppercase font-bold mb-1">Net Profit</p>
                    <p className="text-xl font-black text-blue-600">{profit.toLocaleString()} PKR</p>
                </div>
            </div>

            {/* Signatures */}
            <div className="border-t-2 border-gray-300 pt-6 mt-8">
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-4">Prepared By:</p>
                        <div className="border-b border-gray-400 mb-2" style={{ height: '40px' }}></div>
                        <p className="text-xs text-gray-600">Signature & Date</p>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-4">Approved By:</p>
                        <div className="border-b border-gray-400 mb-2" style={{ height: '40px' }}></div>
                        <p className="text-xs text-gray-600">Signature & Date</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-300">
                <p>This is a computer-generated document. No signature is required.</p>
                <p className="mt-1">Generated on {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}
