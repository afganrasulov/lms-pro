'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { LessonService } from '@/services/lesson-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LessonEditorProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    mode: 'create' | 'edit';
    initialData?: any;
    courseId: string;
    moduleId: string;
    nextPosition: number;
    onSuccess: () => void;
}

export function LessonEditor({
    open,
    onOpenChange,
    mode,
    initialData,
    courseId,
    moduleId,
    nextPosition,
    onSuccess
}: LessonEditorProps) {
    const [loading, setLoading] = useState(false);

    // Form States
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState(''); // Stores in content_markdown
    const [videoUrl, setVideoUrl] = useState(''); // Stores in content_json
    const [duration, setDuration] = useState('0');
    const [isFreePreview, setIsFreePreview] = useState(false);

    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialData) {
                setTitle(initialData.title);
                setSlug(initialData.slug);
                setDuration(initialData.duration_seconds ? String(Math.round(initialData.duration_seconds / 60)) : '0');
                setIsFreePreview(initialData.is_free_preview || false);

                // Fetch content if editing
                loadContent(initialData.id);
            } else {
                resetForm();
            }
        }
    }, [open, mode, initialData]);

    const resetForm = () => {
        setTitle('');
        setSlug('');
        setDescription('');
        setVideoUrl('');
        setDuration('0');
        setIsFreePreview(false);
    };

    const loadContent = async (lessonId: string) => {
        try {
            const content = await LessonService.getLessonContent(lessonId);
            if (content) {
                setDescription(content.content_markdown || '');
                if (content.content_json && typeof content.content_json === 'object' && 'videoUrl' in content.content_json) {
                    setVideoUrl((content.content_json as any).videoUrl);
                }
            }
        } catch (error) {
            console.error('Error loading content', error);
        }
    };

    const generateSlug = (text: string) => {
        return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    };

    const handleSave = async () => {
        if (!title || !slug) {
            toast.error('Title and Slug are required');
            return;
        }

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('You must be logged in to save a lesson');

            let lessonId = initialData?.id;

            // 1. Create or Update Metadata
            if (mode === 'create') {
                const newLesson = await LessonService.createLesson({
                    course_id: courseId,
                    module_id: moduleId,
                    title,
                    slug,
                    type: videoUrl ? 'video' : 'text',
                    position: nextPosition,
                    status: 'published',
                    is_free_preview: isFreePreview,
                    created_by: user.id,
                });
                lessonId = newLesson.id;
            } else {
                if (!lessonId) throw new Error('No lesson ID for update');
                await LessonService.updateLesson(lessonId, {
                    title,
                    slug,
                    type: videoUrl ? 'video' : 'text',
                    duration_seconds: parseInt(duration) * 60,
                    is_free_preview: isFreePreview,
                    updated_by: user.id,
                });
            }

            // 2. Update Content
            await LessonService.updateLessonContent(
                lessonId,
                description,
                { videoUrl }
            );

            toast.success(`Lesson ${mode === 'create' ? 'created' : 'updated'}`);
            onSuccess();
        } catch (error: any) {
            console.error('Lesson Save Error:', error);
            toast.error(error.message || 'Failed to save lesson');
        } finally {
            setLoading(false);
            // Re-fetch user to keep session alive? Not needed here.

        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-900 border-slate-800 text-slate-200 sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{mode === 'create' ? 'Add New Lesson' : 'Edit Lesson'}</DialogTitle>
                    <DialogDescription>
                        {mode === 'create' ? 'Create a new lesson in this module.' : 'Update lesson details and content.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title</Label>
                            <Input
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (mode === 'create') setSlug(generateSlug(e.target.value));
                                }}
                                placeholder="Lesson Title"
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Slug</Label>
                            <Input
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                placeholder="lesson-slug"
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Video URL (Optional)</Label>
                        <Input
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="e.g. YouTube, Vimeo link"
                            className="bg-slate-950 border-slate-800"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Content / Description (Markdown)</Label>
                        <Textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="# Lesson Content\nWrite your lesson content here..."
                            className="bg-slate-950 border-slate-800 min-h-[150px] font-mono text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 rounded bg-slate-950 border border-slate-800">
                        <div className="space-y-0.5">
                            <Label>Free Preview</Label>
                            <p className="text-xs text-slate-500">Allow users to watch this without enrolling.</p>
                        </div>
                        <Switch
                            checked={isFreePreview}
                            onCheckedChange={setIsFreePreview}
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="space-y-2 flex-1">
                            <Label>Duration (Minutes)</Label>
                            <Input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Lesson'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
