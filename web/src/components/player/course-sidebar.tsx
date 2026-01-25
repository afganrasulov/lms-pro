'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CourseService } from '@/services/course-service';
import { cn } from '@/lib/utils';
import { CheckCircle, PlayCircle, Lock } from 'lucide-react';

interface SidebarProps {
    courseId: string;
    currentLessonId?: string;
}

export function CourseSidebar({ courseId, currentLessonId }: SidebarProps) {
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const data = await CourseService.getCourseStructure(courseId);
            setCourse(data);
            setLoading(false);
        }
        load();
    }, [courseId]);

    if (loading) return <div className="p-4 text-sm text-muted-foreground">Loading curriculum...</div>;
    if (!course) return <div className="p-4 text-sm text-destructive">Course not found.</div>;

    return (
        <div className="w-80 border-r bg-card h-screen overflow-y-auto flex-shrink-0">
            <div className="p-4 border-b">
                <h2 className="font-bold text-lg line-clamp-1">{course.title}</h2>
                <p className="text-xs text-muted-foreground">{course.modules.length} Modules</p>
            </div>

            <div className="py-2">
                {course.modules
                    .sort((a: any, b: any) => a.position - b.position)
                    .map((module: any) => (
                        <div key={module.id} className="mb-2">
                            <div className="px-4 py-2 bg-muted/30 text-xs font-bold uppercase text-muted-foreground sticky top-0">
                                {module.title}
                            </div>
                            <div>
                                {module.lessons
                                    .sort((a: any, b: any) => a.position - b.position)
                                    .map((lesson: any) => {
                                        const isActive = lesson.id === currentLessonId;
                                        return (
                                            <Link
                                                key={lesson.id}
                                                href={`/courses/${courseId}/lesson/${lesson.id}`}
                                                className={cn(
                                                    "flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                                                    isActive && "bg-primary/5 text-primary border-r-2 border-primary"
                                                )}
                                            >
                                                <div className="text-muted-foreground">
                                                    {/* Placeholder logic for 'completed' (would check user progress eventually) */}
                                                    <PlayCircle size={16} />
                                                </div>
                                                <div className="flex-1 line-clamp-2 leading-snug">
                                                    {lesson.title}
                                                </div>
                                                {lesson.is_free_preview && (
                                                    <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                                                        Free
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
}
