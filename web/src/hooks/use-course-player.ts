import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CourseService } from '@/services/course-service';
import { LessonService } from '@/services/lesson-service';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useCoursePlayer(slug: string) {
    const router = useRouter();

    const [course, setCourse] = useState<any>(null);
    const [modules, setModules] = useState<any[]>([]);
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(true);
    const [allLessons, setAllLessons] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});

    // Unified Data Loader
    const loadData = async () => {
        if (!slug) return;
        // setLoading is not called here to prevent full-screen loader flashes on updates
        // We only want the initial load to be blocking

        try {
            // 1. Get User
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            // 2. Fetch full structure with content
            const foundCourse = await CourseService.getCourseBySlug(slug);

            if (foundCourse) {
                setCourse(foundCourse);

                // Sort modules by position
                const sortedModules = (foundCourse.modules || []).sort((a: any, b: any) => a.position - b.position);
                setModules(sortedModules);

                // Process lessons
                const flattened: any[] = [];
                // Only reset expansion on FIRST load (when list is empty)
                // Otherwise keep user's open/close state
                const shouldResetExpansion = Object.keys(expandedModules).length === 0;
                const expanded: Record<string, boolean> = { ...expandedModules };

                sortedModules.forEach((mod: any) => {
                    if (shouldResetExpansion) {
                        expanded[mod.id] = true; // Expand all by default initially
                    }
                    if (mod.lessons) {
                        mod.lessons.sort((a: any, b: any) => a.position - b.position);

                        // Sort contents to put current version first
                        mod.lessons.forEach((l: any) => {
                            if (l.lesson_contents && l.lesson_contents.length > 0) {
                                l.lesson_contents.sort((a: any, b: any) => {
                                    if (a.is_current_version === b.is_current_version) return 0;
                                    return a.is_current_version ? -1 : 1;
                                });
                            }
                        });

                        flattened.push(...mod.lessons);
                    }
                });

                setAllLessons(flattened);
                if (shouldResetExpansion) {
                    setExpandedModules(expanded);
                }

                // 3. Fetch Progress if user exists
                let completedSet = new Set<string>();
                if (currentUser) {
                    const progress = await LessonService.getUserProgress(currentUser.id, foundCourse.id);
                    if (progress) {
                        progress.forEach((p: any) => {
                            if (p.status === 'completed' || p.is_completed) {
                                completedSet.add(p.lesson_id);
                            }
                        });
                    }
                    setCompletedLessons(completedSet);
                }

                // 4. Set Active Lesson (Initial Load Only)
                // If activeLesson is already set, don't override it unless it was deleted
                if (!activeLesson && flattened.length > 0) {
                    const firstIncomplete = flattened.find((l: any) => !completedSet.has(l.id));
                    setActiveLesson(firstIncomplete || flattened[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load course:", error);
            // Only toast on initial error
            if (isLoading) toast.error("Failed to load course content");
        } finally {
            setIsLoading(false);
        }
    };

    // Initial Load
    useEffect(() => {
        setIsLoading(true);
        loadData();
    }, [slug]);

    // Real-time Progress and Content Sync
    useEffect(() => {
        if (!user || !course) return;

        const channel = supabase
            .channel('course_player_sync')
            // 1. User Progress Updates (Existing)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'lesson_progress',
                    filter: `user_id=eq.${user.id}`
                },
                (payload) => {
                    const newProgress = payload.new as any;
                    if (newProgress && allLessons.some(l => l.id === newProgress.lesson_id)) {
                        if (newProgress.is_completed || newProgress.status === 'completed') {
                            setCompletedLessons(prev => new Set(prev).add(newProgress.lesson_id));
                            router.refresh();
                        }
                    }
                }
            )
            // 2. Admin: Course Metadata Updates (Title, etc.)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'courses',
                    filter: `id=eq.${course.id}`
                },
                () => {
                    console.log('[Realtime] Course Updated');
                    loadData();
                }
            )
            // 3. Admin: Module Updates (Reorder, Add, Delete)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'modules',
                    filter: `course_id=eq.${course.id}`
                },
                () => {
                    console.log('[Realtime] Modules Changed');
                    loadData();
                }
            )
            // 4. Admin: Lesson Updates (Reorder, Add, Delete)
            // Note: Lessons table doesn't have course_id in all projects, so we listen globally
            // and filter by checking if the module_id belongs to a module in this course.
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lessons' },
                (payload) => {
                    const modId = (payload.new as any)?.module_id || (payload.old as any)?.module_id;
                    const isRelevant = modules.some(m => m.id === modId);

                    if (isRelevant) {
                        console.log('[Realtime] Lessons Changed');

                        // If it's just a content update (video/desc), we handle it more gracefully below
                        // But for structural changes (position, title, deletion), we reload.
                        // For simplicity in this iteration, we reload data to ensure order is correct.
                        loadData();
                    }
                }
            )
            // 5. Lesson Content Updates (Video/Markdown) - Granular Update
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lesson_contents' },
                (payload) => {
                    const updatedContent = payload.new as any;

                    // Check if we have this lesson
                    const parentLesson = allLessons.find(l => l.id === updatedContent?.lesson_id);
                    if (parentLesson && updatedContent) {
                        if (updatedContent.is_current_version) {
                            setAllLessons(prev => prev.map(l => {
                                if (l.id === updatedContent.lesson_id) {
                                    const otherContents = (l.lesson_contents || []).filter((c: any) => c.id !== updatedContent.id);
                                    return { ...l, lesson_contents: [updatedContent, ...otherContents] };
                                }
                                return l;
                            }));

                            if (activeLesson?.id === updatedContent.lesson_id) {
                                setActiveLesson((prev: any) => {
                                    const otherContents = (prev.lesson_contents || []).filter((c: any) => c.id !== updatedContent.id);
                                    return { ...prev, lesson_contents: [updatedContent, ...otherContents] };
                                });
                            }
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, course?.id, allLessons, router, activeLesson, modules]);

    const handleLessonSelect = (lesson: any) => {
        setActiveLesson(lesson);
        // On mobile, close sidebar
        if (window.innerWidth < 768) setIsSidebarOpen(false);
    };

    const toggleModule = (moduleId: string) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const markAsComplete = async (lessonId: string) => {
        if (!user || !course || !lessonId) return;

        // Optimistic update
        setCompletedLessons(prev => new Set(prev).add(lessonId));

        try {
            await LessonService.completeLesson(user.id, course.id, lessonId);
            toast.success("Lesson completed!");
            router.refresh(); // Sync server components
        } catch (error) {
            console.error("Failed to save progress", error);
            toast.error("Failed to save progress");
        }
    };

    // Navigation
    const currentIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;
    const hasNext = currentIndex >= 0 && currentIndex < allLessons.length - 1;
    const hasPrev = currentIndex > 0;

    const handleNext = async () => {
        // Mark current as complete
        if (activeLesson) {
            await markAsComplete(activeLesson.id);
        }

        // Move to next
        if (hasNext) {
            handleLessonSelect(allLessons[currentIndex + 1]);
        } else {
            toast.success("Course Completed! 🎉");
            router.push('/dashboard');
        }
    };

    const handlePrev = () => {
        if (hasPrev) handleLessonSelect(allLessons[currentIndex - 1]);
    };

    const onVideoEnded = () => {
        if (activeLesson) {
            markAsComplete(activeLesson.id);
        }
    };

    return {
        course,
        modules,
        activeLesson,
        isSidebarOpen,
        setIsSidebarOpen,
        isLoading,
        allLessons,
        completedLessons,
        expandedModules,
        handleLessonSelect,
        toggleModule,
        handleNext,
        handlePrev,
        hasNext,
        hasPrev,
        onVideoEnded
    };
}
