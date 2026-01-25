import { supabase } from '@/lib/supabase';

export const AdminService = {
    // 1. Get System Stats
    async getSystemStats() {
        const [users, courses, enrollments] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }),
            supabase.from('courses').select('id', { count: 'exact', head: true }),
            supabase.from('enrollments').select('user_id', { count: 'exact', head: true })
        ]);

        return {
            totalUsers: users.count || 0,
            totalCourses: courses.count || 0,
            totalEnrollments: enrollments.count || 0
        };
    },

    // 2. Get System Logs (Proxied via XP Transactions)
    async getSystemLogs(limit = 50) {
        const { data, error } = await supabase
            .from('xp_logs')
            .select(`
                *,
                profiles(full_name, email)
            `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    },

    // 3. System Settings
    async getSystemSettings(key: string) {
        const { data, error } = await supabase
            // @ts-ignore - system_settings table exists but types are not updated in DB types file yet
            .from('system_settings')
            .select('value')
            .eq('key', key)
            .single() as any;

        if (error) {
            // Return null if not found (let caller handle defaults)
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data?.value;
    },

    async updateSystemSettings(key: string, value: any) {
        const { error } = await supabase
            // @ts-ignore - system_settings table exists but types are not updated in DB types file yet
            .from('system_settings')
            .upsert({
                key,
                value,
                updated_at: new Date().toISOString()
            } as any);

        if (error) throw error;
    }
};
