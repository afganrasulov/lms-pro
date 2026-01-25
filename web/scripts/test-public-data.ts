import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env before imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Colors
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    blue: "\x1b[34m",
    red: "\x1b[31m",
    bold: "\x1b[1m"
};

async function main() {
    console.log(`${colors.bold}🔍 Testing Public Data Access (No Auth Required)${colors.reset}\n`);

    // Import Services dynamically to ensure env vars are loaded
    const { CourseService } = await import('@/services/course-service');
    const { GamificationService } = await import('@/services/gamification-service');
    const { InstructorService } = await import('@/services/instructor-service');

    // 1. Fetch Public Courses
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Public Courses... `);
    try {
        const courses = await CourseService.getPublicCourses();
        console.log(`${colors.green}✔ PASS${colors.reset} (${courses?.length || 0} found)`);

        if (courses && courses.length > 0) {
            console.log(`    Latest: ${courses[0].title}`);
        }
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(e.message);
    }

    // 2. Fetch Leaderboard
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Leaderboard... `);
    try {
        const leaderboard = await GamificationService.getLeaderboard();
        console.log(`${colors.green}✔ PASS${colors.reset} (${leaderboard?.length || 0} entries)`);
    } catch (e: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(e.message);
    }

    // 3. Fetch Instructors (if any course exists)
    // We can't easily fetch instructors without a known course ID, but we can skip if no courses.
    // Assuming we have courses from step 1
    const courses = await CourseService.getPublicCourses();
    if (courses && courses.length > 0) {
        const courseId = courses[0].id;
        process.stdout.write(`${colors.blue}[TEST]${colors.reset} Fetching Instructors for Course ${courseId.slice(0, 8)}... `);
        try {
            const instructors = await InstructorService.getInstructors(courseId);
            console.log(`${colors.green}✔ PASS${colors.reset} (${instructors?.length || 0} found)`);
        } catch (e: any) {
            console.log(`${colors.red}✘ FAIL${colors.reset}`);
            console.error(e.message);
        }
    }

    console.log(`\n${colors.bold}Done.${colors.reset}`);
}

main().catch(console.error);
