'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, CheckCircle2, X } from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
}

interface AccountSearchProps {
    accounts: Account[];
    value: string | number;
    onChange: (id: number) => void;
    placeholder?: string;
    className?: string;
}

const AccountSearch: React.FC<AccountSearchProps> = ({
    accounts,
    value,
    onChange,
    placeholder = "Select Account...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedAccount = accounts.find((a: any) => a.id.toString() === value.toString());

    const filteredAccounts = useMemo(() =>
        accounts.filter((a: any) =>
            a.name.toLowerCase().includes(search.toLowerCase()) ||
            a.code.toLowerCase().includes(search.toLowerCase())
        ).slice(0, 50),
        [accounts, search]
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-900/50 px-3 py-2 text-[11px] font-black text-blue-500 focus:outline-none focus:bg-primary/5 rounded-lg border border-slate-700/50 uppercase flex justify-between items-center cursor-pointer hover:border-blue-500/50 transition-all min-h-[38px] shadow-sm"
            >
                <span className={selectedAccount ? "truncate pr-2" : "text-slate-500 italic lowercase"}>
                    {selectedAccount ? `${selectedAccount.code} - ${selectedAccount.name}` : placeholder}
                </span>
                <ChevronDown size={14} className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute left-0 right-0 z-[1000] mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 min-w-[300px]">
                    <div className="p-3 border-b border-slate-800 bg-slate-800/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                            <input
                                autoFocus
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-8 text-[11px] font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-600"
                                placeholder="Search code or name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                            />
                            {search && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setSearch(""); }}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="max-h-[250px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-slate-800">
                        {filteredAccounts.length > 0 ? (
                            filteredAccounts.map((a: any) => (
                                <div
                                    key={a.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange(a.id);
                                        setIsOpen(false);
                                        setSearch("");
                                    }}
                                    className={`
                                        p-2.5 rounded-lg cursor-pointer transition-all flex justify-between items-center group mb-1
                                        ${value.toString() === a.id.toString() ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-blue-500/10 text-slate-300'}
                                    `}
                                >
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-[10px] font-black uppercase tracking-tight truncate">{a.name}</span>
                                        <span className={`text-[9px] font-bold ${value.toString() === a.id.toString() ? 'text-blue-100' : 'text-blue-500'}`}>{a.code}</span>
                                    </div>
                                    {value.toString() === a.id.toString() && <CheckCircle2 size={12} className="shrink-0 ml-2 animate-in zoom-in duration-300" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-[10px] font-black uppercase text-slate-600 italic tracking-widest">No matching accounts</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSearch;
