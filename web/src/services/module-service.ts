import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

export const ModuleService = {
    // 1. Get Modules for a Course
    async getModules(courseId: string) {
        const { data, error } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true });

        if (error) throw error;
        return data;
    },

    async getCourseCurriculum(courseId: string) {
        // 1. Fetch Modules
        const { data: modules, error: modulesError } = await supabase
            .from('modules')
            .select('*')
            .eq('course_id', courseId)
            .order('position', { ascending: true });

        if (modulesError) throw modulesError;
        if (!modules || modules.length === 0) return [];

        const moduleIds = modules.map(m => m.id);

        // 2. Fetch Lessons
        const { data: lessons, error: lessonsError } = await supabase
            .from('lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('position', { ascending: true });

        if (lessonsError) throw lessonsError;

        // 3. Stitch together
        const modulesWithLessons = modules.map(module => ({
            ...module,
            lessons: lessons?.filter(l => l.module_id === module.id) || []
        }));

        return modulesWithLessons;
    },

    // 2. Create Module (Admin/Instructor)
    async createModule(moduleData: {
        course_id: string;
        title: string;
        description?: string;
        position: number;
        status: 'draft' | 'published';
        created_by: string; // Explicit audit param
    }) {
        const { data, error } = await supabase
            .from('modules')
            .insert({
                ...moduleData,
                updated_by: moduleData.created_by // Initial update is create user
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 3. Update Module
    async updateModule(moduleId: string, updates: any) {
        const { data, error } = await supabase
            .from('modules')
            .update(updates)
            .eq('id', moduleId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // 4. Delete Module (Soft or Hard delete depending on policy, usually hard for now)
    async deleteModule(moduleId: string) {
        const { error } = await supabase
            .from('modules')
            .delete()
            .eq('id', moduleId);

        if (error) throw error;
        return true;
    },

    // 5. Reorder Modules
    async reorderModules(items: { id: string; position: number }[]) {
        const { data, error } = await supabase
            .from('modules')
            .upsert(
                items.map(item => ({
                    id: item.id,
                    position: item.position,
                    updated_at: new Date().toISOString()
                } as any))
            )
            .select();

        if (error) throw error;
        return data;
    }
};
