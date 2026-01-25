import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const GamificationService = {
    // 1. Get Weekly Leaderboard
    async getLeaderboard(limit = 10) {
        const { data, error } = await supabase
            .from('weekly_leaderboard')
            .select('*')
            .order('weekly_xp', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // 2. Get User Stats (XP, Gems, Streak)
    async getUserStats(userId: string) {
        try {
            const [profile, streak] = await Promise.all([
                supabase.from('profiles').select('xp_points, gems, level').eq('id', userId).single(),
                supabase.from('user_streaks').select('*').eq('user_id', userId).maybeSingle()
            ]);

            // Default values if profile fetch fails (though it shouldn't for active user)
            return {
                xp: profile.data?.xp_points ?? 0,
                gems: profile.data?.gems ?? 0,
                level: profile.data?.level ?? 1,
                streak: streak.data?.current_streak ?? 0,
                isStreakActive: streak.data && streak.data.last_activity_date ? GamificationService.isStreakActive(streak.data.last_activity_date) : false
            };
        } catch (error) {
            console.error("Error fetching user stats:", error);
            // Return safe defaults so UI doesn't crash
            return {
                xp: 0,
                gems: 0,
                level: 1,
                streak: 0,
                isStreakActive: false
            };
        }
    },

    // 3. Get Streak Details
    async getStreak(userId: string) {
        const { data, error } = await supabase
            .from('user_streaks')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) throw error;

        if (!data) return null;

        return {
            ...data,
            is_streak_active: data.last_activity_date ? GamificationService.isStreakActive(data.last_activity_date) : false
        };
    },

    // Helper: Check if streak is broken (Simulated logic, DB trigger handles update)
    isStreakActive(lastActivityDate: string) {
        const last = new Date(lastActivityDate);
        const today = new Date();
        // Reset hours to compare dates only
        last.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(today.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return diffDays <= 1; // 0 (today) or 1 (yesterday) means active
    }
};
