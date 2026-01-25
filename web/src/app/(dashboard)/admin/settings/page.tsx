'use client';


import { useState, useEffect } from 'react';
import { AdminService } from '@/services/admin-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
    // Simulated System Settings
    const [settings, setSettings] = useState({
        maintenanceMode: false,
        registrationsOpen: true,
        emailNotificationsGlobal: true,
        debugMode: false
    });

    const handleSave = () => {
        // Here we would save to a system_settings table if it existed.
        // For now, we simulate a save.
        toast.success('System settings saved successfully');
    };

    // Dashboard Config
    const [dashboardConfig, setDashboardConfig] = useState({
        showStats: true,
        showCertificates: true,
        showCourseSuccess: true,
        showLeaderboard: true
    });

    useEffect(() => {
        AdminService.getSystemSettings('dashboard_config').then((config) => {
            if (config) setDashboardConfig(config);
        });
    }, []);

    const handleDashboardConfigChange = (key: string, value: boolean) => {
        const newConfig = { ...dashboardConfig, [key]: value };
        setDashboardConfig(newConfig);
        AdminService.updateSystemSettings('dashboard_config', newConfig)
            .then(() => toast.success('Dashboard settings updated'))
            .catch(() => toast.error('Failed to update dashboard settings'));
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white mb-2">System Settings</h1>
                <p className="text-slate-400">Configure global platform settings.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                    <CardTitle>General Configuration</CardTitle>
                    <CardDescription>Control the overall behavior of the platform.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Maintenance Mode</Label>
                            <p className="text-sm text-slate-400">Disable access for non-admin users.</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, maintenanceMode: c }))}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Allow Registrations</Label>
                            <p className="text-sm text-slate-400">Let new users sign up for the platform.</p>
                        </div>
                        <Switch
                            checked={settings.registrationsOpen}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, registrationsOpen: c }))}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Global Email Notifications</Label>
                            <p className="text-sm text-slate-400">Send automated emails from the system.</p>
                        </div>
                        <Switch
                            checked={settings.emailNotificationsGlobal}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, emailNotificationsGlobal: c }))}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
                </CardFooter>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                    <CardTitle>Developer Options</CardTitle>
                    <CardDescription>Advanced tools for debugging.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Debug Mode</Label>
                            <p className="text-sm text-slate-400">Show detailed error logs in the console.</p>
                        </div>
                        <Switch
                            checked={settings.debugMode}
                            onCheckedChange={(c) => setSettings(s => ({ ...s, debugMode: c }))}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800 text-white">
                <CardHeader>
                    <CardTitle>User Dashboard Configuration</CardTitle>
                    <CardDescription>Control which sections are visible to students on their dashboard.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Show Stats Row</Label>
                            <p className="text-sm text-slate-400">Display statistics (XP, Level, etc.) at the top.</p>
                        </div>
                        <Switch
                            checked={dashboardConfig.showStats}
                            onCheckedChange={(c) => handleDashboardConfigChange('showStats', c)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Show Certificates</Label>
                            <p className="text-sm text-slate-400">Display the "My Certificates" section.</p>
                        </div>
                        <Switch
                            checked={dashboardConfig.showCertificates}
                            onCheckedChange={(c) => handleDashboardConfigChange('showCertificates', c)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Show Course Success</Label>
                            <p className="text-sm text-slate-400">Display enrolled courses and progress.</p>
                        </div>
                        <Switch
                            checked={dashboardConfig.showCourseSuccess}
                            onCheckedChange={(c) => handleDashboardConfigChange('showCourseSuccess', c)}
                        />
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                        <div className="space-y-1">
                            <Label className="text-base">Show Leaderboard</Label>
                            <p className="text-sm text-slate-400">Display the weekly leaderboard sidebar.</p>
                        </div>
                        <Switch
                            checked={dashboardConfig.showLeaderboard}
                            onCheckedChange={(c) => handleDashboardConfigChange('showLeaderboard', c)}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
