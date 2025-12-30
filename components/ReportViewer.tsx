"use client";

import { useState, useEffect } from 'react';
import {
    Download,
    Printer,
    Filter,
    Calendar,
    RefreshCw,
    FileSpreadsheet,
    FileText,
    Search,
    ChevronDown,
    IndianRupee,
    Loader2
} from 'lucide-react';
import { exportToPDF, exportToExcel } from '@/lib/report-utils';

interface ReportViewerProps {
    report: {
        id: string;
        name: string;
        type: string;
        endpoint?: string;
        subType?: string;
        apiOverride?: string;
    };
}

export default function ReportViewer({ report }: ReportViewerProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        branchId: '',
        customerId: '',
        vendorId: '',
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const apiBase = report.apiOverride || `/api/reports/${report.type}`;
            const query = new URLSearchParams({
                type: report.endpoint || report.id,
                ...(report.subType && { subType: report.subType }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            });

            const res = await fetch(`${apiBase}?${query}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.report || []);
            }
        } catch (error) {
            console.error('Fetch report failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [report.id, filters]);

    const handleExport = (format: 'pdf' | 'excel') => {
        if (!data.length) return;

        const filename = `${report.id}_${new Date().toISOString().split('T')[0]}`;
        const columns = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');

        if (format === 'pdf') {
            const rows = data.map(item => columns.map(col => item[col]?.toString() || ''));
            exportToPDF(report.name, columns.map(c => c.toUpperCase()), rows, filename);
        } else {
            exportToExcel(data, filename);
        }
    };

    return (
        <div className="bg-slate-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filter Bar */}
            <div className="p-8 border-b border-white/5 flex flex-wrap items-center gap-4 bg-white/[0.02]">
                <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-2">
                    <Calendar size={14} className="text-slate-500" />
                    <input
                        type="date"
                        className="bg-transparent text-[10px] font-black text-white focus:outline-none uppercase tracking-widest"
                        value={filters.startDate}
                        onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                    />
                    <span className="text-slate-700 font-bold">to</span>
                    <input
                        type="date"
                        className="bg-transparent text-[10px] font-black text-white focus:outline-none uppercase tracking-widest"
                        value={filters.endDate}
                        onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                    />
                </div>

                <div className="flex-1" />

                <div className="flex gap-2">
                    <button
                        onClick={() => handleExport('pdf')}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <FileText size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest px-1">PDF</span>
                    </button>
                    <button
                        onClick={() => handleExport('excel')}
                        className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest px-1">Excel</span>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-8 min-h-[400px]">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synthesizing Data...</p>
                    </div>
                ) : data.length > 0 ? (
                    <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-950/40">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white/[0.02]">
                                    {Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' && k !== 'id').map((col) => (
                                        <th key={col} className="p-5 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                                            {col.replace(/([A-Z])/g, ' $1')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i} className="hover:bg-white/[0.01] transition-colors border-b border-white/5 last:border-0 group">
                                        {Object.keys(row).filter(k => typeof row[k] !== 'object' && k !== 'id').map((col) => (
                                            <td key={col} className="p-5 text-[11px] font-medium text-slate-400">
                                                {typeof row[col] === 'number' && col.toLowerCase().includes('amount') || col.toLowerCase().includes('revenue') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('profit') || col.toLowerCase().includes('valuation')
                                                    ? <span className="text-white font-bold">{Number(row[col]).toLocaleString()} <span className="text-[9px] text-slate-600">PKR</span></span>
                                                    : row[col]?.toString()}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="p-6 bg-slate-950 rounded-full border border-white/5 mb-4">
                            <Search size={32} className="text-slate-800" />
                        </div>
                        <h4 className="text-white font-black uppercase tracking-widest">No Data Discovered</h4>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Adjust filters or select a different period to view results.</p>
                    </div>
                )}
            </div>

            {/* Footer Summary */}
            {!loading && data.length > 0 && (
                <div className="p-6 bg-slate-950 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Aggregate Analysis Complete
                    </p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total Records: <span className="text-white">{data.length}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
