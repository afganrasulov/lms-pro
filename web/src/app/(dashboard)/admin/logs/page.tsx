'use client';

import { useEffect, useState } from 'react';
import { AdminService } from '@/services/admin-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ScrollText, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function AdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AdminService.getSystemLogs(100).then(setLogs).catch(console.error).finally(() => setLoading(false));
    }, []);

    return (
        <div className="space-y-8 animate-in fade-in duration-500 h-[calc(100vh-140px)] flex flex-col">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Logs</h1>
                <p className="text-slate-400">Recent system activity and user transactions.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white flex-1 overflow-hidden flex flex-col">
                <CardHeader className="bg-slate-950 border-b border-slate-800 py-3">
                    <div className="flex items-center">
                        <ScrollText className="w-5 h-5 mr-2 text-slate-400" />
                        <CardTitle className="text-base">Activity Stream</CardTitle>
                        <Badge variant="outline" className="ml-auto border-slate-700 text-slate-400">Live</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading logs...
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                            No logs found.
                        </div>
                    ) : (
                        <ScrollArea className="h-full">
                            <div className="divide-y divide-slate-800">
                                {logs.map((log) => (
                                    <div key={log.id} className="p-4 flex items-start gap-4 hover:bg-slate-800/30 transition-colors text-sm">
                                        <div className="mt-1">
                                            {log.action_type === 'EARN_XP' ? (
                                                <Badge className="bg-green-500/10 text-green-400 hover:bg-green-500/20 border-0">XP GAINED</Badge>
                                            ) : log.action_type === 'SPEND_XP' ? (
                                                <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0">XP SPENT</Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-slate-400 border-slate-700">{log.action_type}</Badge>
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="font-medium text-slate-200">
                                                {log.description}
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                                <span className="flex items-center hover:text-blue-400 cursor-pointer transition-colors">
                                                    <User className="w-3 h-3 mr-1" />
                                                    {log.profiles?.full_name || 'Unknown User'}
                                                </span>
                                                <span>•</span>
                                                <span>{log.amount} XP</span>
                                                <span>•</span>
                                                <span>{formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
