import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const ProgressService = {
    // 1. Mark Lesson as Complete
    // NOTE: This will trigger 'award_xp_on_completion' and 'update_user_streak' in DB automatically.
    async completeLesson(userId: string, lessonId: string, courseId: string) {
        const { data, error } = await supabase
            .from('lesson_progress')
            .upsert(
                {
                    user_id: userId,
                    lesson_id: lessonId,
                    course_id: courseId,
                    status: 'completed',
                    completed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id, lesson_id' }
            )
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 2. Update Video Position (Watch time)
    async updateWatchTime(userId: string, lessonId: string, courseId: string, seconds: number) {
        const { data, error } = await supabase
            .from('lesson_progress')
            .upsert(
                {
                    user_id: userId,
                    lesson_id: lessonId,
                    course_id: courseId,
                    status: 'in_progress', // Don't mark complete, just progress
                    last_position_seconds: seconds,
                    updated_at: new Date().toISOString()
                },
                { onConflict: 'user_id, lesson_id' }
            );

        if (error) throw error;
        return data;
    },

    // 3. Get Course Progress Summary
    async getCourseProgress(userId: string, courseId: string) {
        const { count, error } = await supabase
            .from('lesson_progress')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('status', 'completed');

        if (error) throw error;
        return { completed_lessons: count || 0 };
    }
};
