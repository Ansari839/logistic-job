"use client";

import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
    BarChart3,
    FileText,
    PieChart,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    Filter,
    Download,
    Printer,
    Users,
    Briefcase,
    Package,
    IndianRupee,
    ChevronRight,
    Search
} from 'lucide-react';
import ReportViewer from '../../components/ReportViewer';

const REPORT_CATEGORIES = [
    {
        id: 'logistics',
        title: 'Logistics Operations',
        icon: Briefcase,
        color: 'blue',
        reports: [
            { id: 'job-master', name: 'Job Master Summary', description: 'Comprehensive job analysis with profit & loss drill-down', type: 'operational' },
            /*
            { id: 'job-profitability', name: 'Job Profitability Report', description: 'Analyze revenue vs cost per job', type: 'operational' },
            { id: 'job-status', name: 'Job Status Analytics', description: 'Overview of pending vs completed jobs', type: 'operational' },
            { id: 'customer-summary', name: 'Customer Job Summary', description: 'Consolidated view of customer performance', type: 'operational' },
            { id: 'vendor-cost', name: 'Vendor Cost Analysis', description: 'Expense breakdown by vendor', type: 'operational', endpoint: 'vendor-analysis' },
            */
        ]
    },
    {
        id: 'finance',
        title: 'Financial Statements',
        icon: IndianRupee,
        color: 'emerald',
        reports: [
            { id: 'trial-balance', name: 'Trial Balance', description: 'Balance of all ledger accounts', type: 'financial' },
            { id: 'ledger-report', name: 'General Ledger', description: 'Detailed transaction history by account', type: 'ledger', apiOverride: '/api/reports/ledger' },
            { id: 'profit-loss', name: 'Profit & Loss Statement', description: 'Revenue and expense performance', type: 'financial' },
            { id: 'outstandings-customer', name: 'Customer Outstanding', description: 'Unpaid balances from customers', type: 'financial', endpoint: 'outstandings', subType: 'CUSTOMER' },
            { id: 'outstandings-vendor', name: 'Vendor Outstanding', description: 'Payables to transport/service vendors', type: 'financial', endpoint: 'outstandings', subType: 'VENDOR' },
        ]
    },
    /*
        {
            id: 'inventory',
            title: 'Inventory & Business',
            icon: Package,
            color: 'amber',
            reports: [
                { id: 'stock-summary', name: 'Real-time Stock Summary', description: 'Current inventory levels and valuation', type: 'inventory', apiOverride: '/api/inventory/stock' },
                { id: 'stock-movement', name: 'Stock Movement Report', description: 'Inbound and outbound history', type: 'inventory' },
                { id: 'business-summary', name: 'Sales & Purchase Trends', description: 'Monthly business volume summary', type: 'inventory' },
            ]
        }
    */
];

export default function ReportingPage() {
    const [selectedReport, setSelectedReport] = useState<any>(null);

    return (
        <DashboardLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
                            <BarChart3 className="text-blue-600 dark:text-blue-500" size={36} />
                            Reporting <span className="text-blue-600 dark:text-blue-500">Hub</span>
                        </h1>
                        <p className="text-subtext font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
                            Intelligent Analytics & Financial Insights
                        </p>
                    </div>
                </div>

                {!selectedReport ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {REPORT_CATEGORIES.map((category) => (
                            <div key={category.id} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <div className={`p-2 rounded-xl bg-${category.color}-500/10`}>
                                        <category.icon className={`text-${category.color}-600 dark:text-${category.color}-500`} size={18} />
                                    </div>
                                    <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">{category.title}</h2>
                                </div>
                                <div className="space-y-3">
                                    {category.reports.map((report) => (
                                        <button
                                            key={report.id}
                                            onClick={() => setSelectedReport(report)}
                                            className="w-full text-left p-5 glass-panel rounded-3xl hover:bg-primary/5 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-sm"
                                        >
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight className="text-blue-600 dark:text-blue-500" size={16} />
                                            </div>
                                            <h3 className="text-slate-900 dark:text-white font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase italic tracking-tight">{report.name}</h3>
                                            <p className="text-[10px] text-subtext mt-1 font-medium leading-relaxed max-w-[80%] uppercase tracking-wider">{report.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button
                            onClick={() => setSelectedReport(null)}
                            className="flex items-center gap-2 text-subtext hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-black uppercase tracking-widest bg-background px-4 py-2 rounded-full border border-border"
                        >
                            ← Back to Hub
                        </button>
                        <ReportViewer report={selectedReport} />
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
