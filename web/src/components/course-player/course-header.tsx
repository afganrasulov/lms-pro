import { Button } from '@/components/ui/button';
import { Menu, X, ArrowLeft, ArrowRight } from 'lucide-react';

interface CourseHeaderProps {
    activeLesson: any;
    isSidebarOpen: boolean;
    hasNext: boolean;
    hasPrev: boolean;
    onToggleSidebar: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export function CourseHeader({
    activeLesson,
    isSidebarOpen,
    hasNext,
    hasPrev,
    onToggleSidebar,
    onNext,
    onPrev
}: CourseHeaderProps) {
    return (
        <header className="h-16 border-b flex items-center justify-between px-4 sticky top-0 bg-background/95 backdrop-blur z-20 shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
                    {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
                <h3 className="font-medium text-sm hidden md:block truncate max-w-md">
                    {activeLesson?.title || 'Kurs Tanıtımı'}
                </h3>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPrev}
                    onClick={onPrev}
                    className="hidden sm:flex"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Önceki
                </Button>
                <Button
                    size="sm"
                    onClick={onNext}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {hasNext ? 'Tamamla & Sonraki' : 'Kursu Bitir'} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </header>
    );
}
