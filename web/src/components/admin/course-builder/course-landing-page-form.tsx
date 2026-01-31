'use client';

import { useState } from 'react';
import { Course } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseService } from '@/services/course-service';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CourseLandingPageFormProps {
    course: Course;
    onUpdate: () => void;
}

export function CourseLandingPageForm({ course, onUpdate }: CourseLandingPageFormProps) {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: course.title || '',
        description: course.description || '',
        // These fields are not yet in DB, managing as local state or would need schema update
        subtitle: '',
        level: 'Beginner',
        category: 'Development',
        image_url: course.image_url || ''
    });

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await CourseService.updateCourse(course.id, {
                title: formData.title,
                description: formData.description,
                subtitle: formData.subtitle,
                level: formData.level,
                category: formData.category,
                image_url: formData.image_url
                // Note: Level and Category cannot be saved until DB schema supports them.
            });
            toast.success('Course landing page updated');
            onUpdate();
        } catch (error) {
            console.error(error);
            toast.error('Failed to update course');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="grid gap-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Course Landing Page</CardTitle>
                    <CardDescription className="text-slate-400">
                        This information will be displayed on the course details page.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-slate-200">Course Title</Label>
                        <Input
                            value={formData.title}
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white"
                            placeholder="e.g. Master Next.js 14"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-200">Course Subtitle</Label>
                        <Input
                            value={formData.subtitle}
                            onChange={(e) => handleChange('subtitle', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white"
                            placeholder="Insert your course subtitle"
                        />
                        <p className="text-xs text-slate-500">Not yet persisted in DB</p>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-200">Description</Label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="bg-slate-950 border-slate-700 text-white min-h-[150px]"
                            placeholder="Detailed description of the course..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-200">Level</Label>
                            <Select
                                value={formData.level}
                                onValueChange={(val) => handleChange('level', val)}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="Beginner">Beginner</SelectItem>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Expert">Expert</SelectItem>
                                    <SelectItem value="All Levels">All Levels</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-slate-200">Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => handleChange('category', val)}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-700 text-white">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="Development">Development</SelectItem>
                                    <SelectItem value="Business">Business</SelectItem>
                                    <SelectItem value="Design">Design</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-slate-200">Course Image</Label>
                        <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-slate-500 transition-colors cursor-pointer bg-slate-950/50">
                            <Upload className="w-8 h-8 text-slate-400" />
                            <p className="text-sm text-slate-400">Upload your course image here. It must meet our course image quality standards (750x422).</p>
                            <Button variant="secondary" size="sm">Select Image</Button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Save Changes'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
