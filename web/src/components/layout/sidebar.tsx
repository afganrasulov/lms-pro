'use client';

import { Home, BookOpen, Trophy, Settings, LogOut, LayoutDashboard, ShieldCheck, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';

export function Sidebar({ className }: { className?: string }) {
    const supabase = createClient();
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Enable Realtime Notifications
    useNotifications(currentUserId);

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile?.role === 'admin') {
                    setIsAdmin(true);
                }
            }
        };
        checkAdmin();
    }, []);

    const handleLogout = async () => {
        setIsLoading(true);
        try {
            await supabase.auth.signOut();
            router.push('/login');
            router.refresh(); // Ensure strict auth state refresh
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
        { icon: User, label: 'Profile', href: '/profile' },
        ...(isAdmin ? [
            { icon: ShieldCheck, label: 'Admin Panel', href: '/admin/dashboard' },
            { icon: Users, label: 'User Management', href: '/admin/users' }
        ] : []),
        { icon: BookOpen, label: 'My Courses', href: '/courses' },
        { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ];

    return (
        <div className={cn("pb-12 w-64 border-r border-white/5 min-h-screen glass flex flex-col justify-between", className)}>
            <div className="space-y-4 py-4">
                <div className="px-4 py-2">
                    <Link href="/dashboard" className="block hover:opacity-80 transition-opacity">
                        <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2 drop-shadow-md">
                            <BookOpen className="w-6 h-6 text-primary" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">LMS Pro</span>
                        </h2>
                    </Link>
                </div>
                <div className="px-3 py-2">
                    <div className="space-y-1">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                        isActive
                                            ? "bg-primary/20 text-white border border-primary/20"
                                            : "text-muted-foreground hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "")} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Footer / Logout Area */}
            <div className="px-3 py-4">
                <button
                    onClick={handleLogout}
                    disabled={isLoading}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive transition-all hover:bg-destructive/10 disabled:opacity-50"
                >
                    <LogOut className="h-4 w-4" />
                    {isLoading ? 'Signing Out...' : 'Sign Out'}
                </button>
            </div>
        </div>
    );
}
