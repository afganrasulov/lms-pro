import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { CourseWithMeta, Course, CourseInsert, CourseUpdate } from '@/types/index';
import { Database } from '@/types/database.types';

export const CourseService = {

    // --- Data Fetching (Server/Client Hybrid) ---

    /**
     * Fetches all published courses with added metadata (lesson count, duration, user progress).
     * optimized for the /courses page.
     */
    async getPublishedCoursesWithProgress(
        supabaseClient: SupabaseClient<Database>,
        userId?: string
    ): Promise<CourseWithMeta[]> {
        // 1. Fetch Courses
        const { data: courses, error: coursesError } = await supabaseClient
            .from('courses')
            .select('*')
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('position', { ascending: true })
            .order('created_at', { ascending: false });

        if (coursesError) throw coursesError;
        if (!courses || courses.length === 0) return [];

        const courseIds = courses.map(c => c.id);

        // 2. Fetch Aggregated Lesson Data (Count & Duration)
        const { data: lessons } = await supabaseClient
            .from('lessons')
            .select('id, module_id, duration_seconds, status')
            .in('module_id', (
                await supabaseClient.from('modules').select('id').in('course_id', courseIds)
            ).data?.map(m => m.id) || [])
            .eq('status', 'published');

        // Link lessons to courses via modules
        const { data: modules } = await supabaseClient
            .from('modules')
            .select('id, course_id')
            .in('course_id', courseIds);

        const moduleIdToCourseId = new Map<string, string>();
        modules?.forEach(m => moduleIdToCourseId.set(m.id, m.course_id));

        // 3. User Progress & Enrollment
        let enrollmentsMap = new Set<string>();
        let progressMap = new Map<string, number>();

        if (userId) {
            const { data: progressData } = await supabaseClient
                .from('course_progress_summary')
                .select('course_id, progress_percent')
                .eq('user_id', userId);

            progressData?.forEach(p => progressMap.set(p.course_id, p.progress_percent || 0));

            const { data: enrollmentData } = await supabaseClient
                .from('enrollments')
                .select('course_id')
                .eq('user_id', userId)
                .eq('status', 'active');

            enrollmentData?.forEach(e => enrollmentsMap.add(e.course_id));
        }

        const result: CourseWithMeta[] = courses.map((course, index) => {
            const courseLessons = lessons?.filter(l => {
                const cId = moduleIdToCourseId.get(l.module_id);
                return cId === course.id;
            }) || [];

            const totalLessons = courseLessons.length;
            const totalDuration = courseLessons.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
            const userProgress = progressMap.get(course.id) ?? null;
            const isEnrolled = enrollmentsMap.has(course.id);

            let isLocked = false;
            // Simple locking: Lock if previous course not complete
            // TODO: Refine locking logic based on strict curriculum rules
            if (index > 0) {
                const prevCourse = courses[index - 1];
                const prevProgress = progressMap.get(prevCourse.id) || 0;
                if (prevProgress < 100) {
                    isLocked = true;
                }
            }

            return {
                ...course,
                total_lessons: totalLessons,
                total_duration: totalDuration,
                user_progress: userProgress,
                is_enrolled: isEnrolled,
                is_locked: isLocked
            };
        });

        return result;
    },

    async getAdminCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    },

    async getCourseById(id: string) {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Course;
    },

    async getCourseBySlug(slug: string) {
        // 1. Fetch Course details
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('slug', slug)
            .single();

        if (courseError) throw courseError;

        // 2. Fetch Modules with Lessons
        const { data: modules, error: modError } = await supabase
            .from('modules')
            .select('*, lessons(*, lesson_contents(*))')
            .eq('course_id', course.id)
            .order('position');

        if (modError) throw modError;

        // Sort lessons
        const sortedModules = modules?.map(m => ({
            ...m,
            lessons: (m.lessons as any[]).sort((a, b) => a.position - b.position)
        }));

        return {
            ...course,
            modules: sortedModules || []
        };
    },

    async getPublicCourses() {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('position', { ascending: true });

        if (error) throw error;
        return data as Course[];
    },

    async getUserEnrolledCourses(userId: string): Promise<CourseWithMeta[]> {
        // Fetch enrollments with course details
        const { data: enrollments, error } = await supabase
            .from('enrollments')
            .select('*, courses(*)')
            .eq('user_id', userId)
            .eq('status', 'active');

        if (error) throw error;
        if (!enrollments || enrollments.length === 0) return [];

        const courses = enrollments.map(e => e.courses as unknown as Course);
        const courseIds = courses.map(c => c.id);

        // Fetch Metadata (Lessons)
        const { data: lessons } = await supabase
            .from('lessons')
            .select('id, module_id, duration_seconds, status')
            .in('module_id', (
                await supabase.from('modules').select('id').in('course_id', courseIds)
            ).data?.map(m => m.id) || [])
            .eq('status', 'published');

        // Link lessons to courses via modules
        const { data: modules } = await supabase
            .from('modules')
            .select('id, course_id')
            .in('course_id', courseIds);

        const moduleIdToCourseId = new Map<string, string>();
        modules?.forEach(m => moduleIdToCourseId.set(m.id, m.course_id));

        // Progress
        let progressMap = new Map<string, number>();
        const { data: progressData } = await supabase
            .from('course_progress_summary')
            .select('course_id, progress_percent')
            .eq('user_id', userId)
            .in('course_id', courseIds);

        progressData?.forEach(p => progressMap.set(p.course_id, p.progress_percent || 0));

        return courses.map(course => {
            const courseLessons = lessons?.filter(l => {
                const cId = moduleIdToCourseId.get(l.module_id);
                return cId === course.id;
            }) || [];

            const totalLessons = courseLessons.length;
            const totalDuration = courseLessons.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
            const userProgress = progressMap.get(course.id) ?? 0;

            return {
                ...course,
                total_lessons: totalLessons,
                total_duration: totalDuration,
                user_progress: userProgress,
                is_enrolled: true,
                is_locked: false // Enrolled courses are never locked implicitly here
            };
        });
    },

    async getCourseStructure(courseId: string) {
        // 1. Fetch Course details
        const { data: course, error: courseError } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();

        if (courseError) throw courseError;

        // 2. Fetch Modules with Lessons
        const { data: modules, error: modError } = await supabase
            .from('modules')
            .select('*, lessons(*)')
            .eq('course_id', courseId)
            .order('position');

        if (modError) throw modError;

        // Sort lessons (assuming Supabase order isn't guaranteed)
        const sortedModules = modules?.map(m => ({
            ...m,
            lessons: (m.lessons as any[]).sort((a, b) => a.position - b.position)
        }));

        return {
            ...course,
            modules: sortedModules || []
        };
    },

    // --- CRUD Actions ---

    async createCourse(courseData: CourseInsert) {
        const { data, error } = await supabase
            .from('courses')
            .insert(courseData)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateCourse(id: string, updates: CourseUpdate) {
        const { data, error } = await supabase
            .from('courses')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteCourse(id: string) {
        const { error } = await supabase
            .from('courses')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async deleteCourses(ids: string[]) {
        const { error } = await supabase
            .from('courses')
            .delete()
            .in('id', ids);

        if (error) throw error;
    },

    async updateCoursePositions(courses: Course[]) {
        const { error } = await supabase
            .from('courses')
            .upsert(
                courses.map(c => ({
                    ...c,
                    updated_at: new Date().toISOString()
                }))
            );

        if (error) throw error;
    },

    // --- Access Control ---

    async checkAccess(userId: string, courseId: string) {
        const { data, error } = await supabase
            .from('enrollments')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .single();

        if (!error && data) return true;
        return false;
    },

    async enrollUser(supabaseClient: SupabaseClient<Database> | null, userId: string, courseId: string, source: string = 'web') {
        const client = supabaseClient || supabase;
        const { error } = await client
            .from('enrollments')
            .insert({
                user_id: userId,
                course_id: courseId,
                status: 'active',
                source: source
            });

        if (error) {
            // If unique constraint violation (already enrolled), ignore
            if (error.code === '23505') return;
            throw error;
        }
    },

    async searchCourses(query: string) {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .ilike('title', `%${query}%`)
            .eq('status', 'published')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }
};
