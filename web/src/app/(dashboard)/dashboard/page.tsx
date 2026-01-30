'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { GamificationService } from '@/services/gamification-service';
import { CourseService } from '@/services/course-service';
import { CertificateService } from '@/services/certificate-service';
import { AdminService } from '@/services/admin-service';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { CourseCard } from '@/components/courses/course-card';
import { StatsRow, UserStats } from '@/components/dashboard/stats-row';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Course, WeeklyLeaderboard } from '@/types/index';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, BookOpen, GraduationCap, Trophy } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function UserDashboardPage() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
    const [certificates, setCertificates] = useState<any[]>([]);
    const [leaderboard, setLeaderboard] = useState<WeeklyLeaderboard[]>([]);
    const [config, setConfig] = useState({
        showStats: true,
        showCertificates: true,
        showCourseSuccess: true,
        showLeaderboard: true
    });

    useEffect(() => {
        const checkUser = async () => {
            try {
                const { data } = await supabase.auth.getUser();
                if (!data.user) {
                    router.push('/');
                    return;
                }

                setUser(data.user);
                setError(null);

                // Load parallel data
                const [statsData, enrollments, certs, lbData, settings] = await Promise.all([
                    GamificationService.getUserStats(data.user.id),
                    CourseService.getUserEnrolledCourses(data.user.id),
                    CertificateService.getMyCertificates(data.user.id),
                    GamificationService.getLeaderboard(),
                    AdminService.getSystemSettings('dashboard_config')
                ]);

                if (settings) setConfig(settings);

                setStats(statsData as UserStats);
                setEnrolledCourses(enrollments || []);
                setCertificates(certs || []);
                setLeaderboard((lbData as WeeklyLeaderboard[]) || []);
            } catch (error) {
                console.error("Failed to load dashboard data", error);
                setError("Veriler yüklenirken bir hata oluştu.");
            } finally {
                setLoading(false);
            }
        };
        checkUser();
        checkUser();
    }, [router]);

    // Realtime Gamification Updates
    useEffect(() => {
        const channel = supabase
            .channel('gamification_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles'
                },
                () => {
                    // Refetch data when any profile changes (affects leaderboard)
                    console.log("🏆 Leaderboard/Stats Update Detected");
                    GamificationService.getLeaderboard().then(data => setLeaderboard(data as WeeklyLeaderboard[]));
                    if (user) {
                        GamificationService.getUserStats(user.id).then(data => setStats(data as UserStats));
                    }
                    router.refresh(); // Sync server components
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, router]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-red-500 font-medium">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline">Tekrar Dene</Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Trophy className="text-yellow-500 w-8 h-8" />
                        Başarı Panosu
                    </h1>
                    {loading ? (
                        <Skeleton className="h-5 w-48 mt-2" />
                    ) : (
                        <p className="text-muted-foreground mt-1">
                            Tebrikler, {user?.email?.split('@')[0]}! Başarılarını buradan takip edebilirsin.
                        </p>
                    )}
                </div>

            </header>

            {/* Stats Row */}
            {config.showStats && (
                loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 rounded-md bg-white/5 border border-white/10" />
                        ))}
                    </div>
                ) : (
                    user && stats && <StatsRow stats={stats} />
                )
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {/* My Certificates Section */}
                    {config.showCertificates && (
                        <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                            <div className="flex items-center gap-2">
                                <Award className="text-primary w-6 h-6" />
                                <h2 className="text-xl font-semibold text-foreground">Sertifikalarım</h2>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {loading ? (
                                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-32 rounded-md glass" />)
                                ) : certificates.length === 0 ? (
                                    <div className="col-span-full p-8 text-center glass border border-white/5 rounded-md border-dashed">
                                        <p className="text-muted-foreground text-sm">Henüz bir sertifika kazanmadın. Kursları tamamlayarak başarını taçlandır!</p>
                                    </div>
                                ) : (
                                    certificates.map((cert) => (
                                        <Card key={cert.id} variant="glass" className="overflow-hidden border-none hover:bg-white/10 transition-all cursor-pointer group" onClick={() => router.push(`/certificates/${cert.credential_id}`)}>
                                            <CardContent className="p-4 flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-md bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <Award className="text-primary" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{cert.courses?.title}</h3>
                                                    <p className="text-xs text-muted-foreground">Veriliş: {new Date(cert.issued_at).toLocaleDateString()}</p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </section>
                    )}

                    {/* Progress Success Section */}
                    {config.showCourseSuccess && (
                        <section className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                Kurslarım
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {loading ? (
                                    [...Array(2)].map((_, i) => <Skeleton key={i} className="h-64 rounded-md glass" />)
                                ) : enrolledCourses.length === 0 ? (
                                    <div className="col-span-full text-center py-12 glass border border-white/5 rounded-xl border-dashed">
                                        <p className="text-muted-foreground mb-4">Henüz hiçbir kursa kayıtlı değilsin.</p>
                                        <Button asChild>
                                            <Link href="/courses">Kurslara Göz At</Link>
                                        </Button>
                                    </div>
                                ) : (
                                    enrolledCourses.map((course: any) => (
                                        <CourseCard
                                            key={course.id}
                                            course={course}
                                        />
                                    ))
                                )}
                            </div>
                        </section>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Weekly Leaderboard */}
                    {config.showLeaderboard && (
                        <Card variant="glass" className="border-none shadow-sm h-fit animate-in fade-in slide-in-from-right-4 duration-500">
                            <CardHeader className="pb-3 border-b">
                                <CardTitle className="text-lg font-medium flex items-center gap-2 italic">
                                    🏆 Haftalık Liderler
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <div className="space-y-1">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full mb-1" />)
                                    ) : leaderboard.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Lig yakında başlıyor...</p>
                                    ) : (
                                        leaderboard.slice(0, 5).map((entry, index) => (
                                            <div key={entry.user_id} className={`flex items-center justify-between p-2 rounded-md transition-colors text-sm ${entry.user_id === user?.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary/50'}`}>
                                                <div className="flex items-center gap-3">
                                                    <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${index === 0 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                                                        #{index + 1}
                                                    </span>
                                                    <span className={`font-medium truncate max-w-[120px] ${entry.user_id === user?.id ? 'text-primary' : ''}`}>
                                                        {entry.full_name || 'İsimsiz Öğrenci'}
                                                        {entry.user_id === user?.id && " (Sen)"}
                                                    </span>
                                                </div>
                                                <span className="font-mono text-xs text-primary font-bold">{entry.weekly_xp} XP</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-4 pt-4 border-t text-center">
                                    <Button onClick={() => router.push('/leaderboard')} variant="link" size="sm" className="w-full text-muted-foreground">Tüm Sıralamayı Gör</Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
