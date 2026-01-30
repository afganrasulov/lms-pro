'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { setQuickLiveUrl } from '@/app/(dashboard)/live/actions';
import { Loader2, Zap, StopCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface QuickLiveManagerProps {
    currentUrl?: string | null;
}

export function QuickLiveManager({ currentUrl }: QuickLiveManagerProps) {
    const [url, setUrl] = useState(currentUrl || '');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!url) return;

        // Basic Client-Side Validation
        try {
            const parsed = new URL(url);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                toast.error('Lütfen geçerli bir http:// veya https:// bağlantısı giriniz.');
                return;
            }
        } catch (e) {
            toast.error('Geçersiz URL formatı. Bağlantının https:// ile başladığından emin olun.');
            return;
        }

        setLoading(true);
        try {
            const result = await setQuickLiveUrl(url);
            if (result.success) {
                toast.success('Canlı yayın bağlantısı güncellendi ve yayına alındı.');
            } else {
                toast.error('Hata: ' + result.error);
            }
        } catch (error) {
            toast.error('Beklenmedik bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const handleEndSession = async () => {
        setLoading(true);
        try {
            const result = await setQuickLiveUrl('');
            if (result.success) {
                toast.success('Yayın sonlandırıldı.');
                setUrl('');
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
        <Card className="border-blue-500/20 bg-blue-500/5 mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-500">
                    <Zap className="w-5 h-5" />
                    Hızlı Yayın Yönetimi
                </CardTitle>
                <CardDescription>
                    Zoom, Google Meet veya Microsoft Teams linkini buraya yapıştırın. Öğrenciler direkt bu linke yönlendirilecek.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Input
                        placeholder="https://zoom.us/..., https://meet.google.com/..."
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-background flex-1"
                    />
                    <div className="flex gap-2">
                        <Button onClick={handleSave} disabled={loading || !url} className="w-full sm:w-32">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (currentUrl ? 'Güncelle' : 'Başlat')}
                        </Button>

                        {currentUrl && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={loading} className="w-full sm:w-auto px-4">
                                        <StopCircle className="w-4 h-4 mr-2" />
                                        Yayını Bitir
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Yayını bitirmek istiyor musunuz?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Bu işlem yayını sonlandıracak ve öğrencilerin erişimini kapatacaktır.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>İptal</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleEndSession} className="bg-red-600 hover:bg-red-700">
                                            Yayını Bitir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
