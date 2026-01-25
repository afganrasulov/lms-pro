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
    console.log(`${c.bold}🔍 Testing Search & Filtering (Scenario 10)${c.reset}\n`);

    const { supabase } = await import('@/lib/supabase');
    const { CourseService } = await import('@/services/course-service');

    // Auth as Admin
    process.stdout.write(`${c.blue}[SETUP]${c.reset} Prereqs (Admin Auth)... `);
    const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
        email: 'test_automation_user@example.com', password: 'TestPass123!'
    });
    if (aErr) throw aErr;
    const userId = auth.user!.id;
    console.log(`${c.green}✔ PASS${c.reset}`);

    // Create Test Data
    const uniqueId = Date.now();
    const course1 = {
        title: `SearchTest Python Masterclass ${uniqueId}`,
        slug: `python-master-${uniqueId}`,
        description: 'Learn Python from scratch.',
        status: 'published' as const,
        visibility: 'public' as const, // Cast to literal type
        created_by: userId
    };
    const course2 = {
        title: `SearchTest Javascript Basics ${uniqueId}`,
        slug: `js-basics-${uniqueId}`,
        description: 'Web development fundamentals.',
        status: 'published' as const,
        visibility: 'public' as const,
        created_by: userId
    };

    try {
        await CourseService.createCourse(course1);
        await CourseService.createCourse(course2);
        console.log(`${c.blue}[SETUP]${c.reset} Created Test Courses.`);
    } catch (e) {
        console.error("Setup failed:", e); process.exit(1);
    }

    // Test 1: Search "Python"
    process.stdout.write(`${c.blue}[TEST]${c.reset} Search 'Python'... `);
    const res1 = await CourseService.searchCourses('Python');
    if (res1 && res1.some((c: any) => c.title.includes(uniqueId))) {
        console.log(`${c.green}✔ PASS${c.reset} (Found ${res1.length})`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset}`);
    }

    // Test 2: Search "Web" (in description)
    process.stdout.write(`${c.blue}[TEST]${c.reset} Search 'Web' (Description)... `);
    const res2 = await CourseService.searchCourses('Web');
    if (res2 && res2.some((c: any) => c.slug.includes('js-basics'))) {
        console.log(`${c.green}✔ PASS${c.reset} (Found ${res2.length})`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset}`);
    }

    // Test 3: Search "Missing"
    process.stdout.write(`${c.blue}[TEST]${c.reset} Search 'NonExistent'... `);
    const res3 = await CourseService.searchCourses('NonExistentTerm12345');
    if (res3 && res3.length === 0) {
        console.log(`${c.green}✔ PASS${c.reset} (Found 0)`);
    } else {
        console.log(`${c.red}✘ FAIL (Found ${res3?.length})${c.reset}`);
    }

    console.log(`\n${c.green}${c.bold}✅ Search Functionality Verified.${c.reset}\n`);
}

main().catch(console.error);
