import { createClient } from '@/lib/supabase/server';
import { WeeklyLeaderboard } from '@/components/gamification/weekly-leaderboard';

export async function DashboardLeaderboard({ userId }: { userId?: string }) {
    const supabase = await createClient();

    // Fetch top 10 for leaderboard
    const { data: leaderboard } = await supabase
        .from('profiles')
        .select('id, full_name, xp_points, avatar_url')
        .order('xp_points', { ascending: false })
        .limit(10);

    const formattedLeaderboard = leaderboard?.map((user, index) => ({
        rank: index + 1,
        id: user.id,
        // user_id is implicit here as id
        user_id: user.id,
        full_name: user.full_name || 'İsimsiz Kullanıcı',
        xp: user.xp_points || 0,
        weekly_xp: user.xp_points || 0, // Fallback if weekly_xp not available in this view
        avatar_url: user.avatar_url,
        trend: 'stable' as const // Simplified for initial fetch
    })) || [];

    return <WeeklyLeaderboard initialData={formattedLeaderboard} currentUserId={userId} />;
}
