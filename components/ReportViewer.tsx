"use client";

import React, { useState, useEffect } from 'react';
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
    BookOpen,
    Users,
    Building2,
    ChevronRight,
    TrendingUp,
    BarChart3
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
        jobType: '',
    });
    const [pagination, setPagination] = useState({ page: 1, limit: 50, totalItems: 0, totalPages: 0 });
    const [accounts, setAccounts] = useState<any[]>([]);
    const [accountSearch, setAccountSearch] = useState('');
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [company, setCompany] = useState<any>(null);
    const [ledgerSummary, setLedgerSummary] = useState<any>(null);
    const [trialBalanceTotals, setTrialBalanceTotals] = useState<any>(null);
    const [jobMasterTotals, setJobMasterTotals] = useState<any>(null);
    const [expandedJobs, setExpandedJobs] = useState<Set<number>>(new Set());
    const [customers, setCustomers] = useState<any[]>([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [branches, setBranches] = useState<any[]>([]);

    // Filter accounts based on search
    const filteredAccounts = accounts.filter((acc: any) =>
        acc.code.toLowerCase().includes(accountSearch.toLowerCase()) ||
        acc.name.toLowerCase().includes(accountSearch.toLowerCase())
    );

    const filteredCustomers = customers.filter((cust: any) =>
        cust.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        cust.code.toLowerCase().includes(customerSearch.toLowerCase())
    );

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
        const fetchCustomers = async () => {
            const res = await fetch('/api/customers');
            if (res.ok) {
                const result = await res.json();
                setCustomers(result.customers || []);
            }
        };
        const fetchBranches = async () => {
            const res = await fetch('/api/branches');
            if (res.ok) {
                const result = await res.json();
                setBranches(Array.isArray(result) ? result : []);
            }
        };
        fetchAccounts();
        fetchCompany();
        fetchCustomers();
        fetchBranches();
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
                    setJobMasterTotals(null);
                } else if (report.id === 'job-master') {
                    setData(result.report || []);
                    setJobMasterTotals(result.totals || null);
                    setLedgerSummary(null);
                    setTrialBalanceTotals(null);
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
            <div className="p-8 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/5 space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Primary Controls Group */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-300 dark:border-white/10">
                            <Calendar size={16} className="text-slate-500 dark:text-slate-600 ml-3" />
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                className="px-3 py-2 bg-transparent text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest focus:outline-none transition-all"
                            />
                            <span className="text-slate-500 dark:text-slate-600 text-[10px] font-black px-1">→</span>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                className="px-3 py-2 bg-transparent text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest focus:outline-none transition-all mr-2"
                            />
                        </div>

                        {report.id === 'job-master' && (
                            <div className="flex items-center gap-2 bg-white dark:bg-white/5 p-1 rounded-2xl border border-slate-300 dark:border-white/10">
                                <Filter size={16} className="text-slate-500 dark:text-slate-600 ml-3" />
                                <select
                                    value={filters.jobType}
                                    onChange={(e) => setFilters({ ...filters, jobType: e.target.value })}
                                    className="px-4 py-2 bg-transparent text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest focus:outline-none transition-all mr-2"
                                >
                                    <option value="">All Jobs</option>
                                    <option value="IMPORT">IMPORT ONLY</option>
                                    <option value="EXPORT">EXPORT ONLY</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3 ml-auto">
                        <button
                            onClick={fetchReport}
                            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 active:scale-95"
                        >
                            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                            Refresh
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handleExport('pdf')}
                                className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <FileText size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest px-1">PDF</span>
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <FileSpreadsheet size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest px-1">Excel</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Secondary Filters Row */}
                {(report.type === 'ledger' || report.id === 'job-master') && (
                    <div className="flex flex-col lg:flex-row gap-4 pt-4 border-t border-slate-200 dark:border-white/5">

                        {report.type === 'ledger' && (
                            <div className="flex items-center gap-2 flex-1 relative">
                                <BookOpen size={16} className="text-slate-500 dark:text-slate-600" />
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={accountSearch}
                                        onChange={(e) => setAccountSearch(e.target.value)}
                                        onFocus={() => setShowAccountDropdown(true)}
                                        placeholder="🔍 Search Account by Code or Name..."
                                        className="w-full px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-xs font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                    />
                                    {showAccountDropdown && accountSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50">
                                            {filteredAccounts.length > 0 ? (
                                                filteredAccounts.map((acc: any) => (
                                                    <button
                                                        key={acc.id}
                                                        onClick={() => {
                                                            setFilters({ ...filters, accountId: acc.id.toString() });
                                                            setAccountSearch(`${acc.code} - ${acc.name}`);
                                                            setShowAccountDropdown(false);
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5 last:border-0"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">{acc.code}</span>
                                                            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{acc.name}</span>
                                                        </div>
                                                        <div className="text-[10px] text-slate-500 dark:text-slate-600 uppercase tracking-widest mt-1">{acc.type}</div>
                                                    </button>
                                                ))
                                            ) : (
                                                <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-600 text-xs">
                                                    No accounts found
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {filters.accountId && (
                                    <button
                                        onClick={() => {
                                            setFilters({ ...filters, accountId: '' });
                                            setAccountSearch('');
                                        }}
                                        className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-black"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}

                        {report.id === 'job-master' && (
                            <>
                                {/* Customer Filter */}
                                <div className="flex items-center gap-2 flex-1 relative min-w-[300px]">
                                    <Users size={16} className="text-slate-500 dark:text-slate-600" />
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(e) => setCustomerSearch(e.target.value)}
                                            onFocus={() => setShowCustomerDropdown(true)}
                                            placeholder="🔍 Search Customer by Name or Code..."
                                            className="w-full px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                        />
                                        {showCustomerDropdown && customerSearch && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-white/10 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50">
                                                {filteredCustomers.length > 0 ? (
                                                    filteredCustomers.map((cust: any) => (
                                                        <button
                                                            key={cust.id}
                                                            onClick={() => {
                                                                setFilters({ ...filters, customerId: cust.id.toString() });
                                                                setCustomerSearch(`${cust.code} - ${cust.name}`);
                                                                setShowCustomerDropdown(false);
                                                            }}
                                                            className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors border-b border-slate-200 dark:border-white/5 last:border-0"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-black text-blue-600 dark:text-blue-400">{cust.code}</span>
                                                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cust.name}</span>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-6 text-center text-slate-500 dark:text-slate-600 text-xs">
                                                        No customers found
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {filters.customerId && (
                                        <button
                                            onClick={() => {
                                                setFilters({ ...filters, customerId: '' });
                                                setCustomerSearch('');
                                            }}
                                            className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-black"
                                        >
                                            Clear
                                        </button>
                                    )}
                                </div>

                            </>
                        )}
                    </div>
                )}
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
                                            ) : report.id === 'job-master' ? (
                                                <>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Job #</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Date</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Customer</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">Vessel/GD</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">Sell</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">Cost</th>
                                                    <th className="p-5 text-[10px] font-black text-slate-600 dark:text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5 text-right">P/L</th>
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
                                            <React.Fragment key={row.id || i}>
                                                <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors border-b border-slate-200 dark:border-white/5 last:border-0 group">
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
                                                    ) : report.id === 'job-master' ? (
                                                        <>
                                                            <td className="p-5 text-[11px] font-black">
                                                                <button
                                                                    onClick={() => {
                                                                        const next = new Set(expandedJobs);
                                                                        if (next.has(row.id)) next.delete(row.id);
                                                                        else next.add(row.id);
                                                                        setExpandedJobs(next);
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2 group"
                                                                >
                                                                    <ChevronRight size={14} className={`transition-transform ${expandedJobs.has(row.id) ? 'rotate-90' : ''}`} />
                                                                    {row.jobNumber}
                                                                </button>
                                                            </td>
                                                            <td className="p-5 text-[11px] text-slate-600 dark:text-slate-400">{new Date(row.date).toLocaleDateString()}</td>
                                                            <td className="p-5 text-[11px]">
                                                                <div className="font-bold text-slate-900 dark:text-white">{row.customer}</div>
                                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest">{row.customerCode}</div>
                                                            </td>
                                                            <td className="p-5 text-[11px]">
                                                                <div className="text-slate-700 dark:text-slate-300">{row.vessel}</div>
                                                                <div className="text-[9px] text-slate-500">GD: {row.gdNo}</div>
                                                            </td>
                                                            <td className="p-5 text-[11px] font-bold text-right text-slate-900 dark:text-white">{row.sell.toLocaleString()}</td>
                                                            <td className="p-5 text-[11px] font-bold text-right text-slate-600 dark:text-slate-400">{row.cost.toLocaleString()}</td>
                                                            <td className={`p-5 text-[11px] font-black text-right ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                                                                {row.profit.toLocaleString()}
                                                            </td>
                                                        </>
                                                    ) : (
                                                        Object.keys(row).filter(k => typeof row[k] !== 'object' && k !== 'id').map((col) => {
                                                            const isBalanceColumn = col.toLowerCase().includes('balance');
                                                            const isAmountColumn = col.toLowerCase().includes('amount') || col.toLowerCase().includes('revenue') || col.toLowerCase().includes('cost') || col.toLowerCase().includes('profit') || col.toLowerCase().includes('valuation') || col.toLowerCase().includes('debit') || col.toLowerCase().includes('credit');

                                                            return (
                                                                <td key={col} className="p-5 text-[11px] font-medium text-slate-700 dark:text-slate-400 text-right">
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

                                                {/* Drill-down details for job-master */}
                                                {report.id === 'job-master' && expandedJobs.has(row.id) && (
                                                    <tr className="bg-slate-50/50 dark:bg-white/[0.01]">
                                                        <td colSpan={7} className="p-8 border-b border-slate-200 dark:border-white/5">
                                                            <div className="space-y-4">
                                                                <div className="flex items-center justify-between">
                                                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Detailed Expense Breakdown</h4>
                                                                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full uppercase">
                                                                        Job Analysis
                                                                    </span>
                                                                </div>
                                                                <div className="grid grid-cols-1 gap-2">
                                                                    <div className="grid grid-cols-5 py-3 px-4 bg-slate-100 dark:bg-white/5 rounded-xl text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                                        <div className="col-span-2">Expense Description</div>
                                                                        <div>Vendor</div>
                                                                        <div className="text-right">Cost</div>
                                                                        <div className="text-right">Sell</div>
                                                                    </div>
                                                                    {row.expenses.map((exp: any) => (
                                                                        <div key={exp.id} className="grid grid-cols-5 py-3 px-4 border-b border-slate-200 dark:border-white/5 last:border-0 items-center">
                                                                            <div className="col-span-2 text-[11px] font-bold text-slate-900 dark:text-white">{exp.description}</div>
                                                                            <div className="text-[10px] text-slate-500 font-medium uppercase">{exp.vendor}</div>
                                                                            <div className="text-[11px] font-bold text-right text-rose-600 dark:text-rose-500">{exp.cost.toLocaleString()}</div>
                                                                            <div className="text-[11px] font-bold text-right text-emerald-600 dark:text-emerald-500">{exp.sell.toLocaleString()}</div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="grid grid-cols-5 py-4 px-4 bg-slate-50 dark:bg-white/[0.02] rounded-xl items-center mt-2">
                                                                        <div className="col-span-3 text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-widest">Total for this job</div>
                                                                        <div className="text-[12px] font-black text-right text-rose-600 dark:text-rose-500">{row.cost.toLocaleString()}</div>
                                                                        <div className="text-[12px] font-black text-right text-emerald-600 dark:text-emerald-500">{row.sell.toLocaleString()}</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 glass-panel rounded-3xl border border-white/5">
                                <div className="p-6 bg-slate-950 rounded-full border border-white/5 mb-4">
                                    <Search size={32} className="text-slate-800" />
                                </div>
                                <h4 className="text-white font-black uppercase tracking-widest">No Data Discovered</h4>
                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Adjust filters or select a different period to view results.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4">
                        <div className="p-6 bg-slate-100 dark:bg-white/5 rounded-full border border-slate-200 dark:border-white/5 mb-4">
                            <Search size={32} className="text-slate-400" />
                        </div>
                        <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-widest">No Data Discovered</h4>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest max-w-xs">Select filters and click Refresh to view the report.</p>
                    </div>
                )}
            </div>

            {/* Job Master Summary Totals */}
            {!loading && jobMasterTotals && (
                <div className="mx-8 mb-8 p-8 bg-gradient-to-br from-blue-600/10 to-blue-500/5 rounded-3xl border border-blue-500/20 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={120} />
                    </div>
                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-blue-600 text-white shadow-lg">
                                <BarChart3 size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Master Summary Totals</h3>
                                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-500 uppercase tracking-widest">Aggregate performance overview</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-12">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Sell</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{jobMasterTotals.sell.toLocaleString()} <span className="text-[10px] opacity-40">PKR</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total Cost</p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">{jobMasterTotals.cost.toLocaleString()} <span className="text-[10px] opacity-40">PKR</span></p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Total P/L</p>
                                <p className={`text-2xl font-black tracking-tighter italic ${jobMasterTotals.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {jobMasterTotals.profit.toLocaleString()} <span className="text-[10px] opacity-40">PKR</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
