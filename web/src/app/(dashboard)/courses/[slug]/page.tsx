'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseService } from '@/services/course-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Clock, PlayCircle, Share2, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function CourseLandingPage() {
    const supabase = createClient();
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [enrolled, setEnrolled] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            if (!slug) return;
            try {
                // 1. Check Auth (Optional for view, but needed for enrollment check)
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                // 2. Load Course Data
                const courseData = await CourseService.getCourseBySlug(slug);
                setCourse(courseData);

                // 3. Check Enrollment
                if (user && courseData) {
                    const hasAccess = await CourseService.checkAccess(user.id, courseData.id);
                    setEnrolled(hasAccess);
                }

            } catch (error: any) {
                console.error("Failed to load course", error.message || error);
                // Redirect to 404 or courses list if not found?
                // For now, let's just stay here or show error state
            } finally {
                setLoading(false);
            }
        };

        init();
    }, [slug]);

    const handleEnroll = async () => {
        if (!user) {
            toast.error("Kayıt olmak için lütfen giriş yapın");
            router.push('/login'); // Or open auth modal
            return;
        }

        try {
            setLoading(true);
            await CourseService.enrollUser(supabase, user.id, course.id, 'web_button');
            setEnrolled(true);
            toast.success("Başarıyla kayıt olundu!");
            router.push(`/courses/${course.slug || course.id}/learn`);
        } catch (error) {
            console.error("Enrollment failed", error);
            toast.error("Failed to enroll. Please try again.");
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-muted/20 relative">
                    <Skeleton className="absolute inset-0 w-full h-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-muted/50">
                    <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-semibold">Kurs Bulunamadı</h2>
                <Link href="/courses">
                    <Button variant="outline">Kurslara Dön</Button>
                </Link>
            </div>
        );
    }

    // Determine stats
    const moduleCount = course.modules?.length || 0;
    const lessonCount = course.modules?.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0) || 0;
    const duration = "4h 30m"; // Mock for now, or calc from lessons duration_seconds

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">

            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-card shadow-2xl">
                {/* Background / Cover */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background/50 z-10" />
                    {/* Fallback pattern or image */}
                    <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                </div>

                <div className="relative z-20 flex flex-col items-center text-center gap-8 p-8 md:p-12 max-w-4xl mx-auto">
                    <div className="space-y-6 w-full">
                        <div className="flex flex-wrap gap-2">
                            {/* Badges removed */}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white leading-tight">
                            {course.title}
                        </h1>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                            {course.description || "Master the skills you need to succeed in this comprehensive course designed for modern developers."}
                        </p>

                        <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-muted-foreground/80 py-2">
                            <div className="flex items-center gap-2">
                                <BookOpen className="w-4 h-4 text-primary" />
                                {moduleCount} Modül
                            </div>
                            <div className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4 text-primary" />
                                {lessonCount} Ders
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                {duration}
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
                            {enrolled ? (
                                <Button size="lg" className="bg-primary hover:bg-primary/90 text-white shadow-lg text-lg px-8 h-14 rounded-full" asChild>
                                    <Link href={`/courses/${slug}/learn`}>
                                        Öğrenmeye Devam Et
                                        <PlayCircle className="w-5 h-5 ml-2 fill-current opacity-20" />
                                    </Link>
                                </Button>
                            ) : (
                                <Button
                                    size="lg"
                                    className="bg-white text-black hover:bg-gray-200 shadow-xl shadow-white/5 text-lg px-8 h-14 rounded-full font-bold"
                                    onClick={handleEnroll}
                                    disabled={loading}
                                >
                                    Hemen Öğrenmeye Başla
                                </Button>
                            )}
                            {/* Share button removed */}
                        </div>
                    </div>

                    {/* Preview Card removed */}
                </div>
            </div>

            {/* Course Content Structure */}
            <div className="max-w-4xl mx-auto mt-8">
                {/* Modules List */}
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-primary" />
                        Kurs İçeriği
                    </h2>

                    <div className="space-y-4">
                        {course.modules?.map((module: any, index: number) => (
                            <div key={module.id} className="border border-white/5 bg-card/50 rounded-lg overflow-hidden">
                                <div className="p-4 bg-white/5 flex items-center justify-between font-semibold">
                                    <span className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
                                            {index + 1}
                                        </div>
                                        {module.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{module.lessons?.length || 0} Ders</span>
                                </div>
                                <div className="divide-y divide-white/5">
                                    {module.lessons?.sort((a: any, b: any) => a.position - b.position).map((lesson: any) => (
                                        <div key={lesson.id} className="p-3 pl-12 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex items-center gap-3 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                                {lesson.is_free_preview ? (
                                                    <PlayCircle className="w-4 h-4 text-green-500" />
                                                ) : (
                                                    <Lock className="w-4 h-4 text-white/20" />
                                                )}
                                                {lesson.title}
                                            </div>
                                            {lesson.is_free_preview && (
                                                <span className="text-xs text-green-500"></span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sidebar Info removed */}
            </div>
        </div>
    );
}
