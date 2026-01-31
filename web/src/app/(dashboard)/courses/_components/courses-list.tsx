import { createClient } from '@/lib/supabase/server';
import { CourseService } from '@/services/course-service';
import { CourseCard } from '@/components/courses/course-card';

export async function CoursesList() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const courses = await CourseService.getPublishedCoursesWithProgress(supabase, user?.id);

    if (courses.length === 0) {
        return (
            <div className="col-span-full p-12 text-center glass border border-white/5 rounded-md border-dashed">
                <div className="w-16 h-16 bg-white/5 rounded-md flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📚</span>
                </div>
                <h3 className="text-lg font-medium mb-1">Henüz kurs yok</h3>
                <p className="text-muted-foreground text-sm">Yeni içerik için daha sonra tekrar kontrol edin.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
                <CourseCard
                    key={course.id}
                    course={course}
                />
            ))}
        </div>
    );
}
