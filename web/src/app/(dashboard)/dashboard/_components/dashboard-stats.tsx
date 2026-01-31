import { createClient } from '@/lib/supabase/server';
import { GamificationService } from '@/services/gamification-service';
import { StatsRow } from '@/components/dashboard/stats-row';

export async function DashboardStats({ userId }: { userId: string }) {
    const supabase = await createClient();

    // Parallel fetch for profile stats and streak
    const [profileResult, streakResult] = await Promise.all([
        supabase.from('profiles').select('xp_points, level').eq('id', userId).single(),
        supabase.from('user_streaks' as any).select('current_streak').eq('user_id', userId).maybeSingle()
    ]);

    const profile = profileResult.data;
    const streak = streakResult.data;

    const userStats = {
        xp: profile?.xp_points || 0,
        level: profile?.level || 1,
        streak: (streak as any)?.current_streak || 0,
        gems: 0 // Not yet implemented in DB
    };

    return <StatsRow stats={userStats} />;
}
