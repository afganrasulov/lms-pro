"use client";

import { useEffect, useState } from "react";
import { CourseService } from "@/services/course-service";
import { Course } from "@/types/index";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import { CourseDialog } from "@/components/admin/course-dialog";
import { ImportCurriculumModal } from "@/components/admin/import-curriculum-modal";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingCourse, setEditingCourse] = useState<Course | undefined>(undefined);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const loadCourses = async () => {
        setLoading(true);
        try {
            const data = await CourseService.getAdminCourses();
            setCourses(data || []);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCourses();
    }, []);

    const handleDelete = async (courseId: string) => {
        if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;
        try {
            await CourseService.deleteCourse(courseId);
            toast.success("Course deleted");
            loadCourses();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete course");
        }
    };

    // Bulk Actions
    const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set());

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedCourses(new Set(courses.map((c) => c.id)));
        } else {
            setSelectedCourses(new Set());
        }
    };

    const toggleSelect = (courseId: string, checked: boolean) => {
        const newSelected = new Set(selectedCourses);
        if (checked) {
            newSelected.add(courseId);
        } else {
            newSelected.delete(courseId);
        }
        setSelectedCourses(newSelected);
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedCourses.size} selected courses? This cannot be undone.`)) return;

        try {
            await CourseService.deleteCourses(Array.from(selectedCourses));
            toast.success(`${selectedCourses.size} courses deleted`);
            setSelectedCourses(new Set());
            loadCourses();
        } catch (error) {
            console.error(error);
            toast.error("Failed to delete courses");
        }
    };

    // Drag and Drop
    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const items = Array.from(courses);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        // Optimistic update
        setCourses(items);

        // Prepare updates for backend
        const updatedCourses = items.map((course, index) => ({
            ...course,
            position: index,
        }));

        try {
            await CourseService.updateCoursePositions(updatedCourses);
            toast.success("Order updated");
        } catch (error) {
            console.error("Failed to save order", error);
            toast.error("Failed to save order");
            loadCourses(); // Revert on error
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Kursları Yönet</h1>
                    <p className="text-slate-400">Platformdaki tüm kursları oluşturun, düzenleyin ve yönetin.</p>
                </div>
                <div className="flex items-center gap-2">
                    {selectedCourses.size > 0 && (
                        <Button
                            onClick={handleBulkDelete}
                            variant="destructive"
                            className="bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-900"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Seçilenleri Sil ({selectedCourses.size})
                        </Button>
                    )}
                    <ImportCurriculumModal
                        onSuccess={() => {
                            toast.success("Course imported successfully");
                            loadCourses();
                        }}
                    />
                    <Button onClick={() => setCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni Kurs Oluştur
                    </Button>
                </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Table>
                        <TableHeader className="bg-slate-950">
                            <TableRow className="hover:bg-transparent border-slate-800">
                                <TableHead className="w-10"></TableHead>
                                <TableHead className="w-12">
                                    <Checkbox
                                        checked={courses.length > 0 && selectedCourses.size === courses.length}
                                        onCheckedChange={toggleSelectAll}
                                        aria-label="Select all"
                                        className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                </TableHead>
                                <TableHead className="text-slate-400">Başlık</TableHead>
                                <TableHead className="text-slate-400">Durum</TableHead>
                                <TableHead className="text-slate-400">Görünürlük</TableHead>
                                <TableHead className="text-slate-400">Oluşturulma</TableHead>
                                <TableHead className="text-right text-slate-400">İşlemler</TableHead>
                            </TableRow>
                        </TableHeader>
                        {loading ? (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        ) : courses.length === 0 ? (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="h-24 text-center text-slate-400">
                                        Kurs bulunamadı. Başlamak için yeni bir tane oluşturun.
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        ) : (
                            <Droppable droppableId="courses-table">
                                {(provided) => (
                                    <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                                        {courses.map((course, index) => (
                                            <Draggable key={course.id} draggableId={course.id} index={index}>
                                                {(provided, snapshot) => (
                                                    <TableRow
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        className={`border-slate-800 hover:bg-slate-800/50 transition-colors ${snapshot.isDragging ? "bg-slate-800 shadow-xl opacity-90 table" : ""
                                                            }`}
                                                        style={{
                                                            ...provided.draggableProps.style,
                                                            display: snapshot.isDragging ? "table" : undefined,
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <div {...provided.dragHandleProps} className="cursor-grab hover:text-white text-slate-500">
                                                                <GripVertical className="w-4 h-4" />
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={selectedCourses.has(course.id)}
                                                                onCheckedChange={(checked) => toggleSelect(course.id, checked as boolean)}
                                                                aria-label={`Select ${course.title}`}
                                                                className="border-slate-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="font-medium text-white">{course.title}</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={course.status === 'published' ? "default" : "secondary"}
                                                                className={
                                                                    course.status === 'published'
                                                                        ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                                                        : ""
                                                                }
                                                            >
                                                                {course.status === 'published' ? 'Published' : 'Draft'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="border-slate-700 text-slate-400">
                                                                {course.visibility}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-slate-400">
                                                            {formatDistanceToNow(new Date(course.created_at), { addSuffix: true, locale: tr })}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" asChild>
                                                                    <a href={`/admin/courses/${course.id}`}>
                                                                        <Pencil className="w-4 h-4" />
                                                                    </a>
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/10"
                                                                    onClick={() => handleDelete(course.id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </TableBody>
                                )}
                            </Droppable>
                        )}
                    </Table>
                </DragDropContext>
            </div>

            <CourseDialog
                open={createOpen}
                onOpenChange={setCreateOpen}
                onSuccess={() => {
                    toast.success("Course created");
                    loadCourses();
                }}
            />

            <CourseDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                course={editingCourse}
                onSuccess={() => {
                    toast.success("Course updated");
                    loadCourses();
                }}
            />
        </div>
    );
}
