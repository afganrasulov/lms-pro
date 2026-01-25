'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AdminService } from '@/services/admin-service';
import { BookOpen, Settings, Users, Activity, BarChart3, Eye } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';


import { createClient } from '@/lib/supabase/client';

export default function AdminDashboardPage() {
    const supabase = createClient();
    const [stats, setStats] = useState({ totalUsers: 0, totalCourses: 0, totalEnrollments: 0 });

    const [visibleSections, setVisibleSections] = useState({
        stats: true,
        quickActions: true
    });

    useEffect(() => {
        AdminService.getSystemStats().then(setStats).catch(console.error);
    }, []);

    // Realtime Stats Updates
    useEffect(() => {
        const channel = supabase
            .channel('admin_stats_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                AdminService.getSystemStats().then(setStats);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
                AdminService.getSystemStats().then(setStats);
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'enrollments' }, () => {
                AdminService.getSystemStats().then(setStats);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Admin Dashboard</h1>
                    <p className="text-slate-400">Manage your learning platform from a central hub.</p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-2 bg-slate-900 text-white border-slate-800 hover:bg-slate-800">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800 text-white">
                        <DropdownMenuLabel>Toggle Visibility</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuCheckboxItem
                            checked={visibleSections.stats}
                            onCheckedChange={(checked) => setVisibleSections(prev => ({ ...prev, stats: checked }))}
                            className="focus:bg-slate-800 focus:text-white"
                        >
                            Statistics
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={visibleSections.quickActions}
                            onCheckedChange={(checked) => setVisibleSections(prev => ({ ...prev, quickActions: checked }))}
                            className="focus:bg-slate-800 focus:text-white"
                        >
                            Quick Actions
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Stats Row */}
            {visibleSections.stats && (
                <div className="grid gap-4 md:grid-cols-3 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="bg-slate-900 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Total Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCourses}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 text-white">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">Active Enrollments</CardTitle>
                            <Activity className="h-4 w-4 text-slate-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalEnrollments}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Quick Actions Grid */}
            {visibleSections.quickActions && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <Link href="/admin/courses" className="block">
                        <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer h-full">
                            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="p-4 bg-blue-500/10 rounded-full">
                                    <BookOpen className="h-8 w-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">Manage Courses</h3>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/users" className="block">
                        <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer h-full">
                            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="p-4 bg-purple-500/10 rounded-full">
                                    <Users className="h-8 w-8 text-purple-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">User Management</h3>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/settings" className="block">
                        <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer h-full">
                            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="p-4 bg-emerald-500/10 rounded-full">
                                    <Settings className="h-8 w-8 text-emerald-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">System Settings</h3>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/admin/logs" className="block">
                        <Card className="bg-slate-900 border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer h-full">
                            <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
                                <div className="p-4 bg-amber-500/10 rounded-full">
                                    <Activity className="h-8 w-8 text-amber-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">View Logs</h3>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            )}


        </div>
    );
}
