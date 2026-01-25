import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env before ANY other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Assuming we run from 'web' root, .env.local is in execution root or sibling
// Use process.cwd() as the base for .env.local lookup to be robust
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup colors for output
const colors = {
    reset: "\x1b[0m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    bold: "\x1b[1m",
};

// Global State for verification
let TEST_USER_ID = '';
let TEST_COURSE_ID = '';
let TEST_LESSON_ID = '';

async function runStep(name: string, fn: () => Promise<void>) {
    process.stdout.write(`${colors.blue}[TEST]${colors.reset} ${name}... `);
    try {
        await fn();
        console.log(`${colors.green}✔ PASS${colors.reset}`);
    } catch (error: any) {
        console.log(`${colors.red}✘ FAIL${colors.reset}`);
        console.error(`  Error: ${error.message}`);
        // console.error(error); // Uncomment for stack trace
        process.exit(1); // Fail fast
    }
}

async function main() {
    // Dynamic imports to ensure env vars are potentially active if services side-effect load them
    // (Though ideally services shouldn't side-effect load envs at top level, this is safer)
    const { CourseService } = await import('@/services/course-service');
    const { GamificationService } = await import('@/services/gamification-service');
    const { ProfileService } = await import('@/services/profile-service');
    const { ProgressService } = await import('@/services/progress-service');
    const { SettingsService } = await import('@/services/settings-service');

    console.log(`${colors.bold}🚀 Starting Automated Backend Verification...${colors.reset}\n`);

    // Initialize Supabase for Auth (Services use their own client, but we need one here for signup)
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // --- SCENARIO 1: ONBOARDING ---
    console.log(`${colors.yellow}📜 Scenario 1: New Student Journey${colors.reset}`);

    await runStep('Creating Test User', async () => {
        const email = `test-${Date.now()}@test.com`;
        const password = 'TestPassword123!';

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: 'Test Setup User'
                }
            }
        });

        if (error) throw error;
        if (!data.user) throw new Error('User creation failed');

        TEST_USER_ID = data.user.id;
        // We assume RLS allows users to insert their own profile/settings via DB Triggers usually,
        // or we might need to verify if the triggers fired.
        // Let's give DB a moment for async triggers
        await new Promise(r => setTimeout(r, 2000));
    });

    await runStep('Verifying Profile (Trigger Created)', async () => {
        const profile = await ProfileService.getMyProfile(TEST_USER_ID);
        if (!profile) throw new Error('Profile not found (Trigger might have failed)');
    });

    await runStep('Updating Profile Name', async () => {
        const updated = await ProfileService.updateProfile(TEST_USER_ID, {
            full_name: 'Automation Tester'
        });
        if (updated.full_name !== 'Automation Tester') throw new Error('Name update mismatch');
    });

    // --- SCENARIO 2: LEARNING ---
    console.log(`\n${colors.yellow}📜 Scenario 2: Learning Flow${colors.reset}`);

    await runStep('Fetching Courses', async () => {
        const courses = await CourseService.getPublicCourses();
        if (!courses || courses.length === 0) {
            // Warning: if no courses, we can't test enrollment. 
            // For verify script, we might want to assume at least 1 course exists.
            throw new Error('No public courses found. Cannot test enrollment.');
        }
        TEST_COURSE_ID = courses[0].id; // Pick first course
    });

    await runStep('Fetching Course Structure', async () => {
        const structure = await CourseService.getCourseStructure(TEST_COURSE_ID);
        if (!structure.modules[0]?.lessons[0]) {
            throw new Error('Course has no lessons to test.');
        }
        TEST_LESSON_ID = structure.modules[0].lessons[0].id;
    });

    await runStep('Starting Lesson (Progress)', async () => {
        // Usually "start" is just reading, but let's complete it
        const result = await ProgressService.completeLesson(
            TEST_USER_ID,
            TEST_LESSON_ID,
            TEST_COURSE_ID
        );
        // Note: completedLesson returns void or data depending on impl.
        // Assuming no error meant success.
    });

    await runStep('Verifying Course Progress', async () => {
        const progress = await ProgressService.getCourseProgress(TEST_USER_ID, TEST_COURSE_ID);
        // If we completed 1 lesson, progress > 0 ideally, or completed_lessons >= 1
        // The service implementation of getCourseProgress needs to return something checkable.
        if (!progress) throw new Error('No progress record found');
        if (progress.completed_lessons === 0) throw new Error('Progress count did not increase');
    });

    // --- SCENARIO 3: GAMIFICATION ---
    console.log(`\n${colors.yellow}📜 Scenario 3: Gamification Loop${colors.reset}`);

    await runStep('Checking XP Awarded', async () => {
        const stats = await GamificationService.getUserStats(TEST_USER_ID);
        if (stats.xp === 0) throw new Error('No XP awarded for lesson completion');
        console.log(`    (Current XP: ${stats.xp}, Streak: ${stats.streak})`);
    });

    await runStep('Checking Leaderboard Presence', async () => {
        const leaderboard = await GamificationService.getLeaderboard();
        const userEntry = leaderboard.find((u: any) => u.user_id === TEST_USER_ID);
        if (!userEntry) throw new Error('User not found in leaderboard');
        if (userEntry.weekly_xp === 0) throw new Error('Leaderboard XP is 0');
    });

    console.log(`\n${colors.green}${colors.bold}✅ ALL SYSTEMS GO! Backend is verified.${colors.reset}\n`);
}

main().catch(console.error);
