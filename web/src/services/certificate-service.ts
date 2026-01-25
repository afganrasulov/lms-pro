import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const CertificateService = {
    // 1. Get My Certificates
    async getMyCertificates(userId: string) {
        const { data, error } = await supabase
            .from('certificates')
            .select(`
        *,
        courses (title, cover_image_path)
      `)
            .eq('user_id', userId)
            .order('issued_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    // 2. Verify Certificate (Public)
    async verifyCertificate(credentialId: string) {
        const { data, error } = await supabase
            .from('certificates')
            .select(`
        *,
        profiles (full_name),
        courses (title)
      `)
            .eq('credential_id', credentialId)
            .single();

        if (error) throw error;
        return data;
    }
};
