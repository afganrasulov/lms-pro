import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

// Disable body parsing, handling with formData
export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Auth Check - STRICT
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);

        // --- Phase 1: Create Course from "Course Settings" ---
        const courseSheet = workbook.Sheets['Course Settings'];
        if (!courseSheet) {
            return NextResponse.json({ error: 'Missing "Course Settings" sheet' }, { status: 400 });
        }

        const courseDataRaw = XLSX.utils.sheet_to_json<any>(courseSheet);
        if (courseDataRaw.length === 0) {
            return NextResponse.json({ error: 'Course Settings sheet is empty' }, { status: 400 });
        }

        // Helper to find key case-insensitively
        const findVal = (row: any, key: string) => {
            const rowKey = Object.keys(row).find(k => k.toLowerCase() === key.toLowerCase());
            return rowKey ? row[rowKey] : undefined;
        };

        const row = courseDataRaw[0];
        const title = findVal(row, 'Title') || 'Untitled Course';
        const slug = findVal(row, 'Slug') || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const subtitle = findVal(row, 'Subtitle');
        const description = findVal(row, 'Description');
        const level = findVal(row, 'Level');
        const category = findVal(row, 'Category');
        const status = (findVal(row, 'Status') || 'draft').toLowerCase();
        const visibility = (findVal(row, 'Visibility') || 'private').toLowerCase();

        // Insert new course
        const { data: course, error: insertError } = await supabase
            .from('courses')
            .insert({
                title,
                slug: `${slug}-${Date.now()}`, // Ensure uniqueness
                description,
                subtitle,
                level,
                category,
                is_published: status === 'published',
                visibility: visibility as any,
                instructor_id: user.id
            })
            .select()
            .single();

        if (insertError) {
            console.error('Course creation error:', insertError);
            return NextResponse.json({ error: 'Failed to create course: ' + insertError.message }, { status: 500 });
        }

        const courseId = course.id;

        // --- Phase 2: Process Curriculum ---
        const curriculumSheetName = workbook.SheetNames.find(n => n.toLowerCase().trim() === 'curriculum');
        const curriculumSheet = curriculumSheetName ? workbook.Sheets[curriculumSheetName] : null;

        let moduleCount = 0;
        let modulesInserted = 0;
        let lessonsInserted = 0;
        if (curriculumSheet) {
            const rows = XLSX.utils.sheet_to_json<any>(curriculumSheet);

            // Group by Module (with Fill-Down logic for missing Module Titles)
            const modulesMap = new Map<string, any[]>();
            let lastSeenModuleTitle: string | null = null;

            rows.forEach((r: any, index: number) => {
                let moduleTitle = findVal(r, 'Module Title');

                // Handle merged cells or "fill down" behavior
                if (!moduleTitle && lastSeenModuleTitle) {
                    moduleTitle = lastSeenModuleTitle;
                }

                if (moduleTitle) {
                    // Update last seen for next rows
                    lastSeenModuleTitle = moduleTitle;

                    if (!modulesMap.has(moduleTitle)) {
                        modulesMap.set(moduleTitle, []);
                    }
                    modulesMap.get(moduleTitle)?.push(r);
                } else {
                    console.warn(`[Import] Row ${index + 2} skipped: No Module Title found.`);
                }
            });
            moduleCount = modulesMap.size;

            // Insert Modules & Lessons
            let moduleOrder = 0;
            for (const [moduleTitle, lessons] of modulesMap) {
                const { data: moduleData, error: modError } = await supabase
                    .from('modules')
                    .insert({
                        course_id: courseId,
                        title: moduleTitle,
                        position: moduleOrder++,
                        is_published: true
                    })
                    .select()
                    .single();

                if (modError) {
                    console.error('[(IMPORT) Module Insert Error]', modError);
                    continue;
                }
                console.log('[(IMPORT) Module Created]', moduleData.id, moduleTitle);
                modulesInserted++;

                const moduleId = moduleData.id;

                // Insert Lessons
                let lessonOrder = 0;
                for (const lessonRow of lessons) {
                    const lessonTitle = findVal(lessonRow, 'Lesson Title');
                    if (!lessonTitle) continue;

                    const type = (findVal(lessonRow, 'Lesson Type') || 'video').toLowerCase();
                    const content = findVal(lessonRow, 'Content');
                    const videoUrl = findVal(lessonRow, 'Video URL');
                    const durationRaw = findVal(lessonRow, 'Duration (min)');
                    const freePreviewRaw = findVal(lessonRow, 'Free Preview');
                    const lessonSlugRaw = findVal(lessonRow, 'Slug');

                    // Conversions
                    const duration = durationRaw ? Math.round(parseFloat(String(durationRaw)) * 60) : 0;
                    const isFree = String(freePreviewRaw).toLowerCase() === 'yes' || String(freePreviewRaw).toLowerCase() === 'true';
                    const lessonSlug = lessonSlugRaw || lessonTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                    const { data: newLesson, error: lessonError } = await supabase
                        .from('lessons')
                        .insert({
                            chapter_id: moduleId,
                            title: lessonTitle,
                            type: type as any, // Cast to match enum
                            duration: duration,
                            is_free: isFree,
                            slug: lessonSlug,
                            position: lessonOrder++,
                            is_published: true
                        })
                        .select()
                        .single();

                    if (lessonError) {
                        console.error('[(IMPORT) Lesson Insert Error]', lessonError);
                        continue;
                    }
                    console.log('[(IMPORT) Lesson Created]', newLesson.id, lessonTitle);
                    lessonsInserted++;

                    // Create lesson content
                    const contentJson = videoUrl ? { videoUrl } : null;

                    const { error: contentError } = await supabase
                        .from('lesson_contents')
                        .insert({
                            lesson_id: newLesson.id,
                            content_markdown: content,
                            content_json: contentJson,
                            version: 1,
                            is_current_version: true
                        });

                    if (contentError) {
                        console.error('Error creating lesson content:', contentError);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            courseId,
            debug: {
                modulesFound: moduleCount,
                modulesInserted,
                lessonsInserted
            }
        });

    } catch (error: any) {
        console.error('[IMPORT NEW] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
