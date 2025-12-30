"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Lock, Unlock, Calendar } from 'lucide-react';

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

export default function FinancialPeriodsPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPeriods = async () => {
        try {
            const res = await fetch('/api/settings/financial-periods');
            const data = await res.json();
            setPeriods(data.periods || []);
        } catch (error) {
            console.error('Fetch periods error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const togglePeriod = async (month: number, year: number, currentStatus: boolean) => {
        try {
            const res = await fetch('/api/settings/financial-periods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    month,
                    year,
                    action: currentStatus ? 'OPEN' : 'CLOSE'
                })
            });
            if (res.ok) fetchPeriods();
        } catch (error) {
            console.error('Toggle period error:', error);
        }
    };

    // Generate recent 12 months for management
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const items = [];
    for (let i = 0; i < 12; i++) {
        let m = currentMonth - i;
        let y = currentYear;
        if (m <= 0) {
            m += 12;
            y -= 1;
        }
        const periodData = periods.find(p => p.month === m && p.year === y);
        items.push({ month: m, year: y, isClosed: periodData?.isClosed || false });
    }

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                    Financial Period Locking
                </h1>
                <p className="text-slate-400">Manage open/closed months to prevent historical data modification</p>
            </div>

            <Card className="bg-slate-900/50 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Recent Periods
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow className="border-slate-800">
                                <TableHead>Period</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, idx) => (
                                <TableRow key={idx} className="border-slate-800">
                                    <TableCell className="font-medium text-slate-200">
                                        {MONTHS[item.month - 1]} {item.year}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={item.isClosed ? "destructive" : "outline"} className={item.isClosed ? "" : "text-green-500 border-green-500/20 bg-green-500/10"}>
                                            {item.isClosed ? "Closed / Locked" : "Open"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            size="sm"
                                            variant={item.isClosed ? "outline" : "destructive"}
                                            onClick={() => togglePeriod(item.month, item.year, item.isClosed)}
                                            className="gap-2"
                                        >
                                            {item.isClosed ? (
                                                <><Unlock className="h-3 w-3" /> Re-open</>
                                            ) : (
                                                <><Lock className="h-3 w-3" /> Close Month</>
                                            )}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
