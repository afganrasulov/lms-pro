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

    useEffect(() => {
        async function loadData() {
            if (!slug) return;
            setIsLoading(true);
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
                    const expanded: Record<string, boolean> = {};

                    sortedModules.forEach((mod: any) => {
                        expanded[mod.id] = true; // Expand all by default for now
                        if (mod.lessons) {
                            mod.lessons.sort((a: any, b: any) => a.position - b.position);
                            flattened.push(...mod.lessons);
                        }
                    });
                    setAllLessons(flattened);
                    setExpandedModules(expanded);

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

                    // 4. Set Active Lesson
                    // Find first incomplete lesson, or default to first lesson
                    if (flattened.length > 0) {
                        const firstIncomplete = flattened.find((l: any) => !completedSet.has(l.id));
                        setActiveLesson(firstIncomplete || flattened[0]);
                    }
                }
            } catch (error) {
                console.error("Failed to load course:", error);
                toast.error("Failed to load course content");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [slug]);

    // Real-time Progress Sync
    useEffect(() => {
        if (!user || !course) return;

        const channel = supabase
            .channel('lesson_progress_changes')
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
                    // Check if this progress update belongs to current course
                    // Note: lesson_progress usually links to lesson_id, we need to check if that lesson is in this course.
                    // We can check if the lesson ID exists in our allLessons array.
                    if (newProgress && allLessons.some(l => l.id === newProgress.lesson_id)) {
                        if (newProgress.is_completed || newProgress.status === 'completed') {
                            setCompletedLessons(prev => new Set(prev).add(newProgress.lesson_id));
                            // If it was an external update, refresh server data
                            router.refresh();
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, course, allLessons, router]);

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
