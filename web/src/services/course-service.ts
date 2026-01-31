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
        // 1. Fetch Courses (Base Data)
        // @ts-ignore - DB schema has cover_image_path, Types have image_url
        const { data: courses, error: coursesError } = await supabaseClient
            .from('courses')
            .select('id, title, slug, description, image_url:cover_image_path, level, created_at')
            .eq('status', 'published')
            .eq('visibility', 'public')
            .order('created_at', { ascending: false }) as any;

        if (coursesError) throw coursesError;
        if (!courses || courses.length === 0) return [];

        const courseIds = courses.map((c: any) => c.id);

        // 2. Parallel Fetching of Dependencies
        // We combine all secondary requests into a single Promise.all to minimize latency (Waterfall Fix)
        const [modulesResult, progressResult, enrollmentsResult] = await Promise.all([
            // A. Fetch Modules & Lessons (Deep Join) - efficient aggregation
            supabaseClient
                .from('modules')
                .select('id, course_id, lessons(id, duration, is_published)')
                .in('course_id', courseIds),

            // B. Fetch User Progress (if logged in)
            userId ? supabaseClient
                .from('course_progress_summary' as any)
                .select('course_id, progress_percent')
                .eq('user_id', userId)
                .in('course_id', courseIds) as any
                : Promise.resolve({ data: [] }),

            // C. Fetch Enrollments (if logged in)
            userId ? supabaseClient
                .from('enrollments' as any)
                .select('course_id')
                .eq('user_id', userId)
                .eq('status', 'active')
                .in('course_id', courseIds) as any
                : Promise.resolve({ data: [] })
        ]);

        const modules = modulesResult.data || [];
        const progressData = progressResult.data || [];
        const enrollmentData = enrollmentsResult.data || [];

        // 3. Process & Map Data (In-Memory Aggregation)

        // Map: CourseID -> Lessons List (derived from modules)
        const courseLessonsMap = new Map<string, any[]>();
        modules.forEach((m: any) => {
            const validLessons = m.lessons?.filter((l: any) => l.is_published) || [];
            const existing = courseLessonsMap.get(m.course_id) || [];
            courseLessonsMap.set(m.course_id, [...existing, ...validLessons]);
        });

        // Map: CourseID -> Progress %
        const progressMap = new Map<string, number>();
        progressData.forEach((p: any) => progressMap.set(p.course_id, p.progress_percent || 0));

        // Set: Enrolled Course IDs
        const enrolledSet = new Set<string>();
        enrollmentData.forEach((e: any) => enrolledSet.add(e.course_id));

        // 4. Transform to CourseWithMeta
        const result: CourseWithMeta[] = courses.map((course: any, index: number) => {
            const lessons = courseLessonsMap.get(course.id) || [];
            const totalLessons = lessons.length;
            const totalDuration = lessons.reduce((acc, curr) => acc + (curr.duration || 0), 0);

            const userProgress = progressMap.get(course.id) ?? null;
            const isEnrolled = enrolledSet.has(course.id);

            // Locking Logic (Simple Sequential)
            let isLocked = false;
            if (index > 0) {
                const prevCourse = courses[index - 1];
                const prevProgress = progressMap.get(prevCourse.id) || 0;
                // Only lock if NOT enrolled and previous not complete? 
                // Or strict curriculum? Assuming strict for now but unlocking if enrolled.
                if (prevProgress < 100 && !isEnrolled) {
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
            .from('courses' as any)
            .select('*, image_url:cover_image_path')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Course;
    },

    async getCourseBySlug(slug: string) {
        // 1. Fetch Course details
        const { data, error: courseError } = await supabase
            .from('courses' as any)
            .select('*, image_url:cover_image_path')
            .eq('slug', slug)
            .single();

        const course = data as any;

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

    async getUserEnrolledCourses(supabaseClient: SupabaseClient<Database>, userId: string): Promise<CourseWithMeta[]> {
        // 1. Fetch Enrollments with Course Details
        const { data: enrollments, error } = await supabaseClient
            .from('enrollments' as any)
            .select('*, courses(*)')
            .eq('user_id', userId)
            .eq('status', 'active') as any;

        if (error) throw error;
        if (!enrollments || enrollments.length === 0) return [];

        const courses: Course[] = enrollments.map((e: any) => e.courses as unknown as Course);
        const courseIds = courses.map(c => c.id);

        if (courseIds.length === 0) return [];

        // 2. Parallel Fetching: Modules, Lessons, Progress
        // We fetch all related data in parallel to minimize waterfall
        const [modulesResult, lessonsResult, progressResult] = await Promise.all([
            supabaseClient
                .from('modules')
                .select('id, course_id')
                .in('course_id', courseIds),

            supabaseClient
                .from('lessons')
                .select('id, chapter_id, duration, is_published')
                .eq('is_published', true)
                .in('chapter_id', (
                    await supabaseClient.from('modules').select('id').in('course_id', courseIds)
                ).data?.map(m => m.id) || []),

            supabaseClient
                .from('course_progress_summary' as any)
                .select('course_id, progress_percent')
                .eq('user_id', userId)
                .in('course_id', courseIds) as any
        ]);

        const modules = modulesResult.data || [];
        const lessons = lessonsResult.data || [];
        const progressData = progressResult.data || [];

        // 3. Data Mapping efficiently
        const moduleIdToCourseId = new Map<string, string>();
        modules.forEach(m => moduleIdToCourseId.set(m.id, m.course_id));

        const progressMap = new Map<string, number>();
        progressData.forEach((p: any) => progressMap.set(p.course_id, p.progress_percent || 0));

        // 4. Transform to CourseWithMeta
        return courses.map(course => {
            const courseLessons = lessons.filter(l => {
                const cId = moduleIdToCourseId.get(l.chapter_id);
                return cId === course.id;
            });

            const totalLessons = courseLessons.length;
            const totalDuration = courseLessons.reduce((acc, curr) => acc + (curr.duration || 0), 0);
            const userProgress = progressMap.get(course.id) ?? 0;

            return {
                ...course,
                total_lessons: totalLessons,
                total_duration: totalDuration,
                user_progress: userProgress,
                is_enrolled: true,
                is_locked: false
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
            .from('enrollments' as any)
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('status', 'active')
            .single() as any;

        if (!error && data) return true;
        return false;
    },

    async enrollUser(supabaseClient: SupabaseClient<Database> | null, userId: string, courseId: string, source: string = 'web') {
        const client = supabaseClient || supabase;
        const { error } = await client
            .from('enrollments' as any)
            .insert({
                user_id: userId,
                course_id: courseId,
                status: 'active',
                source: source
            }) as any;

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
