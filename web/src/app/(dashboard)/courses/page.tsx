import { Suspense } from 'react';
import { BookOpen } from 'lucide-react';
import { CoursesList } from './_components/courses-list';
import { CourseGridSkeleton } from '@/components/courses/course-grid-skeleton';

export const dynamic = 'force-dynamic';

export default function CoursesPage() {
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

            <Suspense fallback={<CourseGridSkeleton />}>
                <CoursesList />
            </Suspense>
        </div>
    );
}
