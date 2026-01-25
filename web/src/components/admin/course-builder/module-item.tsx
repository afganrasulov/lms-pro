'use client';

import { useState } from 'react';
import { ModuleService } from '@/services/module-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from '@/components/ui/accordion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Pencil, Trash2, Check, X, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { LessonList } from './lesson-list';

import { DraggableProvidedDragHandleProps } from '@hello-pangea/dnd';

interface ModuleItemProps {
    module: any;
    onUpdate: () => void;
    dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export function ModuleItem({ module, onUpdate, dragHandleProps }: ModuleItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(module.title);
    const [saving, setSaving] = useState(false);

    const handleUpdateModule = async () => {
        if (!editTitle.trim() || editTitle === module.title) {
            setIsEditing(false);
            return;
        }
        setSaving(true);
        try {
            await ModuleService.updateModule(module.id, { title: editTitle });
            toast.success('Module updated');
            setIsEditing(false);
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update module');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteModule = async () => {
        if (!confirm('Delete this module and all its lessons? This action cannot be undone.')) return;
        try {
            await ModuleService.deleteModule(module.id);
            toast.success('Module deleted');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete module');
        }
    };

    return (
        <div data-testid="module-item" className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden transition-all hover:border-slate-700">
            {/* We use a custom header instead of AccordionTrigger if we want more control, 
                 but Accordion is good for collapse/expand. 
                 Let's build a custom collapsible structure or just a simple card for now 
                 since we need buttons in the header. */}

            <div className="flex items-center gap-3 p-4 bg-slate-900/50 border-b border-white/5">
                <div {...dragHandleProps} className="cursor-move p-1 hover:bg-slate-800 rounded">
                    <GripVertical className="w-5 h-5 text-slate-600" />
                </div>

                <div className="flex-1">
                    {isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="h-8 bg-slate-950 border-slate-700"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleUpdateModule();
                                    if (e.key === 'Escape') setIsEditing(false);
                                }}
                            />
                            <Button size="icon" variant="ghost" onClick={handleUpdateModule} disabled={saving} className="h-8 w-8 text-green-500">
                                <Check className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => setIsEditing(false)} className="h-8 w-8 text-red-500">
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <h3 className="font-semibold text-white text-lg">{module.title}</h3>
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400">
                            <MoreVertical className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                        <DropdownMenuItem onClick={() => setIsEditing(true)} className="focus:bg-slate-800 cursor-pointer">
                            <Pencil className="w-4 h-4 mr-2" /> Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleDeleteModule} className="focus:bg-red-900/20 text-red-400 focus:text-red-400 cursor-pointer">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="p-4 bg-slate-950/30">
                <LessonList
                    courseId={module.course_id}
                    moduleId={module.id}
                    lessons={module.lessons || []}
                    onUpdate={onUpdate}
                />
            </div>
        </div>
    );
}
