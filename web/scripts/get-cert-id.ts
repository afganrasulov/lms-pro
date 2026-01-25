
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: 'web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getCert() {
    const { data, error } = await supabase
        .from('certificates')
        .select('credential_id')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching cert:', error);
        return;
    }

    if (!data) {
        console.log('NO_CERT_FOUND');
        return;
    }

    console.log('TEST_CERT_ID:', data.credential_id);
}

getCert();
