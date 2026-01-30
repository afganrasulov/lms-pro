'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { updateLiveUrl } from '@/app/(dashboard)/live/actions';
import { Loader2, Save, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface LiveUrlEditorProps {
    lessonId: string;
    initialUrl: string | null;
}

export function LiveUrlEditor({ lessonId, initialUrl }: LiveUrlEditorProps) {
    const [url, setUrl] = useState(initialUrl || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateLiveUrl(lessonId, url);
            if (result.success) {
                toast.success('Zoom linki güncellendi');
            } else {
                toast.error('Güncelleme başarısız: ' + result.error);
            }
        } catch (error) {
            toast.error('Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex gap-2 items-center w-full mt-4">
            <div className="relative flex-1">
                <LinkIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="url"
                    placeholder="Zoom Linkini Yapıştırın"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-9 bg-background/50 border-white/10"
                />
            </div>
            <Button
                onClick={handleSave}
                disabled={loading}
                size="icon"
                variant="outline"
                className="shrink-0"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Save className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
