import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export const SettingsService = {
    // 1. Get Settings
    // 1. Get Settings
    async getSettings(userId: string) {
        const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(); // Changed from single() to maybeSingle() to handle no rows gracefully

        if (error) {
            console.error('Error fetching settings:', error);
            throw error;
        }
        return data; // Returns null if no row exists, which we'll handle in the UI
    },

    // 2. Update Preferences
    async updateSettings(userId: string, prefs: {
        email_notifications?: boolean;
        push_notifications?: boolean;
        marketing_emails?: boolean;
        language?: string
    }) {
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({ // Changed from update to upsert
                user_id: userId,
                ...prefs,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }
};
