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
    Loader2,
    BookOpen
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
        accountId: '',
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 50, totalItems: 0, totalPages: 0 });
    const [accounts, setAccounts] = useState<any[]>([]);
    const [company, setCompany] = useState<any>(null);
    const [ledgerSummary, setLedgerSummary] = useState<any>(null);
    const [trialBalanceTotals, setTrialBalanceTotals] = useState<any>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            const res = await fetch('/api/accounts');
            if (res.ok) {
                const result = await res.json();
                setAccounts(result.accounts || []);
            }
        };
        const fetchCompany = async () => {
            const res = await fetch('/api/company');
            if (res.ok) {
                const result = await res.json();
                setCompany(result.company);
            }
        };
        fetchAccounts();
        fetchCompany();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Fix: Use 'financials' for financial reports
            const apiBase = report.apiOverride || `/api/reports/${report.type === 'financial' ? 'financials' : report.type}`;
            const query = new URLSearchParams({
                type: report.endpoint || report.id,
                ...(report.subType && { subType: report.subType }),
                ...(report.id === 'trial-balance' && { page: pagination.page.toString(), limit: pagination.limit.toString() }),
                ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
            });

            const res = await fetch(`${apiBase}?${query}`);
            if (res.ok) {
                const result = await res.json();
                if (report.type === 'ledger') {
                    setData(result.entries || []);
                    setLedgerSummary({
                        openingBalance: result.openingBalance,
                        closingBalance: result.closingBalance
                    });
                    setTrialBalanceTotals(null);
                } else if (report.id === 'trial-balance') {
                    setData(result.report || []);
                    setTrialBalanceTotals(result.totals || null);
                    setPagination(result.pagination || pagination);
                    setLedgerSummary(null);
                } else {
                    setData(result.report || []);
                    setLedgerSummary(null);
                    setTrialBalanceTotals(null);
                }
            }
        } catch (error) {
            console.error('Fetch report failed', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [report.id, filters, pagination.page]);

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
        <div className="glass-panel border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Calendar size={16} className="text-slate-500 dark:text-slate-600" />
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <span className="text-slate-500 dark:text-slate-600 text-xs font-black">TO</span>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>

                    {report.type === 'ledger' && (
                        <select
                            value={filters.accountId}
                            onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                            className="px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                            <option value="">All Accounts</option>
                            {accounts.map((acc: any) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </select>
                    )}

                    <button
                        onClick={fetchReport}
                        className="ml-auto px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>

                    <button
                        onClick={() => handleExport('pdf')}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
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
                {/* Print Branded Header */}
                <div className="hidden print:block mb-8 border-b-2 border-black pb-6 text-black">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter italic">{report.name}</h1>
                            <p className="text-xl font-bold mt-1">{company?.name || 'Logistics solutions'}</p>
                            <div className="text-[10px] font-bold mt-1 uppercase tracking-widest text-slate-700">
                                <p>{company?.address}</p>
                                <p>{company?.phone} | {company?.email}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest">Report Date</p>
                            <p className="font-bold">{new Date().toLocaleDateString()}</p>
                            {filters.startDate && (
                                <p className="text-[10px] mt-2 font-black uppercase text-slate-500">
                                    Period: {filters.startDate} to {filters.endDate}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Synthesizing Data...</p>
                    </div>
                ) : (data.length > 0 || ledgerSummary) ? (
                    <div className="space-y-6">
                        {ledgerSummary && (
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-6 glass-panel rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Opening Balance</span>
                                    <span className={`text-xl font-black ${ledgerSummary.openingBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {Math.abs(ledgerSummary.openingBalance).toLocaleString()} <span className="text-[8px] opacity-50 uppercase">{ledgerSummary.openingBalance >= 0 ? 'DR' : 'CR'} PKR</span>
                                    </span>
                                </div>
                                <div className="p-6 glass-panel rounded-3xl border border-white/5 flex flex-col items-center justify-center gap-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Closing Balance</span>
                                    <span className={`text-xl font-black ${ledgerSummary.closingBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {Math.abs(ledgerSummary.closingBalance).toLocaleString()} <span className="text-[8px] opacity-50 uppercase">{ledgerSummary.closingBalance >= 0 ? 'DR' : 'CR'} PKR</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        {data.length > 0 ? (
                            <div className="overflow-x-auto rounded-3xl border border-slate-200 dark:border-white/5 bg-white dark:bg-slate-950">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-white/[0.02]">
                                            {report.type === 'ledger' ? (
                                                <>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Date</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Reference</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Description</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">Debit</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">Credit</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">Balance</th>
                                                </>
                                            ) : (
                                                Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object' && k !== 'id').map((col) => (
                                                    <th key={col} className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                                                        {col.replace(/([A-Z])/g, ' $1')}
                                                    </th>
                                                ))
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((row, i) => (
                                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-200 dark:border-white/5 last:border-0 group">
                                                {report.type === 'ledger' ? (
                                                    <>
                                                        <td className="p-5 text-[11px] font-medium text-slate-600 dark:text-slate-400">{new Date(row.transaction.date).toLocaleDateString()}</td>
                                                        <td className="p-5 text-[11px] font-medium text-slate-900 dark:text-white font-bold">{row.transaction.reference}</td>
                                                        <td className="p-5 text-[11px] font-medium text-slate-600 dark:text-slate-400">{row.transaction.description}</td>
                                                        <td className="p-5 text-[11px] font-medium text-slate-900 dark:text-white font-bold text-right text-emerald-600 dark:text-emerald-500">{row.debit > 0 ? row.debit.toLocaleString() : '-'}</td>
                                                        <td className="p-5 text-[11px] font-medium text-slate-900 dark:text-white font-bold text-right text-rose-600 dark:text-rose-500">{row.credit > 0 ? row.credit.toLocaleString() : '-'}</td>
                                                        <td className={`p-5 text-[11px] font-black text-right ${row.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-500'}`}>
                                                            {Math.abs(row.balance).toLocaleString()} {row.balance >= 0 ? 'DR' : 'CR'}
                                                        </td>
                                                    </>
                                                ) : (
                                                    Object.keys(row).filter(k => typeof row[k] !== 'object' && k !== 'id').map((col) => {
                                                        const isBalanceColumn = col.toLowerCase().includes('balance');
                                                        const isAmountColumn = col.toLowerCase().includes('amount') || col.toLowerCase().includes('revenue') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('profit') || col.toLowerCase().includes('valuation') || col.toLowerCase().includes('debit') || col.toLowerCase().includes('credit');

                                                        return (
                                                            <td key={col} className="p-5 text-[11px] font-medium text-slate-700 dark:text-slate-400">
                                                                {typeof row[col] === 'number' && (isBalanceColumn || isAmountColumn)
                                                                    ? <span className="text-slate-900 dark:text-white font-bold">
                                                                        {Number(row[col]).toLocaleString()}
                                                                        {isBalanceColumn && <span className="text-[9px] text-slate-500 dark:text-slate-600 ml-1">PKR</span>}
                                                                    </span>
                                                                    : row[col]?.toString()}
                                                            </td>
                                                        );
                                                    })
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                                <div className="p-6 glass-panel rounded-full border border-white/5 mb-4">
                                    <Search size={32} className="text-slate-800" />
                                </div>
                                <h4 className="text-white font-black uppercase tracking-widest">No Data Discovered</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Adjust filters or select a different period to view results.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="p-6 bg-slate-950 rounded-full border border-white/5 mb-4">
                            <Search size={32} className="text-slate-800" />
                        </div>
                        <h4 className="text-white font-black uppercase tracking-widest">No Data Discovered</h4>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Adjust filter or select a different period to view results.</p>
                    </div>
                )}
            </div>

            {/* Trial Balance Totals */}
            {!loading && trialBalanceTotals && (
                <div className="p-8 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-950 dark:to-slate-900 border-t border-slate-200 dark:border-white/5">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3">Total Debit</p>
                            <p className="text-3xl font-black text-emerald-600 dark:text-emerald-500">
                                {Number(trialBalanceTotals.totalDebit).toLocaleString()}
                                <span className="text-xs text-slate-500 dark:text-slate-600 ml-2">PKR</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3">Total Credit</p>
                            <p className="text-3xl font-black text-rose-600 dark:text-rose-500">
                                {Number(trialBalanceTotals.totalCredit).toLocaleString()}
                                <span className="text-xs text-slate-500 dark:text-slate-600 ml-2">PKR</span>
                            </p>
                        </div>
                        <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                            <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest mb-3">Difference</p>
                            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">
                                {Number(trialBalanceTotals.difference).toLocaleString()}
                                <span className="text-xs text-slate-500 dark:text-slate-600 ml-2">PKR</span>
                            </p>
                            {Math.abs(trialBalanceTotals.difference) < 0.01 && (
                                <span className="text-[8px] text-emerald-500 font-bold uppercase tracking-widest">✓ Balanced</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Trial Balance Pagination */}
            {!loading && report.id === 'trial-balance' && pagination.totalPages > 1 && (
                <div className="p-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                    <button
                        onClick={() => setPagination({ ...pagination, page: Math.max(1, pagination.page - 1) })}
                        disabled={pagination.page === 1}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest"
                    >
                        ← Previous
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                            Page {pagination.page} of {pagination.totalPages}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest">
                            ({pagination.totalItems} accounts)
                        </span>
                    </div>
                    <button
                        onClick={() => setPagination({ ...pagination, page: Math.min(pagination.totalPages, pagination.page + 1) })}
                        disabled={pagination.page === pagination.totalPages}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs font-black uppercase tracking-widest"
                    >
                        Next →
                    </button>
                </div>
            )}

            {/* Footer Summary */}
            {!loading && data.length > 0 && (
                <div className="p-6 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-white/5 flex justify-between items-center">
                    <p className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live Aggregate Analysis Complete
                    </p>
                    <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest">
                        Total Records: <span className="text-slate-900 dark:text-white">{data.length}</span>
                    </p>
                </div>
            )}
        </div>
    );
}
