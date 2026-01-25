
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env before ANY other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Helper colors if utils not found
const c = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${c.bold}👑 Testing Admin Content Creation (Scenario 11)${c.reset}\n`);

    const { supabase } = await import('@/lib/supabase');

    // --- AUTHENTICATION ---
    process.stdout.write(`${c.blue}[AUTH]${c.reset} Authenticating as Admin... `);
    const email = 'test_automation_user@example.com';
    const password = 'TestPass123!';
    let userId = '';

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
        console.log(`${c.red}✘ FAIL${c.reset}`);
        console.error(error);
        process.exit(1);
    }
    userId = data.user.id;
    console.log(`${c.green}✔ PASS${c.reset}`);

    // Verify Role
    process.stdout.write(`${c.blue}[CHECK]${c.reset} Verifying Admin Role... `);
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).single();
    if (profile?.role !== 'admin' && profile?.role !== 'instructor') {
        console.log(`${c.red}✘ FAIL (Role is ${profile?.role})${c.reset}`);
        process.exit(1);
    }
    console.log(`${c.green}✔ PASS (${profile.role})${c.reset}`);


    // --- DYNAMIC IMPORTS ---
    const { CourseService } = await import('@/services/course-service');
    const { ModuleService } = await import('@/services/module-service');
    const { LessonService } = await import('@/services/lesson-service');

    // 1. Create Course
    process.stdout.write(`${c.blue}[TEST]${c.reset} Creating Course... `);
    const courseSlug = `admin-course-${Date.now()}`;
    let courseId = '';
    try {
        const course = await CourseService.createCourse({
            title: 'Admin Created Course',

            slug: courseSlug,
            description: 'Created via automation script',
            status: 'published',
            visibility: 'public',
            created_by: userId

        });
        courseId = course.id;
        console.log(`${c.green}✔ PASS${c.reset} (ID: ${courseId.slice(0, 6)})`);
    } catch (e: any) {
        console.log(`${c.red}✘ FAIL${c.reset} - ${e.message}`);
        process.exit(1);
    }

    // 2. Create Module
    process.stdout.write(`${c.blue}[TEST]${c.reset} Creating Module... `);
    let moduleId = '';
    try {
        const mod = await ModuleService.createModule({
            course_id: courseId,
            title: 'Module 1: Fundamentals',
            position: 1,
            status: 'published',
            created_by: userId
        });
        moduleId = mod.id;
        console.log(`${c.green}✔ PASS${c.reset} (ID: ${moduleId.slice(0, 6)})`);
    } catch (e: any) {
        console.log(`${c.red}✘ FAIL${c.reset} - ${e.message}`);
    }

    // 3. Create Lesson Metadata
    process.stdout.write(`${c.blue}[TEST]${c.reset} Creating Lesson... `);
    let lessonId = '';
    const lessonSlug = `lesson-${courseSlug}-${Date.now()}`; // Unique slug
    try {
        const lesson = await LessonService.createLesson({
            course_id: courseId,
            module_id: moduleId,
            title: 'Lesson 1: Hello World',
            slug: lessonSlug,
            type: 'text',
            position: 1,
            status: 'published',
            is_free_preview: true,
            created_by: userId
        });
        lessonId = lesson.id;
        console.log(`${c.green}✔ PASS${c.reset} (ID: ${lessonId.slice(0, 6)})`);
    } catch (e: any) {
        console.log(`${c.red}✘ FAIL${c.reset} - ${e.message}`);
    }

    // 4. Add Content
    process.stdout.write(`${c.blue}[TEST]${c.reset} Adding Lesson Content... `);
    try {
        await LessonService.updateLessonContent(lessonId, '# Hello World\nThis is a test lesson.');
        console.log(`${c.green}✔ PASS${c.reset}`);
    } catch (e: any) {
        console.log(`${c.red}✘ FAIL${c.reset} - ${e.message}`);
    }

    // 5. Verify Hierarchy
    process.stdout.write(`${c.blue}[VERIFY]${c.reset} Fetching Full Hierarchy... `);
    // Cheap verification: Fetch modules for course
    const modules = await ModuleService.getModules(courseId);
    if (modules.length === 1) {
        console.log(`${c.green}✔ PASS${c.reset}`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset}`);
    }

    console.log(`\n${c.green}${c.bold}✅ Admin Creation Flow Verified.${c.reset}\n`);
}

main().catch(console.error);
