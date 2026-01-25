import { createClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/courses/course-card';
import { BookOpen } from 'lucide-react';
import { CourseService } from '@/services/course-service';

export const dynamic = 'force-dynamic';

export default async function CoursesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const courses = await CourseService.getPublishedCoursesWithProgress(supabase, user?.id);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <BookOpen className="w-8 h-8 text-primary" />
                    Tüm Kurslar
                </h1>
                <p className="text-muted-foreground mt-1">
                    Profesyonel kurs kataloğumuzu keşfedin.
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.length === 0 ? (
                    <div className="col-span-full p-12 text-center glass border border-white/5 rounded-md border-dashed">
                        <div className="w-16 h-16 bg-white/5 rounded-md flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📚</span>
                        </div>
                        <h3 className="text-lg font-medium mb-1">Henüz kurs yok</h3>
                        <p className="text-muted-foreground text-sm">Yeni içerik için daha sonra tekrar kontrol edin.</p>
                    </div>
                ) : (
                    courses.map((course) => (
                        <CourseCard
                            key={course.id}
                            course={course}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
