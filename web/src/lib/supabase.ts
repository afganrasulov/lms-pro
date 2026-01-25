import { createClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

// Singleton Supabase Client
// For Browser: uses createBrowserClient to handle cookies/session automatically
// For Server/Node: uses createClient (pure JS client, no cookie context by default)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = typeof window !== 'undefined'
    ? createBrowserClient<Database>(supabaseUrl, supabaseKey)
    : createClient<Database>(supabaseUrl, supabaseKey);

