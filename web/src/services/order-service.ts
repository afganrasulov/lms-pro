import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const OrderService = {
    // 1. Get Purchase History
    async getMyOrders(userId: string) {
        // Mock implementation until 'orders' table exists
        return [];
        /*
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
        */
    }
};
