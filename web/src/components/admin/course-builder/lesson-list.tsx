'use client';

import { useState } from 'react';
import { LessonService } from '@/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { LessonItem } from './lesson-item';
import { LessonEditor } from './lesson-editor';

import { Droppable, Draggable } from '@hello-pangea/dnd';

interface LessonListProps {
    courseId: string;
    moduleId: string;
    lessons: any[];
    onUpdate: () => void;
}

export function LessonList({ courseId, moduleId, lessons, onUpdate }: LessonListProps) {
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<any>(null);

    const handleCreateClick = () => {
        setEditingLesson(null);
        setIsEditorOpen(true);
    };

    const handleEditClick = (lesson: any) => {
        setEditingLesson(lesson);
        setIsEditorOpen(true);
    };

    return (
        <Droppable droppableId={moduleId} type="LESSON">
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-2 min-h-[50px]"
                >
                    {lessons.length === 0 && (
                        <div className="text-center py-4 text-slate-500 text-sm italic">
                            No lessons in this module yet.
                        </div>
                    )}

                    {lessons.map((lesson, index) => (
                        <LessonItem
                            key={lesson.id}
                            lesson={lesson}
                            index={index}
                            onEdit={() => handleEditClick(lesson)}
                            onUpdate={onUpdate}
                        />
                    ))}
                    {provided.placeholder}

                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 mt-2"
                        onClick={handleCreateClick}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Lesson
                    </Button>

                    <LessonEditor
                        open={isEditorOpen}
                        onOpenChange={setIsEditorOpen}
                        mode={editingLesson ? 'edit' : 'create'}
                        initialData={editingLesson}
                        courseId={courseId}
                        moduleId={moduleId}
                        nextPosition={lessons.length > 0 ? Math.max(...lessons.map(l => l.position)) + 1 : 1}
                        onSuccess={() => {
                            setIsEditorOpen(false);
                            onUpdate();
                        }}
                    />
                </div>
            )}
        </Droppable>
    );
}
