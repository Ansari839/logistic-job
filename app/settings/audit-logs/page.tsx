"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, History } from 'lucide-react';

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/reports/audit-logs');
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error('Fetch logs error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const filteredLogs = logs.filter(log =>
        log.module.toLowerCase().includes(search.toLowerCase()) ||
        log.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase())
    );

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-500/10 text-green-500 border-green-500/20';
            case 'UPDATE': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'DELETE': return 'bg-red-500/10 text-red-500 border-red-500/20';
            case 'APPROVE': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
            case 'LOCK': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                        System Audit Logs
                    </h1>
                    <p className="text-slate-400">Track all critical actions and system changes</p>
                </div>
            </div>

            <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Activity History</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Search logs..."
                            className="pl-8 bg-black/20 border-slate-800"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border border-slate-800">
                        <Table>
                            <TableHeader className="bg-slate-950/50">
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">Timestamp</TableHead>
                                    <TableHead className="text-slate-400">User</TableHead>
                                    <TableHead className="text-slate-400">Module</TableHead>
                                    <TableHead className="text-slate-400">Action</TableHead>
                                    <TableHead className="text-slate-400">Entity ID</TableHead>
                                    <TableHead className="text-slate-400">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                            Loading audit logs...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-10 text-slate-500">
                                            No logs found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredLogs.map((log) => (
                                        <TableRow key={log.id} className="border-slate-800 hover:bg-white/5 transition-colors">
                                            <TableCell className="text-slate-300 font-mono text-xs">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-slate-300">
                                                <div>
                                                    <div className="font-medium text-slate-200">{log.user?.name || 'System'}</div>
                                                    <div className="text-xs text-slate-500">{log.user?.email}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-400">
                                                <Badge variant="outline" className="bg-slate-800/50 border-slate-700">
                                                    {log.module}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getActionColor(log.action)}>
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-slate-500 font-mono text-sm">
                                                #{log.entityId || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-xs">
                                                {log.ipAddress || 'Internal'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
