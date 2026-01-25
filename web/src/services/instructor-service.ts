import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Client reused from singleton

export const InstructorService = {
    // 1. Get Course Instructors
    async getInstructors(courseId: string) {
        const { data, error } = await supabase
            .from('course_instructors')
            .select(`
        *,
        profiles (full_name, avatar_url)
      `)
            .eq('course_id', courseId);

        if (error) throw error;
        return data;
    },

    // 2. Add Instructor (Owner/Admin Only)
    async addInstructor(courseId: string, userId: string, role: 'editor' | 'viewer' = 'viewer') {
        const { data, error } = await supabase
            .from('course_instructors')
            .insert({
                course_id: courseId,
                user_id: userId,
                role: role
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Remove Instructor
    async removeInstructor(courseId: string, userId: string) {
        const { error } = await supabase
            .from('course_instructors')
            .delete()
            .eq('course_id', courseId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    }
};
