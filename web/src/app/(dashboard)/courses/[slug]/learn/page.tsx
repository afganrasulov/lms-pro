'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video-player';
import { Loader2 } from 'lucide-react';
import { useCoursePlayer } from '@/hooks/use-course-player';
import { CourseSidebar } from '@/components/course-player/course-sidebar';
import { CourseHeader } from '@/components/course-player/course-header';

export default function CoursePlayerPage() {
    const params = useParams();
    const slug = params.slug as string;

    const {
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
    } = useCoursePlayer(slug);

    // Derived Content
    const currentContent = activeLesson?.lesson_contents?.[0];
    const videoUrl = currentContent?.content_json?.videoUrl || activeLesson?.content_json?.videoUrl;
    const markdown = currentContent?.content_markdown || activeLesson?.content_markdown || '';

    // [DEBUG] Deep Trace for Vimeo
    console.log('[DEBUG] LearnPage Render:', {
        lessonId: activeLesson?.id,
        hasContents: !!activeLesson?.lesson_contents?.length,
        derivedVideoUrl: videoUrl,
        rawContentJson: activeLesson?.content_json
    });

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex h-screen items-center justify-center bg-background flex-col gap-4">
                <h1 className="text-xl font-bold">Course Not Found</h1>
                <Link href="/dashboard"><Button>Back to Dashboard</Button></Link>
            </div>
        );
    }



    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans">
            <CourseSidebar
                course={course}
                modules={modules}
                activeLesson={activeLesson}
                completedLessons={completedLessons}
                allLessons={allLessons}
                expandedModules={expandedModules}
                isSidebarOpen={isSidebarOpen}
                onToggleModule={toggleModule}
                onSelectLesson={handleLessonSelect}
            />

            <main className="flex-1 flex flex-col min-w-0 bg-background h-screen">
                <CourseHeader
                    activeLesson={activeLesson}
                    isSidebarOpen={isSidebarOpen}
                    hasNext={hasNext}
                    hasPrev={hasPrev}
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    onNext={handleNext}
                    onPrev={handlePrev}
                />

                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8">
                        {activeLesson && (
                            <>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                                    {activeLesson.title}
                                </h1>

                                {videoUrl ? (
                                    <VideoPlayer
                                        url={videoUrl}
                                        onEnded={onVideoEnded}
                                    />
                                ) : (
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                        No Video Content
                                    </div>
                                )}

                                {markdown && (
                                    <div className="prose dark:prose-invert max-w-none prose-slate">
                                        <div className="whitespace-pre-wrap">{markdown}</div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
