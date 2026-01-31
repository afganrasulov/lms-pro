import { useState } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CourseService } from '@/services/course-service';
import { Course } from '@/types/index';
import { Loader2 } from 'lucide-react';

interface CourseDialogProps {
    course?: Course;
    trigger?: React.ReactNode;
    onSuccess: () => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CourseDialog({ course, trigger, onSuccess, open, onOpenChange }: CourseDialogProps) {
    const isEdit = !!course;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: course?.title || '',
        slug: course?.slug || '',
        description: course?.description || '',
        status: course?.status || 'draft',
        visibility: course?.visibility || 'public',
        image_url: course?.image_url || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                title: formData.title,
                slug: formData.slug,
                description: formData.description,
                status: formData.status,
                visibility: formData.visibility,
                image_url: formData.image_url
            };

            if (isEdit && course) {
                await CourseService.updateCourse(course.id, payload);
            } else {
                const { data: { user } } = await import('@/lib/supabase/client').then(m => m.createClient().auth.getUser());
                if (!user) throw new Error("Not authenticated");

                await CourseService.createCourse({
                    ...payload,
                    // created_by is handled by service or backend, or passed here if needed.
                    // Assuming CourseService accepts partial or we add missing fields.
                    // For now, matching previous logic but with correct fields.
                    created_by: user.id,
                    subtitle: '', // Required by some types?
                    level: 'Beginner',
                    category: 'Development'
                } as any);
            }
            onSuccess();
            onOpenChange?.(false);
        } catch (error) {
            console.error(error);
            toast.error('Failed to save course');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[500px] bg-slate-900 text-white border-slate-700">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Course' : 'Create New Course'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update course details below.' : 'Fill in the details for the new course.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                            id="slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            required
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="bg-slate-800 border-slate-700"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="published">Published</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Visibility</Label>
                            <Select
                                value={formData.visibility}
                                onValueChange={(v: any) => setFormData({ ...formData, visibility: v })}
                            >
                                <SelectTrigger className="bg-slate-800 border-slate-700">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Private</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isEdit ? 'Save Changes' : 'Create Course'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
