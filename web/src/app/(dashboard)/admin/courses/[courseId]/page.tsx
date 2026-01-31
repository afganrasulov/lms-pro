'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CourseService } from '@/services/course-service';
import { ModuleService } from '@/services/module-service';
import { Course, Module } from '@/types/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ModuleList } from '@/components/admin/course-builder/module-list';
import { CourseLandingPageForm } from '@/components/admin/course-builder/course-landing-page-form';
import { ImportCurriculumModal } from '@/components/admin/import-curriculum-modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Extend Module type to include lessons for the builder view
interface ModuleWithLessons extends Module {
    lessons: any[]; // Using any for now to avoid strict type/interface duplication, or we can import Lesson
}

export default function CourseBuilderPage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.courseId as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [modules, setModules] = useState<ModuleWithLessons[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Initial Load
    useEffect(() => {
        if (courseId) {
            loadData();
        }
    }, [courseId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Get current session user first
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);

            const [courseData, modulesData] = await Promise.all([
                CourseService.getCourseById(courseId),
                ModuleService.getCourseCurriculum(courseId)
            ]);
            console.log('[DEBUG] Course Loaded:', courseData);
            console.log('[DEBUG] Modules Loaded:', modulesData);
            setCourse(courseData);
            setModules(modulesData || []);
        } catch (error) {
            console.error('Failed to load course data:', error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateCourse = async () => {
        if (!course) return;
        setSaving(true);
        try {
            await CourseService.updateCourse(courseId, {
                title: course.title,
            });
            toast.success('Course settings saved');
        } catch (error) {
            console.error(error);
            toast.error('Failed to save course');
        } finally {
            setSaving(false);
        }
    };

    const handlePublishToggle = async () => {
        if (!course) return;
        const isPublished = course.status === 'published';
        const newStatus = isPublished ? 'draft' : 'published';
        setSaving(true);
        try {
            await CourseService.updateCourse(courseId, { status: newStatus });
            setCourse({ ...course, status: newStatus });
            toast.success(`Course ${newStatus === 'published' ? 'published' : 'unpublished'}`);
        } catch (error) {
            console.error(error);
            toast.error('Failed to update status');
        } finally {
            setSaving(false);
        }
    };

    const handleExport = () => {
        window.location.href = `/api/courses/${courseId}/export`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col items-center justify-center h-screen space-y-4">
                <h1 className="text-2xl font-bold text-white">Course not found</h1>
                <Button onClick={() => router.push('/admin/courses')} variant="outline">
                    Back to Courses
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start border-b border-slate-800 pb-6">
                <div className="space-y-4 flex-1">
                    <Button
                        variant="ghost"
                        className="pl-0 text-slate-400 hover:text-white"
                        onClick={() => router.push('/admin/courses')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Courses
                    </Button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-3xl font-bold text-white">{course.title}</h1>
                        <Badge
                            variant={course.status === 'published' ? 'default' : 'secondary'}
                            className={`cursor-pointer ${course.status === 'published' ? 'bg-green-500/10 text-green-500' : ''}`}
                            onClick={handlePublishToggle}
                        >
                            {course.status === 'published' ? 'Published' : 'Draft'}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Actions if needed */}
                </div>
            </div>

            <Tabs defaultValue="curriculum" className="space-y-6">
                <TabsList className="bg-slate-900 border border-slate-800 p-1 h-auto">
                    <TabsTrigger value="landing" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white px-6 py-2">
                        Landing Page
                    </TabsTrigger>
                    <TabsTrigger value="curriculum" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white px-6 py-2">
                        Curriculum
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white px-6 py-2">
                        Settings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="landing" className="outline-none">
                    <CourseLandingPageForm course={course} onUpdate={loadData} />
                </TabsContent>

                <TabsContent value="curriculum" className="outline-none space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Curriculum</h2>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </Button>
                            <ImportCurriculumModal courseId={courseId} onSuccess={loadData} />
                        </div>
                    </div>
                    <ModuleList
                        courseId={courseId}
                        modules={modules}
                        onUpdate={loadData}
                        currentUserId={currentUser?.id}
                    />
                </TabsContent>

                <TabsContent value="settings" className="outline-none">
                    <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg">
                        <h3 className="text-lg font-medium text-white mb-4">Course Settings</h3>
                        <p className="text-slate-400 mb-4">Manage course visibility and deletion.</p>

                        <div className="flex items-center gap-4">
                            <Button onClick={handlePublishToggle} variant="outline" className="border-slate-700 hover:bg-slate-800 text-white">
                                {course.status === 'published' ? 'Unpublish Course' : 'Publish Course'}
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
