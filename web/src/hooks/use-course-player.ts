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

    // Real-time Progress and Content Sync
    useEffect(() => {
        if (!user || !course) return;

        const channel = supabase
            .channel('course_player_sync')
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
                    if (newProgress && allLessons.some(l => l.id === newProgress.lesson_id)) {
                        if (newProgress.is_completed || newProgress.status === 'completed') {
                            setCompletedLessons(prev => new Set(prev).add(newProgress.lesson_id));
                            router.refresh();
                        }
                    }
                }
            )
            // Listen for Lesson Title/Description Updates
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'lessons' },
                (payload) => {
                    const updatedLesson = payload.new as any;
                    // Only process if this lesson belongs to our course (via modules check or existing list)
                    if (allLessons.some(l => l.id === updatedLesson.id)) {
                        setAllLessons(prev => prev.map(l =>
                            l.id === updatedLesson.id
                                ? { ...l, ...updatedLesson } // Merge updates
                                : l
                        ));

                        // Update active lesson if it's the one being modified
                        if (activeLesson?.id === updatedLesson.id) {
                            setActiveLesson((prev: any) => ({ ...prev, ...updatedLesson }));
                        }
                    }
                }
            )
            // Listen for Lesson Content (Video/Markdown) Updates
            // Listen for Lesson Content (Video/Markdown) Updates
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'lesson_contents' },
                (payload) => {
                    const updatedContent = payload.new as any;

                    // Check if we have this lesson
                    const parentLesson = allLessons.find(l => l.id === updatedContent?.lesson_id);
                    if (parentLesson && updatedContent) {
                        // Check if this is the "current" version
                        if (updatedContent.is_current_version) {
                            // Update in allLessons
                            setAllLessons(prev => prev.map(l => {
                                if (l.id === updatedContent.lesson_id) {
                                    // Filter out ANY existing content to avoid stale versions, and put this one first
                                    const otherContents = (l.lesson_contents || []).filter((c: any) => c.id !== updatedContent.id);
                                    return { ...l, lesson_contents: [updatedContent, ...otherContents] };
                                }
                                return l;
                            }));

                            // Update active lesson if needed
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
    }, [user, course, allLessons, router, activeLesson]);

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
