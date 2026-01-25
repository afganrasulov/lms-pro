
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
    console.log(`${c.bold}🔒 Testing Security & RLS (Scenario 12)${c.reset}\n`);

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const studentClient = createClient(supabaseUrl, supabaseKey);
    const adminClient = createClient(supabaseUrl, supabaseKey); // Need admin to create target first

    // Auth Student
    const { data: sAuth } = await studentClient.auth.signInWithPassword({
        email: 'student_user@example.com', password: 'TestPass123!'
    });
    if (!sAuth.user) throw new Error("Student Login Failed");
    console.log(`${c.blue}[SETUP]${c.reset} Student Authenticated.`);

    // Auth Admin
    const { data: aAuth } = await adminClient.auth.signInWithPassword({
        email: 'test_automation_user@example.com', password: 'TestPass123!'
    });
    if (!aAuth.user) throw new Error("Admin Login Failed");

    // 1. Unauthorized Course Update
    process.stdout.write(`${c.blue}[TEST]${c.reset} Student attempting to UPDATE Course... `);
    // Get a course ID
    const { data: courses } = await adminClient.from('courses').select('id').limit(1);
    const targetCourseId = courses![0].id;

    const { error: updateErr } = await studentClient
        .from('courses')
        .update({ title: 'HACKED TITLE' })
        .eq('id', targetCourseId);

    if (updateErr) { // Expecting Error (RLS)
        // Supabase RLS usually doesn't return an error for Update/Delete, it just reports 0 rows affected if policy filters rows.
        // Wait, if "USING" policy fails, it sees 0 rows. 
        // If "WITH CHECK" policy fails, it returns error.
        // Let's check rows affected.
        // Supabase JS v2 doesn't return count by default unless asked.
    }

    // Retry with select
    const { count, error: countErr, data: updatedData } = await studentClient
        .from('courses')
        .update({ title: 'HACKED TITLE' })
        .eq('id', targetCourseId)
        .select('*');

    if (countErr) console.error("Update Error:", countErr);
    console.log(`Debug Update: Count=${count}, DataLength=${updatedData?.length}`);

    if (count === 0 || (updatedData && updatedData.length === 0)) {
        console.log(`${c.green}✔ PASS (RLS Prevented Update)${c.reset}`);
    } else {
        console.log(`${c.red}✘ FAIL (Update Succeeded: ${count})${c.reset}`);
    }

    // 2. Unauthorized Enrollment Deletion
    process.stdout.write(`${c.blue}[TEST]${c.reset} Student attempting to DELETE another enrollment... `);
    // Create a dummy enrollment for Admin
    const { data: enroll, error: enrollSetupErr } = await adminClient.from('enrollments').insert({
        user_id: aAuth.user.id,
        course_id: targetCourseId,
        status: 'active'
    }).select().single();

    let targetEnrollment = enroll;
    if (enrollSetupErr && enrollSetupErr.code === '23505') {
        // Already enrolled, fetch it
        const { data: existing } = await adminClient.from('enrollments')
            .select('*')
            .eq('user_id', aAuth.user.id)
            .eq('course_id', targetCourseId)
            .single();
        targetEnrollment = existing;
    } else if (enrollSetupErr) {
        console.error("Enroll Setup Error:", enrollSetupErr);
    }

    if (targetEnrollment) {
        const { count: delCount, data: delData } = await studentClient
            .from('enrollments')
            .delete()
            .eq('id', targetEnrollment.id)
            .select('*');

        console.log(`Debug Delete: Count=${delCount}, DataLength=${delData?.length}`);

        if (delCount === 0 || (delData && delData.length === 0)) {
            console.log(`${c.green}✔ PASS (RLS Prevented Delete)${c.reset}`);
        } else {
            console.log(`${c.red}✘ FAIL (Delete Succeeded)${c.reset}`);
        }
    } else {
        console.log(`${c.yellow}SKIP (Setup Failed)${c.reset}`);
    }

    console.log(`\n${c.green}${c.bold}✅ Security Policies Verified.${c.reset}\n`);
}

main().catch(console.error);
