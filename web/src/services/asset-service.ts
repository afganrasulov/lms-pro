import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const AssetService = {
    // 1. Get Signed URL for Private Asset
    async getSignedUrl(path: string, expiresIn = 3600) {
        const { data, error } = await supabase
            .storage
            .from('course-assets')
            .createSignedUrl(path, expiresIn);

        if (error) throw error;
        return data.signedUrl;
    },

    // 2. Get Public URL (for cover images etc)
    getPublicUrl(path: string) {
        const { data } = supabase
            .storage
            .from('course-assets')
            .getPublicUrl(path);

        return data.publicUrl;
    },

    // 3. Get Course Assets
    async getCourseAssets(courseId: string) {
        const { data, error } = await supabase
            .storage
            .from('course-assets')
            .list(courseId);

        if (error) throw error;
        return data || [];
    }
};
