import { createClient } from '@/lib/supabase/server';
import { CourseService } from '@/services/course-service';
import { CourseCard } from '@/components/courses/course-card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export async function DashboardCourses({ userId }: { userId: string }) {
    const supabase = await createClient();
    const courses = await CourseService.getUserEnrolledCourses(supabase, userId);

    if (courses.length === 0) {
        return (
            <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <h3 className="text-xl font-semibold mb-2 text-white">Henüz bir kursa kayıtlı değilsin</h3>
                <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Yazılım yolculuğuna başlamak için hemen kurs kataloğuna göz at ve öğrenmeye başla.
                </p>
                <Button asChild variant="default" size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    <Link href="/courses">Kursları İncele</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {courses.map(course => (
                <CourseCard key={course.id} course={course} />
            ))}
        </div>
    );
}
