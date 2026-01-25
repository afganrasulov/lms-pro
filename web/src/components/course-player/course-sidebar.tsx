import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronDown, CheckCircle, Circle } from 'lucide-react';
import React from 'react';

interface CourseSidebarProps {
    course: any;
    modules: any[];
    activeLesson: any;
    completedLessons: Set<string>;
    allLessons: any[];
    expandedModules: Record<string, boolean>;
    isSidebarOpen: boolean;
    onToggleModule: (id: string) => void;
    onSelectLesson: (lesson: any) => void;
}

export function CourseSidebar({
    course,
    modules,
    activeLesson,
    completedLessons,
    allLessons,
    expandedModules,
    isSidebarOpen,
    onToggleModule,
    onSelectLesson
}: CourseSidebarProps) {
    if (!course) return null;

    const progressPercentage = Math.round((completedLessons.size / Math.max(allLessons.length, 1)) * 100);

    return (
        <aside className={cn(
            "fixed inset-y-0 left-0 z-50 w-80 bg-muted/30 border-r transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 bg-card",
            !isSidebarOpen && "-translate-x-full md:w-0 md:border-none overflow-hidden"
        )}>
            <div className="flex flex-col h-full">
                <div className="p-4 border-b bg-card">
                    <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground hover:text-primary mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Dashboard
                    </Link>
                    <h2 className="font-bold text-base leading-tight line-clamp-2">
                        {course.title}
                    </h2>
                    {/* Progress Bar */}
                    <div className="mt-4 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{progressPercentage}% Complete</span>
                            <span>{completedLessons.size}/{allLessons.length} Lessons</span>
                        </div>
                        <div className="h-1 w-full bg-secondary rounded-md overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {modules.map(mod => (
                        <div key={mod.id} className="space-y-1">
                            <button
                                onClick={() => onToggleModule(mod.id)}
                                className="flex items-center justify-between w-full text-left font-semibold text-sm hover:text-primary py-2 px-1"
                            >
                                <span className="truncate">{mod.title}</span>
                                {/* Optional: Add chevron for expand/collapse indication if desired, kept simple per original */}
                            </button>

                            {expandedModules[mod.id] && (
                                <div className="pl-2 space-y-1 border-l-2 border-muted ml-1.5">
                                    {mod.lessons?.map((lesson: any) => {
                                        const isActive = activeLesson?.id === lesson.id;
                                        const isCompleted = completedLessons.has(lesson.id);

                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => onSelectLesson(lesson)}
                                                className={cn(
                                                    "flex items-start gap-3 w-full p-2 text-sm rounded-md transition-colors text-left",
                                                    isActive
                                                        ? "bg-primary/10 text-primary font-medium"
                                                        : "text-muted-foreground hover:bg-muted/50"
                                                )}
                                            >
                                                {isCompleted ? (
                                                    <CheckCircle className="w-4 h-4 mt-0.5 text-green-500 fill-green-500/10" />
                                                ) : (
                                                    <Circle className="w-4 h-4 mt-0.5" />
                                                )}
                                                <span className={cn("line-clamp-2", isCompleted && !isActive && "text-muted-foreground")}>
                                                    {lesson.title}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
