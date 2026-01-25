import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();

        // 1. Auth Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Course Structure with all fields
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select(`
        title,
        slug,
        description,
        status,
        visibility,
        subtitle,
        level,
        category,
        modules (
          title,
          position,
          lessons (
            title,
            slug,
            position,
            type,
            is_free_preview,
            duration_seconds,
            lesson_contents (
                content_markdown,
                content_json
            )
          )
        )
      `)
            .eq('id', courseId)
            .single();

        if (courseError || !course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        // 3. Prepare Sheet 1: Course Settings
        const courseRows = [{
            'Title': course.title,
            'Slug': course.slug,
            'Subtitle': course.subtitle || '',
            'Description': course.description || '',
            'Status': course.status,
            'Visibility': course.visibility,
            'Level': course.level || '',
            'Category': course.category || ''
        }];

        // 4. Prepare Sheet 2: Curriculum
        const curriculumRows: any[] = [];

        // Sort modules by position
        const sortedModules = (course.modules || []).sort((a: any, b: any) => a.position - b.position);

        sortedModules.forEach((module: any) => {
            // Sort lessons by position
            const sortedLessons = (module.lessons || []).sort((a: any, b: any) => a.position - b.position);

            if (sortedLessons.length === 0) {
                // Add module even if no lessons
                curriculumRows.push({
                    'Module Title': module.title,
                    'Lesson Title': '',
                    'Lesson Type': '',
                    'Content': '',
                    'Video URL': '',
                    'Duration (min)': '',
                    'Free Preview': '',
                    'Slug': ''
                });
            } else {
                sortedLessons.forEach((lesson: any) => {
                    const contentValues = lesson.lesson_contents?.[0] || {};
                    const videoUrl = contentValues.content_json?.videoUrl || '';

                    curriculumRows.push({
                        'Module Title': module.title,
                        'Lesson Title': lesson.title,
                        'Lesson Type': lesson.type,
                        'Content': contentValues.content_markdown || '',
                        'Video URL': videoUrl,
                        'Duration (min)': lesson.duration_seconds ? Math.round(lesson.duration_seconds / 60) : 0,
                        'Free Preview': lesson.is_free_preview ? 'Yes' : 'No',
                        'Slug': lesson.slug
                    });
                });
            }
        });

        // Use Template if empty
        if (curriculumRows.length === 0) {
            curriculumRows.push({
                'Module Title': 'Introduction',
                'Lesson Title': 'Welcome',
                'Lesson Type': 'video',
                'Content': 'Welcome to the course',
                'Video URL': 'https://vimeo.com/...',
                'Duration (min)': 5,
                'Free Preview': 'Yes',
                'Slug': 'welcome-lesson'
            });
        }

        // 5. Generate Excel
        const workbook = XLSX.utils.book_new();

        // Sheet 1
        const courseSheet = XLSX.utils.json_to_sheet(courseRows);
        XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Settings');

        // Sheet 2
        const curriculumSheet = XLSX.utils.json_to_sheet(curriculumRows);
        XLSX.utils.book_append_sheet(workbook, curriculumSheet, 'Curriculum');

        const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        // 6. Return Response
        return new NextResponse(buf, {
            status: 200,
            headers: {
                'Content-Disposition': `attachment; filename="${course.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_full_export.xlsx"`,
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
