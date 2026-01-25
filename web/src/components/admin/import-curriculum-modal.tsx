'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertTriangle, Loader2, Download } from 'lucide-react';

export interface ImportCurriculumModalProps {
    courseId?: string; // Optional for global import (create new)
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function ImportCurriculumModal({
    courseId,
    trigger,
    onSuccess,
}: ImportCurriculumModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [clearExisting, setClearExisting] = useState(false);
    const router = useRouter();

    const isGlobal = !courseId;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleExport = () => {
        // Correct URL based on context
        const url = isGlobal ? '/api/courses/template' : `/api/courses/${courseId}/export`;
        window.location.href = url;
        toast.info(isGlobal ? 'Downloading template...' : 'Export started...');
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        setIsLoading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (!isGlobal) {
            formData.append('clearExisting', clearExisting.toString());
        }

        try {
            const url = isGlobal ? '/api/courses/import' : `/api/courses/${courseId}/import`;
            const response = await fetch(url, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Import failed');
            }

            toast.success(isGlobal ? 'Course created successfully' : 'Course data imported successfully');
            setIsOpen(false);
            setFile(null);
            setClearExisting(false);

            // Force a router refresh to update server components if any
            router.refresh();

            // Trigger parent update (loadData)
            if (onSuccess) {
                onSuccess();
            }
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error.message || 'Failed to import curriculum');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        {isGlobal ? 'Import New Course' : 'Bulk Import/Export'}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{isGlobal ? 'Import New Course' : 'Bulk Course Management'}</DialogTitle>
                    <DialogDescription>
                        {isGlobal
                            ? 'Create a new course by uploading a filled Excel template.'
                            : 'Export your course to Excel to edit offline, or upload an updated file.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Export Section */}
                    <div className="space-y-2 border-b pb-4">
                        <h4 className="font-medium text-sm">1. {isGlobal ? 'Download Template' : 'Download Template / Export Current Course'}</h4>
                        <p className="text-xs text-muted-foreground">
                            {isGlobal
                                ? 'Download the blank Excel template to fill in your course details.'
                                : 'Download the current course structure as an Excel file. This file acts as your template.'}
                            The file will have two sheets: <strong>Course Settings</strong> and <strong>Curriculum</strong>.
                        </p>
                        <Button variant="outline" size="sm" onClick={handleExport} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            {isGlobal ? 'Download Blank Template' : 'Download Excel Template'}
                        </Button>
                    </div>

                    {/* Import Section */}
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm">2. Upload Updated Excel</h4>
                        <div className="grid gap-2">
                            <Label htmlFor="file" className="text-left">
                                Select Excel File (.xlsx)
                            </Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="file"
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    disabled={isLoading}
                                />
                            </div>
                            {file && (
                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                    <FileSpreadsheet className="h-4 w-4" />
                                    {file.name}
                                </div>
                            )}
                        </div>

                        {!isGlobal && (
                            <div className="flex items-center space-x-2 rounded-lg border p-3 bg-muted/50">
                                <Switch
                                    id="clear-mode"
                                    checked={clearExisting}
                                    onCheckedChange={setClearExisting}
                                    disabled={isLoading}
                                />
                                <div className="grid gap-0.5">
                                    <Label htmlFor="clear-mode" className="text-base font-medium">
                                        Full Overwrite Mode
                                    </Label>
                                    <p className="text-xs text-muted-foreground text-destructive flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Warning: This will DELETE all existing modules and lessons before importing.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button onClick={handleImport} disabled={!file || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Import Course Data
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
