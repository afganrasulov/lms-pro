import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Accessing the service role key from backend only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export const getSupabaseAdmin = () => {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
    }

    // Basic validation for JWT format
    if (!serviceRoleKey.startsWith('eyJ')) {
        console.error('CRITICAL WARNING: SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT.');
    }

    return createClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
};
