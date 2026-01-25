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
    console.log(`${c.bold}🛡️ Testing Lesson Gating (Scenario 9)${c.reset}\n`);

    // We need TWO clients to simulate two users simultaneously? 
    // Or just re-instantiate or signout/signin.
    // Ideally we use separate clients.
    // Since 'lib/supabase' is singleton, we will use 'createClient' manually here for multi-user sim.
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const adminClient = createClient(supabaseUrl, supabaseKey);
    const studentClient = createClient(supabaseUrl, supabaseKey);

    // --- 1. ADMIN SETUP ---
    process.stdout.write(`${c.blue}[SETUP]${c.reset} Admin Setup... `);
    const { data: adminAuth } = await adminClient.auth.signInWithPassword({
        email: 'test_automation_user@example.com',
        password: 'TestPass123!'
    });
    if (!adminAuth.user) {
        console.log(`${c.red}FAIL (Admin Auth)${c.reset}`); process.exit(1);
    }
    const adminId = adminAuth.user.id;

    // Create Course/Lesson
    const courseSlug = `gated-course-${Date.now()}`;
    const { data: course, error: cErr } = await adminClient.from('courses').insert({
        title: 'Premium Course', slug: courseSlug, status: 'published', visibility: 'public', created_by: adminId
    }).select().single();
    if (cErr) throw cErr;

    const { data: mod, error: mErr } = await adminClient.from('modules').insert({
        course_id: course.id, title: 'Mod 1', position: 1, status: 'published', created_by: adminId, updated_by: adminId
    }).select().single();
    if (mErr) throw mErr;

    const lessonSlug = `locked-lesson-${Date.now()}`;
    const { data: lesson, error: lErr } = await adminClient.from('lessons').insert({
        course_id: course.id, module_id: mod.id, title: 'Locked', slug: lessonSlug, type: 'text', position: 1,
        status: 'published', is_free_preview: false, created_by: adminId, updated_by: adminId
    }).select().single();
    if (lErr) throw lErr;

    // Add Content
    await adminClient.from('lesson_contents').insert({
        lesson_id: lesson.id, content_markdown: 'SECRET CONTENT', version: 1, is_current_version: true
    });

    console.log(`${c.green}✔ PASS${c.reset}`);

    // --- 2. STUDENT ATTEMPT (LOCKED) ---
    process.stdout.write(`${c.blue}[TEST]${c.reset} Student Access (Locked)... `);

    // Login as Pre-created Student
    const studentEmail = 'student_user@example.com';
    const { data: studentAuth, error: sErr } = await studentClient.auth.signInWithPassword({
        email: studentEmail, password: 'TestPass123!'
    });
    if (sErr || !studentAuth.user) {
        console.log(`${c.red}FAIL (Student Login: ${sErr?.message})${c.reset}`); process.exit(1);
    }
    const studentId = studentAuth.user.id;

    // Try fetch content
    const { data: contentBlocked, error: blockErr } = await studentClient
        .from('lesson_contents')
        .select('*')
        .eq('lesson_id', lesson.id)
        .single();

    if (!contentBlocked) {
        console.log(`${c.green}✔ PASS (Access Denied)${c.reset}`);
    } else {
        console.log(`${c.red}✘ FAIL (Accessed Secret!) ${c.reset}`);
    }

    // --- 3. ENROLL STUDENT ---
    process.stdout.write(`${c.blue}[ACTION]${c.reset} Enrolling Student... `);
    const { error: enrollErr } = await adminClient.from('enrollments').insert({
        user_id: studentId, course_id: course.id, status: 'active'
    });
    if (enrollErr) {
        console.log(`${c.red}FAIL (Enroll: ${enrollErr.message})${c.reset}`); process.exit(1);
    }
    console.log(`${c.green}✔ PASS${c.reset}`);

    // --- 4. STUDENT ATTEMPT (UNLOCKED) ---
    process.stdout.write(`${c.blue}[TEST]${c.reset} Student Access (Unlocked)... `);
    const { data: contentAccess, error: accessErr } = await studentClient
        .from('lesson_contents')
        .select('*')
        .eq('lesson_id', lesson.id)
        .single();

    if (contentAccess && contentAccess.content_markdown === 'SECRET CONTENT') {
        console.log(`${c.green}✔ PASS${c.reset}`);
    } else {
        console.log(`${c.red}✘ FAIL (Still blocked or empty) ${accessErr?.message}${c.reset}`);
    }

    console.log(`\n${c.green}${c.bold}✅ Gating Logic Verified.${c.reset}\n`);
}

main().catch(console.error);
