import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Accessing the service role key from backend only
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined');
}

// Basic validation for JWT format (should start with eyJ and have 3 parts)
if (!serviceRoleKey.startsWith('eyJ')) {
    console.error('CRITICAL WARNING: SUPABASE_SERVICE_ROLE_KEY does not appear to be a valid JWT (must start with "eyJ"). This will cause "Invalid API key" errors.');
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
