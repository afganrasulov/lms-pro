
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Usually need service role for admin, but let's try login

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    const email = 'test_automation_user@example.com';
    const password = 'TestPass123!';

    console.log(`Attempting login for ${email}...`);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: 'TestPass123!'
    });

    if (error) {
        console.error('Login failed:', error.message);
    } else {
        console.log('Login successful! User ID:', data.user.id);
    }
}

checkUser();
