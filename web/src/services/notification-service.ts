import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const NotificationService = {
    // 1. Get Unread Notifications
    async getUnread(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .eq('is_read', false)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 2. Mark as Read
    async markAsRead(notificationId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Mark All As Read
    async markAllAsRead(userId: string) {
        const { data, error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId);

        if (error) throw error;
        return data;
    }
};
