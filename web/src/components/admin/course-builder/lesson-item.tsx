'use client';

import { LessonService } from '@/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, FileText, Video, PlayCircle, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import { Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';

interface LessonItemProps {
    lesson: any;
    index: number;
    onEdit: () => void;
    onUpdate: () => void;
}

export function LessonItem({ lesson, index, onEdit, onUpdate }: LessonItemProps) {

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this lesson?')) return;
        try {
            await LessonService.deleteLesson(lesson.id);
            toast.success('Lesson deleted');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete lesson');
        }
    };

    const getIcon = () => {
        const type = (lesson.type || '').toLowerCase();
        if (type.includes('video')) return <PlayCircle className="w-4 h-4 text-blue-400" />;
        if (type.includes('quiz')) return <FileText className="w-4 h-4 text-purple-400" />;
        return <FileText className="w-4 h-4 text-slate-400" />;
    };

    return (
        <Draggable draggableId={lesson.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="group flex items-center justify-between p-3 rounded-md bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                    <div className="flex items-center gap-3">
                        <div
                            {...provided.dragHandleProps}
                            className="cursor-move text-slate-600 hover:text-slate-400 transition-colors"
                        >
                            <GripVertical className="w-4 h-4" />
                        </div>
                        <div className="p-2 rounded bg-slate-950">
                            {getIcon()}
                        </div>
                        <div>
                            <div className="font-medium text-slate-200 text-sm">{lesson.title}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-slate-700 text-slate-400">
                                    {lesson.type}
                                </Badge>
                                <span>{lesson.duration_seconds ? `${Math.round(lesson.duration_seconds / 60)} min` : 'No duration'}</span>
                                {lesson.is_free_preview && (
                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                        Free Preview
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-white" onClick={onEdit}>
                            <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-400" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
