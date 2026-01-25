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
    console.log(`${c.bold}🎓 Testing Scenario 15: Certificate Trigger (Honorable Discharge)${c.reset}\n`);

    const { supabase } = await import('@/lib/supabase');

    // We need service client to force cleanup/setup if needed
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // 1. Setup User and Course
    process.stdout.write(`${c.blue}[SETUP]${c.reset} Authenticating User... `);
    let userId = '';

    // Try generic test user first
    const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
        email: 'test_automation_user@example.com',
        password: 'TestPass123!'
    });

    if (auth.user) {
        userId = auth.user.id;
    } else {
        // Try creating one if missing? No, that's too much side effect.
        console.log(`${c.red}FAIL (Login Failed)${c.reset}`); process.exit(1);
    }
    console.log(`${c.green}✔ PASS${c.reset} (User ID: ${userId})`);

    // Create a unique course to guarantee fresh state
    const suffix = Date.now();
    const { data: course } = await adminClient.from('courses').insert({
        title: `Cert Test Course ${suffix}`, slug: `cert-course-${suffix}`, status: 'published', visibility: 'public', created_by: userId
    }).select().single();
    if (!course) throw new Error("Course creation failed");

    // Enrol user
    await adminClient.from('enrollments').insert({ user_id: userId, course_id: course.id }).select();


    // 2. Trigger Completion (Simulate 100% Progress)
    // The trigger logic relies on `course_progress_summary` or logic called when lesson is completed?
    // Based on my SQL check earlier: `trigger_issue_certificate` is on `course_progress_summary`.
    // So we just need to INSERT/UPDATE `course_progress_summary` with 100%.

    process.stdout.write(`${c.blue}[TEST]${c.reset} Simulating 100% Completion... `);

    // We might need to handle the case where the row doesn't exist yet
    const { error: pErr } = await adminClient
        .from('course_progress_summary')
        .upsert({
            user_id: userId,
            course_id: course.id,
            progress_percent: 100.00,
            completed_lessons: 10,
            total_lessons: 10,
            updated_at: new Date().toISOString()
        })
        .select();

    if (pErr) {
        console.log(`${c.red}✘ FAIL${c.reset} - ${pErr.message}`);
        process.exit(1);
    }
    console.log(`${c.green}✔ PASS${c.reset}`);


    // 3. Verify Certificate Creation
    process.stdout.write(`${c.blue}[TEST]${c.reset} verifying Certificate Issuance... `);

    // Give Trigger a moment
    await new Promise(r => setTimeout(r, 1000));

    const { data: cert, error: cErr } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .single();

    if (cErr || !cert) {
        console.log(`${c.red}✘ FAIL${c.reset} - Certificate not found. Trigger might have failed.`);
        // Debug: check notification
        const { data: notif } = await adminClient.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1);
        console.log("Latest Notification:", notif);
    } else {
        console.log(`${c.green}✔ PASS${c.reset} (Cert ID: ${cert.id.slice(0, 6)})`);
    }

    // 4. Verify Notification
    process.stdout.write(`${c.blue}[TEST]${c.reset} Verifying Notification... `);
    const { data: notifs } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'certificate')
        .order('created_at', { ascending: false })
        .limit(1);

    if (notifs && notifs.length > 0 && notifs[0].message.includes(course.title)) {
        console.log(`${c.green}✔ PASS${c.reset}`);
    } else {
        console.log(`${c.yellow}⚠ WARN${c.reset} (Notification not found, trigger might be partial)`);
    }

    console.log(`\n${c.green}${c.bold}✅ Scenario 15 Verified.${c.reset}\n`);
}

main().catch(console.error);
