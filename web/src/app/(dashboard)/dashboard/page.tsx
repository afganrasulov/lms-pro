import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

import { DashboardStats } from './_components/dashboard-stats';
import { DashboardCourses } from './_components/dashboard-courses';
import { DashboardCertificates } from './_components/dashboard-certificates';
import { DashboardLeaderboard } from './_components/dashboard-leaderboard';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
    title: 'Kontrol Paneli | LMS Pro',
    description: 'Öğrenim durumunu ve ilerlemeni takip et.'
};

export default async function DashboardPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Parallel data fetching is implicit with Server Components + Suspense
    // We don't need Promise.all here because each component handles its own data.
    // The UI will stream in as data becomes available.

    return (
        <div className="container mx-auto p-6 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Başarı Panosu
                </h1>
                <p className="text-gray-400">
                    Hoş geldin, <span className="text-primary font-medium">{user.user_metadata?.full_name || 'Öğrenci'}</span>! Başarılarını buradan takip edebilirsin.
                </p>
            </div>

            {/* Stats Row */}
            <Suspense fallback={<StatsSkeleton />}>
                <DashboardStats userId={user.id} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area (Left 2/3) */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Active Courses */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-primary rounded-full" />
                            Kurslarım
                        </h2>
                        <Suspense fallback={<CoursesSkeleton />}>
                            <DashboardCourses userId={user.id} />
                        </Suspense>
                    </section>

                    {/* Certificates */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-yellow-500 rounded-full" />
                            Sertifikalarım
                        </h2>
                        <Suspense fallback={<CertificatesSkeleton />}>
                            <DashboardCertificates userId={user.id} />
                        </Suspense>
                    </section>
                </div>

                {/* Sidebar Area (Right 1/3) */}
                <div className="space-y-8">
                    {/* Leaderboard */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-orange-500 rounded-full" />
                            Haftalık Liderler
                        </h2>
                        <Suspense fallback={<LeaderboardSkeleton />}>
                            <DashboardLeaderboard userId={user.id} />
                        </Suspense>
                    </section>
                </div>
            </div>
        </div>
    );
}

// --- Skeletons ---

function StatsSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl bg-white/5 border border-white/10" />
            ))}
        </div>
    );
}

function CoursesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="aspect-video rounded-xl bg-white/5 border border-white/10" />
            ))}
        </div>
    );
}

function LeaderboardSkeleton() {
    return <Skeleton className="h-[400px] rounded-xl bg-white/5 border border-white/10" />;
}

function CertificatesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-20 rounded-xl bg-white/5 border border-white/10" />
            <Skeleton className="h-20 rounded-xl bg-white/5 border border-white/10" />
        </div>
    );
}
