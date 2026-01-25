import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const workbook = XLSX.utils.book_new();

        // 1. Course Settings Sheet
        const courseHeaders = [
            'Title',
            'Slug',
            'Subtitle',
            'Description',
            'Status',
            'Visibility',
            'Level',
            'Category'
        ];
        // Add one example row or just headers? Just headers is safer, or example data.
        // Let's add headers and an empty or example row. 
        // Example row is helpful.
        const courseData = [
            {
                'Title': 'My New Course Title',
                'Slug': 'my-new-course-slug',
                'Subtitle': 'A short description for the card',
                'Description': 'Full course description goes here',
                'Status': 'draft',
                'Visibility': 'private',
                'Level': 'Beginner',
                'Category': 'Development'
            }
        ];

        const courseSheet = XLSX.utils.json_to_sheet(courseData, { header: courseHeaders });
        XLSX.utils.book_append_sheet(workbook, courseSheet, 'Course Settings');

        // 2. Curriculum Sheet
        const curriculumHeaders = [
            'Module Title',
            'Lesson Title',
            'Lesson Type',
            'Content',
            'Video URL',
            'Duration (min)',
            'Free Preview',
            'Slug'
        ];

        const curriculumData = [
            {
                'Module Title': 'Module 1: Getting Started',
                'Lesson Title': 'Welcome to the Course',
                'Lesson Type': 'video',
                'Content': 'Welcome content...',
                'Video URL': 'https://vimeo.com/example',
                'Duration (min)': 5,
                'Free Preview': 'Yes',
                'Slug': 'welcome-lesson'
            }
        ];

        const curriculumSheet = XLSX.utils.json_to_sheet(curriculumData, { header: curriculumHeaders });
        XLSX.utils.book_append_sheet(workbook, curriculumSheet, 'Curriculum');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        return new NextResponse(buffer, {
            headers: {
                'Content-Disposition': 'attachment; filename="course_import_template.xlsx"',
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
        });
    } catch (error) {
        console.error('Template generation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
