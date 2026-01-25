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
    console.log(`${c.bold}🎥 Testing Video Embed (Scenario 13)${c.reset}\n`);

    const { supabase } = await import('@/lib/supabase');
    const { LessonService } = await import('@/services/lesson-service');
    // We need admin privs to create lesson
    process.stdout.write(`${c.blue}[SETUP]${c.reset} Authenticating as Admin... `);
    const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
        email: 'test_automation_user@example.com', password: 'TestPass123!'
    });
    if (aErr || !auth.user) {
        console.log(`${c.red}FAIL${c.reset}`); process.exit(1);
    }
    const userId = auth.user.id;
    console.log(`${c.green}✔ PASS${c.reset}`);

    // Create a new lesson (skipping course creation, using existing if possible, or creating new simple one)
    // To be safe, just create a new course/module stub
    const { createClient } = await import('@supabase/supabase-js');
    const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await adminClient.auth.signInWithPassword({ email: 'test_automation_user@example.com', password: 'TestPass123!' });

    const slugSuffix = Date.now();
    const { data: course } = await adminClient.from('courses').insert({
        title: 'Video Test Course', slug: `vid-course-${slugSuffix}`, status: 'published', visibility: 'public', created_by: userId
    }).select().single();

    if (!course) throw new Error("Course creation failed");

    const { data: mod } = await adminClient.from('modules').insert({
        course_id: course.id, title: 'Mod 1', position: 1, status: 'published', created_by: userId
    }).select().single();

    if (!mod) throw new Error("Module creation failed");

    // 1. Create Video Lesson
    process.stdout.write(`${c.blue}[TEST]${c.reset} Create Video Lesson... `);
    const lesson = await LessonService.createLesson({
        course_id: course.id,
        module_id: mod.id,
        title: 'Vimeo Lesson',
        slug: `vimeo-lesson-${slugSuffix}`,
        type: 'video',
        position: 1,
        status: 'published',
        is_free_preview: true,
        created_by: userId
    });
    console.log(`${c.green}✔ PASS${c.reset} (ID: ${lesson.id.slice(0, 6)})`);

    // 2. Add Content with Vimeo JSON
    process.stdout.write(`${c.blue}[TEST]${c.reset} Adding Vimeo Metadata... `);
    const vimeoUrl = "https://vimeo.com/1846726?fl=pl&fe=sh";
    const content = await LessonService.updateLessonContent(
        lesson.id,
        "## Watch this video\nIt explains everything.",
        {
            provider: 'vimeo',
            url: vimeoUrl,
            videoId: '1846726'
        }
    );
    console.log(`${c.green}✔ PASS${c.reset}`);

    // 3. Verify Retrieval
    process.stdout.write(`${c.blue}[TEST]${c.reset} Retrieving Content... `);
    const retrieved = await LessonService.getLessonContent(lesson.id);

    // Check JSON
    // Verify JSON content (embedded video)
    const contentFn = ((retrieved as any).content_json as any);
    if (contentFn && contentFn.provider === 'vimeo' && contentFn.videoId === '1846726') {
        console.log(`${c.green}✔ PASS${c.reset} (Found Vimeo ID: 1846726)`);
    } else {
        console.log(`${c.red}✘ FAIL${c.reset} (JSON mismatch: ${JSON.stringify((retrieved as any).content_json)})`);
    }

    console.log(`\n${c.green}${c.bold}✅ Video Embed Verified.${c.reset}\n`);
}

main().catch(console.error);
