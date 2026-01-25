import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${colors.bold}🔐 Testing Protected Data (Auth Required)${colors.reset}\n`);

    // 1. Setup Supabase Client
    const { supabase } = await import('@/lib/supabase');

    // 2. Authenticate
    process.stdout.write(`${colors.blue}[AUTH]${colors.reset} Authenticating... `);

    // Test Credentials (Fixed to avoid creating new users constantly)
    const email = process.env.TEST_EMAIL || 'test_automation_user@example.com';
    const password = process.env.TEST_PASSWORD || 'TestPass123!';

    let userId = '';

    // First, try to Sign In
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (signInData.user) {
        console.log(`${colors.green}✔ Signed In (Existing User)${colors.reset}`);
        userId = signInData.user.id;
    } else {
        console.log(`${colors.yellow}User login failed. Error: ${signInError?.message || 'Unknown'}${colors.reset}`);
        console.log(`${colors.yellow}Attempting Sign Up...${colors.reset}`);

        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: 'Automation User' } }
        });

        if (signUpError) {
            console.log(`${colors.red}✘ FAIL${colors.reset}`);
            console.error(`  Auth Error: ${signUpError.message}`);
            console.log(`  Tip: If Rate Limited, please create the user '${email}' manually in Supabase Dashboard.`);
            process.exit(1);
        }

        if (signUpData.user) {
            console.log(`${colors.green}✔ Signed Up New User${colors.reset}`);
            userId = signUpData.user.id;
            // Wait for triggers
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.error('  Auth failed: No user returned.');
            process.exit(1);
        }
    }

    // 3. Load Services
    const { ProfileService } = await import('@/services/profile-service');
    const { SettingsService } = await import('@/services/settings-service');

    // 4. Test Profile
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Profile... `);
    const profile = await ProfileService.getMyProfile(userId);
    if (profile) {
        console.log(`${colors.green}✔ PASS${colors.reset}`);
    } else {
        console.log(`${colors.red}✘ FAIL${colors.reset} (Profile trigger might have failed)`);
    }

    // 5. Test Settings Update
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Updating Settings... `);
    try {
        const settings = await SettingsService.updateSettings(userId, { email_notifications: false });
        if (settings && settings.email_notifications === false) {
            console.log(`${colors.green}✔ PASS${colors.reset}`);
        } else {
            throw new Error('Settings update mismatch');
        }
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(`  ${e.message}`);
    }

    console.log(`\n${colors.bold}Done.${colors.reset}`);
}

main().catch(console.error);
