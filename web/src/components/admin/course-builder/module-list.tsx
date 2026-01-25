'use client';

import { useState, useEffect } from 'react';
import { ModuleService } from '@/services/module-service';
import { LessonService } from '@/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleItem } from './module-item';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface ModuleListProps {
    courseId: string;
    modules: any[];
    onUpdate: () => void;
    currentUserId: string;
}

export function ModuleList({ courseId, modules, onUpdate, currentUserId }: ModuleListProps) {
    console.log('[DEBUG] ModuleList Rendered with:', modules.length, 'modules');
    const [isCreating, setIsCreating] = useState(false);
    const [newModuleTitle, setNewModuleTitle] = useState('');
    const [creating, setCreating] = useState(false);

    // Local state for optimistic updates
    const [orderedModules, setOrderedModules] = useState(modules);

    useEffect(() => {
        setOrderedModules(modules);
    }, [modules]);

    const handleCreateModule = async () => {
        if (!newModuleTitle.trim()) return;

        const tempId = `temp-${Date.now()}`;
        const nextPosition = orderedModules.length > 0
            ? Math.max(...orderedModules.map(m => m.position)) + 1
            : 1;

        const optimModule = {
            id: tempId,
            course_id: courseId,
            title: newModuleTitle,
            position: nextPosition,
            status: 'published',
            created_by: currentUserId,
            lessons: [],
            created_at: new Date().toISOString()
        };

        // Optimistic UI Update
        setOrderedModules([...orderedModules, optimModule]);
        setNewModuleTitle('');
        setIsCreating(false);

        // We don't setCreating(true) to avoid blocking UI, 
        // since we closed the form immediately.

        try {
            await ModuleService.createModule({
                course_id: courseId,
                title: optimModule.title,
                position: nextPosition,
                status: 'published',
                created_by: currentUserId,
            });

            toast.success('Module created');
            onUpdate(); // Replaces temp ID with real one
        } catch (error: any) {
            console.error('Module creation failed:', error);
            toast.error(error.message || 'Failed to create module');
            // Revert optimistic update
            setOrderedModules(orderedModules);
            setIsCreating(true); // Re-open form?
            setNewModuleTitle(optimModule.title);
        }
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        // CASE 1: Reordering Modules
        if (type === 'DEFAULT' || type === 'MODULE') { // hello-pangea/dnd uses DEFAULT if type not specified
            if (source.index === destination.index) return;

            const newModules = Array.from(orderedModules);
            const [movedModule] = newModules.splice(source.index, 1);
            newModules.splice(destination.index, 0, movedModule);

            // Optimistic Update
            setOrderedModules(newModules);

            const bulkUpdateData = newModules.map((mod, index) => ({
                id: mod.id,
                position: index + 1
            }));

            try {
                await ModuleService.reorderModules(bulkUpdateData);
                toast.success('Modules reordered');
            } catch (error) {
                console.error(error);
                toast.error('Failed to reorder modules');
                onUpdate(); // Revert
            }
            return;
        }

        // CASE 2: Reordering Lessons (Same module or cross-module)
        if (type === 'LESSON') {
            const sourceModuleId = source.droppableId;
            const destModuleId = destination.droppableId;

            // Find modules in state
            const sourceModuleIndex = orderedModules.findIndex(m => m.id === sourceModuleId);
            const destModuleIndex = orderedModules.findIndex(m => m.id === destModuleId);

            if (sourceModuleIndex === -1 || destModuleIndex === -1) return;

            const newOrderedModules = [...orderedModules];
            const sourceModule = { ...newOrderedModules[sourceModuleIndex] };
            const destModule = { ...newOrderedModules[destModuleIndex] };

            // Ensure lessons arrays exist (optimistic safety)
            const sourceLessons = Array.from(sourceModule.lessons || []);
            let destLessons = sourceModuleId === destModuleId
                ? sourceLessons
                : Array.from(destModule.lessons || []);

            // Move the lesson
            const [movedLesson] = sourceLessons.splice(source.index, 1);

            // Should not happen, but safety check
            if (!movedLesson) return;

            // Updated lesson object (optimistic new module ID if changed)
            const updatedLesson = { ...movedLesson, module_id: destModuleId };

            // Insert into destination
            destLessons.splice(destination.index, 0, updatedLesson);

            // Update the modules in our copy
            sourceModule.lessons = sourceLessons;
            destModule.lessons = destLessons;

            newOrderedModules[sourceModuleIndex] = sourceModule;
            newOrderedModules[destModuleIndex] = destModule;

            // Apply Optimistic State
            setOrderedModules(newOrderedModules);

            // Calculate new positions for the DESTINATION module (and source if different? No, mostly just destination order matters for the API call usually, but we should update both sets if we want everything perfect)
            // Actually, for `reorderLessons` API, we usually just send the list of items that changed. 
            // If we moved within same module: all items in that module need new positions.
            // If moved between modules: 
            //   - Source module items need position updates? Yes to close gap.
            //   - Dest module items need position updates.

            const updates: { id: string; position: number; module_id: string }[] = [];

            // Helper to add updates
            const addToUpdates = (lessons: any[], modId: string) => {
                lessons.forEach((lesson, idx) => {
                    updates.push({
                        id: lesson.id,
                        position: idx + 1,
                        module_id: modId
                    });
                });
            };

            if (sourceModuleId === destModuleId) {
                addToUpdates(destLessons, destModuleId);
            } else {
                addToUpdates(sourceLessons, sourceModuleId);
                addToUpdates(destLessons, destModuleId);
            }

            try {
                console.log('Reorder payload:', JSON.stringify(updates, null, 2));
                await LessonService.reorderLessons(updates);
            } catch (error: any) {
                console.error('Reorder Error:', error);
                console.error('Error Details:', JSON.stringify(error, null, 2));
                toast.error(`Failed to reorder: ${error.message || 'Unknown error'}`);
                onUpdate(); // Revert
            }
        }
    };

    return (
        <div className="space-y-4">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="modules" type="MODULE">
                    {(provided) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                        >
                            {orderedModules.map((module, index) => (
                                <Draggable key={module.id} draggableId={module.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                        >
                                            <ModuleItem
                                                module={module}
                                                onUpdate={onUpdate}
                                                dragHandleProps={provided.dragHandleProps}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {isCreating ? (
                <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2">
                        <Input
                            autoFocus
                            placeholder="Enter module title (e.g. 'Introduction to React')"
                            value={newModuleTitle}
                            onChange={(e) => setNewModuleTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreateModule();
                                if (e.key === 'Escape') setIsCreating(false);
                            }}
                            className="bg-slate-950 border-slate-800"
                        />
                        <Button
                            onClick={handleCreateModule}
                            disabled={creating}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsCreating(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    variant="outline"
                    className="w-full border-dashed border-slate-700 text-slate-400 hover:text-white hover:border-slate-500 h-12"
                    onClick={() => setIsCreating(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Module
                </Button>
            )}
        </div>
    );
}
