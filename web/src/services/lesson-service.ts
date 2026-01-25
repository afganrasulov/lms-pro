import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const LessonService = {
    // 1. Get Lesson Metadata (Public/Protected via RLS)
    async getLesson(slug: string) {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) throw error;
        return data;
    },

    // 2. Get Lesson Content (Strictly Protected via RLS)
    async getLessonContent(lessonId: string) {
        const { data, error } = await supabase
            .from('lesson_contents')
            .select('*')
            .eq('lesson_id', lessonId)
            .eq('is_current_version', true)
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Create Lesson Metadata
    async createLesson(lessonData: {
        course_id: string;
        module_id: string;
        title: string;
        slug: string;
        type: 'video' | 'text' | 'quiz' | 'assignment' | 'live_class';
        position: number;
        status: 'draft' | 'published';
        is_free_preview?: boolean;
        created_by: string;
    }) {
        const { data, error } = await supabase
            .from('lessons')
            .insert({
                ...lessonData,
                updated_by: lessonData.created_by
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 4. Update Lesson Content (Creates new version)
    async updateLessonContent(lessonId: string, markdown: string, contentJson?: any) {
        // First, unset previous current version
        await supabase
            .from('lesson_contents')
            .update({ is_current_version: false })
            .eq('lesson_id', lessonId);

        // Get max version
        const { data: maxVer } = await supabase
            .from('lesson_contents')
            .select('version')
            .eq('lesson_id', lessonId)
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const nextVersion = (maxVer?.version || 0) + 1;

        const { data, error } = await supabase
            .from('lesson_contents')
            .insert({
                lesson_id: lessonId,
                content_markdown: markdown,
                content_json: contentJson,
                version: nextVersion,
                is_current_version: true
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 5. Update Lesson Metadata
    async updateLesson(lessonId: string, updates: any) {
        const { data, error } = await supabase
            .from('lessons')
            .update(updates)
            .eq('id', lessonId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 6. Delete Lesson
    async deleteLesson(lessonId: string) {
        const { error } = await supabase
            .from('lessons')
            .delete()
            .eq('id', lessonId);

        if (error) throw error;
        return true;
    },

    // 7. Get User Progress for Course
    async getUserProgress(userId: string, courseId: string) {
        const { data, error } = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId);

        if (error) throw error;
        return data; // Returns array of progress items
    },

    // 8. Mark Lesson Complete
    async completeLesson(userId: string, courseId: string, lessonId: string) {
        const { data, error } = await supabase
            .from('lesson_progress')
            .upsert({
                user_id: userId,
                course_id: courseId,
                lesson_id: lessonId,
                status: 'completed',
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id,lesson_id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 9. Reorder Lessons
    async reorderLessons(items: { id: string; position: number; module_id: string }[]) {
        // Using Promise.all with individual updates to avoid potential Upsert/RLS constraint issues with partial data
        const updates = items.map(item =>
            supabase
                .from('lessons')
                .update({
                    position: item.position,
                    module_id: item.module_id,
                    updated_at: new Date().toISOString()
                })
                .eq('id', item.id)
                .select()
        );

        const results = await Promise.all(updates);

        // Check for first error
        const firstError = results.find(r => r.error)?.error;
        if (firstError) throw firstError;

        return results.map(r => r.data);
    }
};
