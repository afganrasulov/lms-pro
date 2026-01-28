import { createClient } from '@/lib/supabase/client';

export const SettingsService = {
    // 1. Get Settings
    async getSettings(userId: string) {
        const supabase = createClient();

        // Fetch User Settings
        const { data: settings } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        // Fetch Profile for License Key
        const { data: profile } = await supabase
            .from('profiles')
            .select('license_key, license_status, role')
            .eq('id', userId)
            .maybeSingle();

        return { ...settings, ...profile };
    },

    // 2. Update Preferences
    async updateSettings(userId: string, prefs: {
        email_notifications?: boolean;
        push_notifications?: boolean;
        marketing_emails?: boolean;
        language?: string
    }) {
        const supabase = createClient();
        // Explicitly pick fields to avoid sending unknown columns
        const { email_notifications, push_notifications, marketing_emails, language } = prefs;

        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: userId,
                email_notifications,
                push_notifications,
                marketing_emails,
                language,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            })
            .select()
            .single();

        if (error) {
            console.error('SettingsService Update Error:', error);
            throw error;
        }
        return data;
    }
};
