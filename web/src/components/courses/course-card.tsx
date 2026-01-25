import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Lock, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn, getGradient } from '@/lib/utils';
import { CourseWithMeta } from '@/types/index';

interface CourseCardProps {
    course: CourseWithMeta;
}

export function CourseCard({ course }: CourseCardProps) {
    const {
        title,
        description,
        total_lessons,
        total_duration,
        is_enrolled,
        user_progress,
        is_locked
    } = course;

    const gradient = getGradient(course.id || title);

    // Format duration helper
    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}sa ${minutes}dk`;
        return `${minutes}dk`;
    };

    return (
        <Card variant="glass" className={cn(
            "group relative overflow-hidden border border-white/10 transition-all duration-500",
            is_locked ? "opacity-75 grayscale-[0.5]" : "hover:border-white/20 hover:shadow-2xl hover:-translate-y-2"
        )}>

            {/* Cover Image Area */}
            <div className={cn("aspect-video relative overflow-hidden bg-gradient-to-br", gradient)}>
                {/* Overlay Pattern */}
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />

                {/* Title Initials Fallback */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl font-black text-white/20 uppercase tracking-widest select-none">
                        {title.substring(0, 2)}
                    </span>
                </div>

                {/* Locked Overlay */}
                {is_locked && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-4 z-10 transition-opacity">
                        <div className="bg-black/50 p-3 rounded-full border border-white/10 mb-2">
                            <Lock className="w-6 h-6 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium text-white/90">Kilitli</p>
                        <p className="text-xs text-white/60 mt-1">Önceki kursu tamamla</p>
                    </div>
                )}

                {/* Status Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                    {is_enrolled ? (
                        <Badge className="glass bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-sm">
                            Kayıtlı
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-black/40 text-white border-white/10 backdrop-blur-sm">
                            Ücretsiz
                        </Badge>
                    )}
                </div>
            </div>

            <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                    <h3 className="font-bold text-xl leading-tight text-white group-hover:text-primary transition-colors line-clamp-2">
                        {title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                        {description || "Bu kapsamlı modül ile potansiyelini keşfet. Temelleri öğren ve ileri seviye kavramlarda uzmanlaş."}
                    </p>
                </div>

                {/* Meta Info Row */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{total_lessons} Ders</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span>{formatDuration(total_duration)}</span>
                    </div>
                </div>

                {/* Progress Bar (if enrolled) */}
                {is_enrolled && !is_locked && user_progress !== null && (
                    <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs font-semibold text-primary-foreground/70">
                            <span>İlerleme</span>
                            <span>{user_progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/50 rounded-md overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-700 ease-out" style={{ width: `${user_progress}%` }} />
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <Button
                    asChild={!is_locked}
                    disabled={is_locked}
                    className={cn(
                        "w-full font-semibold transition-all shadow-lg",
                        is_locked
                            ? "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed"
                            : is_enrolled
                                ? "bg-primary hover:bg-primary/90 text-white border-none"
                                : "bg-white/5 hover:bg-white/10 text-white border border-white/10 backdrop-blur-sm"
                    )}
                    size="lg"
                >
                    {is_locked ? (
                        <span className="flex items-center gap-2">
                            <Lock className="w-4 h-4" /> Kilitli
                        </span>
                    ) : (
                        <Link href={is_enrolled ? `/courses/${course.slug || course.id}/learn` : `/courses/${course.slug || course.id}`}>
                            {is_enrolled ? 'Öğrenmeye Devam Et' : 'Kursu İncele'}
                        </Link>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}

