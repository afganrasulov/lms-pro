'use client';

import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { VideoPlayer } from '@/components/video-player';
import ZoomPlayer from '@/components/zoom-player';
import { Loader2 } from 'lucide-react';
import { useCoursePlayer } from '@/hooks/use-course-player';
import { CourseSidebar } from '@/components/course-player/course-sidebar';
import { CourseHeader } from '@/components/course-player/course-header';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';

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

    const [hasLicense, setHasLicense] = useState<boolean | null>(null);
    const supabase = createClient();

    useEffect(() => {
        const checkLicense = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('license_status')
                    .eq('id', user.id)
                    .single();
                setHasLicense(profile?.license_status === 'active');
            } else {
                setHasLicense(false);
            }
        };
        checkLicense();
    }, []);

    // Derived Content
    // Find the current version of content, or fallback to the first one (most recent usually)
    const currentContent = activeLesson?.lesson_contents?.find((c: any) => c.is_current_version) || activeLesson?.lesson_contents?.[0];
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
                <h1 className="text-xl font-bold">Kurs Bulunamadı</h1>
                <Link href="/dashboard"><Button>Panele Dön</Button></Link>
            </div>
        );
    }

    if (hasLicense === false) {
        return (
            <div className="flex h-screen items-center justify-center bg-background flex-col gap-6 p-4 text-center">
                <div className="p-4 rounded-full bg-yellow-500/10 mb-2">
                    <Lock className="w-12 h-12 text-yellow-500" />
                </div>
                <div className="space-y-2 max-w-md">
                    <h1 className="text-2xl font-bold">Lisans Anahtarı Gerekli</h1>
                    <p className="text-muted-foreground">
                        Bu kursu izleyebilmek için geçerli bir lisans anahtarına ihtiyacınız var.
                        Lütfen ayarlardan lisans anahtarınızı girin.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/settings"><Button>Lisans Anahtarı Gir</Button></Link>
                    <Link href="/dashboard"><Button variant="outline">Geri Dön</Button></Link>
                </div>
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

                                {activeLesson.type === 'live_class' ? (
                                    <div className="w-full">
                                        <ZoomPlayer
                                            meetingNumber={activeLesson.video_url || ''}
                                            passcode={(activeLesson.content_json as any)?.passcode || ''}
                                        />
                                    </div>
                                ) : videoUrl ? (
                                    <VideoPlayer
                                        key={activeLesson.id}
                                        url={videoUrl}
                                        onEnded={onVideoEnded}
                                    />
                                ) : (
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                                        Video İçeriği Yok
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
