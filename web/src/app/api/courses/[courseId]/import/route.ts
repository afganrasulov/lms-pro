import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();

        // 1. Auth Check
        console.log('[IMPORT] Starting request for course:', courseId);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.log('[IMPORT] User not authenticated');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[IMPORT] User authenticated:', user.id);

        // 2. Parse Form Data
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const clearExisting = formData.get('clearExisting') === 'true';

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);

        // --- PROCESS SHEET 1: COURSE SETTINGS ---
        const courseSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('course'));
        if (courseSheetName) {
            const courseSheet = workbook.Sheets[courseSheetName];
            const courseData: any[] = XLSX.utils.sheet_to_json(courseSheet);

            if (courseData.length > 0) {
                const row = courseData[0];
                const updatePayload: any = {};

                // Map fields
                if (row['Title']) updatePayload.title = row['Title'];
                if (row['Slug']) updatePayload.slug = row['Slug'];
                if (row['Subtitle']) updatePayload.subtitle = row['Subtitle'];
                if (row['Description']) updatePayload.description = row['Description'];
                if (row['Status']) updatePayload.status = row['Status']; // validated by DB constraints usually
                if (row['Visibility']) updatePayload.visibility = row['Visibility'];
                if (row['Level']) updatePayload.level = row['Level'];
                if (row['Category']) updatePayload.category = row['Category'];

                if (Object.keys(updatePayload).length > 0) {
                    console.log('[IMPORT] Updating course settings:', updatePayload);
                    const { error: updateError } = await supabase
                        .from('courses')
                        .update(updatePayload)
                        .eq('id', courseId);

                    if (updateError) {
                        console.error('[IMPORT] Error updating course settings:', updateError);
                        // We continue even if course settings fail? Or stop? 
                        // Better to log and continue to curriculum or throw? 
                        // Let's log and proceed, but maybe warning is better.
                    }
                }
            }
        }

        // --- PROCESS SHEET 2: CURRICULUM ---
        // Look for 'Curriculum' or use the first sheet if only 1 exists (backward compatibility)
        let curriculumSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('curriculum'));
        if (!curriculumSheetName && workbook.SheetNames.length === 1) {
            curriculumSheetName = workbook.SheetNames[0];
        }

        if (!curriculumSheetName) {
            return NextResponse.json({ error: 'Curriculum sheet not found' }, { status: 400 });
        }

        const worksheet = workbook.Sheets[curriculumSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        console.log(`[IMPORT] Curriculum parsed. Rows: ${jsonData.length}`);

        if (jsonData.length === 0) {
            // It's possible to update just course settings, so not an error if curriculum is empty BUT usually we want both.
            // If clearExisting is true, we might end up with empty course.
            if (clearExisting) {
                // proceed to clear
            } else {
                return NextResponse.json({ success: true, message: 'Course settings updated. No curriculum data found.' });
            }
        }

        // 3. Clear Existing Data (Optional)
        if (clearExisting) {
            // Delete modules (cascade deletes lessons)
            const { error: deleteError } = await supabase
                .from('modules')
                .delete()
                .eq('course_id', courseId);

            if (deleteError) {
                console.error('Error clearing modules:', deleteError);
                return NextResponse.json({ error: 'Failed to clear existing curriculum' }, { status: 500 });
            }
        }

        // 4. Pre-process: Fill Down Module Titles (Handle Merged Cells)
        // Helper for robust header matching
        const getValue = (row: any, keys: string[]) => {
            const rowKeys = Object.keys(row);
            for (const key of keys) {
                // 1. Exact match
                if (row[key] !== undefined) return row[key];

                // 2. Case-insensitive & Trimmed match
                const foundKey = rowKeys.find(k =>
                    k.toLowerCase().trim() === key.toLowerCase().trim()
                );
                if (foundKey) return row[foundKey];
            }
            return undefined;
        };

        // We iterate and fill empty module titles with the last seen one.
        let lastModuleTitle = '';
        jsonData.forEach((row: any) => {
            const currentTitle = getValue(row, ['Module Title']);
            if (currentTitle && currentTitle.toString().trim()) {
                lastModuleTitle = currentTitle.toString().trim();
            }
            // Attach normalized key explicitly for next steps
            row['_moduleTitle'] = lastModuleTitle;
        });

        // A. Extract Unique Modules
        const uniqueModuleTitles = Array.from(new Set(
            jsonData
                .map((row: any) => row['_moduleTitle'])
                .filter(Boolean)
        ));

        if (uniqueModuleTitles.length === 0) {
            return NextResponse.json({ success: true, message: 'No modules found to import' });
        }

        // B. Get existing modules logic (Upsert preparation)
        let startModulePosition = 0;
        if (!clearExisting) {
            const { data: maxMod } = await supabase.from('modules').select('position').eq('course_id', courseId).order('position', { ascending: false }).limit(1).single();
            if (maxMod) startModulePosition = maxMod.position + 1;
        }

        // Group rows by module to calculate lesson positions accurately
        const rowsByModule = new Map<string, any[]>();
        jsonData.forEach((row: any) => {
            const mTitle = row['_moduleTitle'];
            if (!mTitle) return;
            if (!rowsByModule.has(mTitle)) rowsByModule.set(mTitle, []);
            rowsByModule.get(mTitle)?.push(row);
        });

        // Loop through unique module titles and insert sequentially (safer for FK relations than bulk in this context)
        let lessonsInserted = 0;
        const insertedModulesList = [];

        for (let i = 0; i < uniqueModuleTitles.length; i++) {
            const moduleTitle = uniqueModuleTitles[i] as string;
            const currentPosition = startModulePosition + i;

            // Insert Module
            const { data: moduleData, error: modError } = await supabase
                .from('modules')
                .insert({
                    course_id: courseId,
                    title: moduleTitle,
                    position: currentPosition,
                    created_by: user.id,
                    status: 'published'
                })
                .select()
                .single();

            if (modError) {
                console.error(`[(IMPORT) Module Insert Error] Title: ${moduleTitle}`, modError);
                continue;
            }

            insertedModulesList.push(moduleData);
            const moduleId = moduleData.id;

            // Get Rows for this Module
            const rows = rowsByModule.get(moduleTitle) || [];
            console.log(`[IMPORT] Processing module "${moduleTitle}" (ID: ${moduleId}) with ${rows.length} rows`);

            // Prepare Lessons for this Module
            const currentModuleLessons: {
                course_id: string;
                chapter_id: string;
                title: string;
                type: 'video' | 'quiz' | 'text';
                position: number;
                duration: number;
                is_free: boolean | undefined;
                slug: string;
                _content: string;
                _videoUrl: string;
            }[] = [];

            rows.forEach((row, index) => {
                const lessonTitle = getValue(row, ['Lesson Title'])?.toString().trim();
                if (!lessonTitle) return;

                const lessonType = (getValue(row, ['Lesson Type']) || 'video').toString().toLowerCase();
                const content = getValue(row, ['Content']) || '';
                const videoUrl = getValue(row, ['Video URL']) || '';
                const durationMin = parseFloat(getValue(row, ['Duration (min)']) || '0');
                const durationSec = Math.round(durationMin * 60);
                const isFreeRaw = getValue(row, ['Free Preview']);
                const isFree = isFreeRaw && (isFreeRaw.toString().toLowerCase() === 'yes' || isFreeRaw === true);
                const slugOverride = getValue(row, ['Slug']);

                let type: 'video' | 'quiz' | 'text' = 'text';
                if (videoUrl) {
                    type = 'video';
                } else if (lessonType === 'quiz') {
                    type = 'quiz';
                }

                const finalSlug = slugOverride
                    ? slugOverride.toString().trim()
                    : lessonTitle.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.random().toString(36).substr(2, 9);

                currentModuleLessons.push({
                    course_id: courseId,
                    chapter_id: moduleId,
                    title: lessonTitle,
                    type: type,
                    position: index,
                    duration: durationSec,
                    is_free: isFree,
                    slug: finalSlug,
                    _content: content,
                    _videoUrl: videoUrl
                });
            });

            // Insert Lessons for this Module (Bulk insert lessons for 1 module is fine)
            if (currentModuleLessons.length > 0) {
                const lessonsPayload = currentModuleLessons.map(({ _content, _videoUrl, ...rest }) => rest);

                const { data: createdLessons, error: lessonError } = await supabase
                    .from('lessons')
                    .insert(lessonsPayload)
                    .select('id');

                if (lessonError) {
                    console.error('[(IMPORT) Lesson Insert Error]', lessonError);
                    continue;
                }

                lessonsInserted += createdLessons.length;

                // Handle Content
                const contentPayload = [];
                if (createdLessons && createdLessons.length === lessonsPayload.length) {
                    for (let k = 0; k < createdLessons.length; k++) {
                        const l = createdLessons[k];
                        const origin = currentModuleLessons[k];
                        if (origin._content || origin._videoUrl) {
                            contentPayload.push({
                                lesson_id: l.id,
                                content_markdown: origin._content || '',
                                content_json: origin._videoUrl ? { videoUrl: origin._videoUrl } : null,
                                version: 1,
                                is_current_version: true
                            });
                        }
                    }
                    if (contentPayload.length > 0) {
                        await supabase.from('lesson_contents').insert(contentPayload);
                    }
                }
            }
        }

        console.log('[IMPORT] Bulk Completed successfully');
        return NextResponse.json({
            success: true,
            message: 'Import completed successfully',
            debug: {
                modulesFound: uniqueModuleTitles.length,
                modulesInserted: insertedModulesList.length,
                lessonsInserted,
                lessonsProcessed: lessonsInserted // Approximately correct for now
            }
        });

    } catch (error: any) {
        console.error('[IMPORT] Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
