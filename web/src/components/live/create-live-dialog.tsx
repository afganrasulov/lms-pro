'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { createLiveClass, getAdminCoursesForSelect, getModulesForCourse } from '@/app/(dashboard)/live/actions';

export function CreateLiveDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
    const [modules, setModules] = useState<{ id: string; title: string }[]>([]);

    const [formData, setFormData] = useState({
        courseId: '',
        moduleId: '',
        title: '',
        videoUrl: ''
    });

    useEffect(() => {
        if (open) {
            getAdminCoursesForSelect().then(setCourses);
        }
    }, [open]);

    const handleCourseChange = async (courseId: string) => {
        setFormData(prev => ({ ...prev, courseId, moduleId: '' }));
        const mods = await getModulesForCourse(courseId);
        setModules(mods);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createLiveClass(formData);
            if (result.success) {
                toast.success('Canlı ders oluşturuldu');
                setOpen(false);
                setFormData({ courseId: '', moduleId: '', title: '', videoUrl: '' });
            } else {
                toast.error('Hata: ' + result.error);
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Canlı Ders Oluştur
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Yeni Canlı Ders</DialogTitle>
                    <DialogDescription>
                        Mevcut bir kursa yeni bir canlı ders ekleyin.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Kurs Seçin</Label>
                        <Select onValueChange={handleCourseChange} value={formData.courseId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Kurs seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {courses.map(course => (
                                    <SelectItem key={course.id} value={course.id}>
                                        {course.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Modül Seçin</Label>
                        <Select
                            onValueChange={(val) => setFormData(prev => ({ ...prev, moduleId: val }))}
                            value={formData.moduleId}
                            disabled={!formData.courseId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Modül seçiniz..." />
                            </SelectTrigger>
                            <SelectContent>
                                {modules.map(module => (
                                    <SelectItem key={module.id} value={module.id}>
                                        {module.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Ders Başlığı</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Örn: Hafta 1 Canlı Soru/Cevap"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Zoom Linki</Label>
                        <Input
                            type="url"
                            value={formData.videoUrl}
                            onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                            placeholder="https://zoom.us/j/..."
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading || !formData.moduleId}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oluştur'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
