import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';
import { SupabaseClient } from '@supabase/supabase-js';

// Client reused from singleton

export const ProfileService = {
    // 1. Get My Profile
    async getMyProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // 2. Update Profile (Avatar, Name)
    async updateProfile(userId: string, updates: { full_name?: string; avatar_url?: string }, client?: SupabaseClient) {
        const sb = client || supabase;
        const { data, error } = await sb
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Get Public Profile (for social views etc)
    async getPublicProfile(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role, level')
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data;
    },

    // 4. Get All Profiles (Admin)
    async getAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 5. Get Profile Details with additional info (for detailed admin view)
    async getProfileWithStats(userId: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                user_streaks(current_streak, longest_streak),
                user_settings(*)
            `)
            .eq('id', userId)
            .single();

        if (error) throw error;
        return data as unknown as ProfileWithStats;
    },

    // 6. Admin: Delete User (Via Server Action for Auth Sync)
    async deleteUser(userId: string) {
        const response = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: [userId] })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete user');
        }
    },

    // 7. Admin: Bulk Delete Users (Via Server Action for Auth Sync)
    async deleteUsers(userIds: string[]) {
        const response = await fetch('/api/admin/users/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete users');
        }
    },

    // 8. Admin: Update User Role
    async updateUserRole(userId: string, role: Database['public']['Enums']['user_role']) {
        const { data, error } = await supabase
            .from('profiles')
            .update({ role, updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 9. Admin: Bulk Import/Upsert Profiles
    async importProfiles(profiles: Partial<Database['public']['Tables']['profiles']['Insert']>[]) {
        const { data, error } = await supabase
            .from('profiles')
            .upsert(profiles as any, { onConflict: 'id' })
            .select();

        if (error) throw error;
        return data;
    }
};

export type ProfileWithStats = Database['public']['Tables']['profiles']['Row'] & {
    user_streaks: {
        current_streak: number;
        longest_streak: number;
    }[];
    user_settings: Database['public']['Tables']['user_settings']['Row'] | null;
};
