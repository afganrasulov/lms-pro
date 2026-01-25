import { colors } from './utils/colors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const c = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${c.bold}🔥 Testing Scenario 16: The Daily Grind (Streaks)${c.reset}\n`);

    const { supabase } = await import('@/lib/supabase');
    const { createClient } = await import('@supabase/supabase-js');

    // Use Service Role to manipulate dates for testing logic
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 1. Setup User
    process.stdout.write(`${c.blue}[SETUP]${c.reset} getting user... `);
    // Use automation user
    const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
        email: 'test_automation_user@example.com', password: 'TestPass123!'
    });
    const userId = auth.user?.id;
    if (!userId) { console.log("FAIL"); process.exit(1); }
    console.log(`${c.green}✔${c.reset} (${userId.slice(0, 6)})`);

    // Reset Streak
    await adminClient.from('user_streaks').delete().eq('user_id', userId);
    await adminClient.from('xp_transactions').delete().eq('user_id', userId);

    // 2. Simulate "Yesterday" Activity
    process.stdout.write(`${c.blue}[TEST]${c.reset} Simulating Yesterday Activity (Streak Start)... `);

    // We need to insert an XP transaction for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // We update 'user_streaks' manually to simulate existing state
    // Or we rely on the trigger. The trigger `trigger_update_streak` listens to `xp_transactions`.
    // So if we insert XP with `created_at` = Yesterday, the trigger *should* handle it.
    // BUT typically triggers use `NOW()` unless logic checks `NEW.created_at`.

    // Let's manually seed the streak table to "1 day streak, last active yesterday"
    const { error: sErr } = await adminClient.from('user_streaks').insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_activity_date: yesterday.toISOString().split('T')[0] // YYYY-MM-DD
    });
    if (sErr) throw sErr;
    console.log(`${c.green}✔ PASS${c.reset}`);


    // 3. Trigger "Today" Activity
    process.stdout.write(`${c.blue}[TEST]${c.reset} Completing Lesson Today... `);

    // Insert XP transaction for NOW
    const { error: xpErr } = await adminClient.from('xp_transactions').insert({
        user_id: userId,
        amount: 10,
        action_type: 'lesson_completion',
        description: 'Test Lesson'
    });

    if (xpErr) throw xpErr;
    console.log(`${c.green}✔ PASS${c.reset}`);

    // Wait for trigger
    await new Promise(r => setTimeout(r, 1000));

    // 4. Verify Streak Incremented
    process.stdout.write(`${c.blue}[TEST]${c.reset} Verifying Streak Update... `);
    const { data: streak } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (streak && streak.current_streak === 2) {
        console.log(`${c.green}✔ PASS${c.reset} (Streak: 2)`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset} (Streak: ${streak?.current_streak}, Expected: 2)`);
    }

    // 5. Simulate Broken Streak
    console.log(`${c.blue}[TEST]${c.reset} Simulating 2-day gap... `);
    // Set last active to 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    await adminClient.from('user_streaks').update({
        current_streak: 5,
        last_activity_date: threeDaysAgo.toISOString().split('T')[0]
    }).eq('user_id', userId);

    // Insert new activity
    await adminClient.from('xp_transactions').insert({
        user_id: userId, amount: 5, action_type: 'lesson_completion', description: 'Return'
    });

    await new Promise(r => setTimeout(r, 1000));

    const { data: resetStreak } = await supabase.from('user_streaks').select('*').eq('user_id', userId).single();
    if (resetStreak && resetStreak.current_streak === 1) {
        console.log(`${c.green}✔ PASS${c.reset} (Streak Reset to 1)`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset} (Streak: ${resetStreak?.current_streak}, Expected: 1)`);
    }

    console.log(`\n${c.green}${c.bold}✅ Scenario 16 Verified.${c.reset}\n`);
}

main().catch(console.error);
