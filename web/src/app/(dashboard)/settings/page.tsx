'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { SettingsService } from '@/services/settings-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, User, Bell, Mail, CreditCard } from 'lucide-react';

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [settings, setSettings] = useState({
        email_notifications: true,
        push_notifications: true,
        marketing_emails: false,
        language: 'en'
    });

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) {
                router.push('/');
                return;
            }
            setUserId(data.user.id);

            try {
                // Fetch settings
                const userSettings = await SettingsService.getSettings(data.user.id);
                if (userSettings) {
                    setSettings({
                        email_notifications: userSettings.email_notifications ?? true,
                        push_notifications: userSettings.push_notifications ?? true,
                        marketing_emails: userSettings.marketing_emails ?? false,
                        language: userSettings.language || 'en'
                    });
                }
            } catch (error) {
                console.error("Failed to load settings", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    const handleSave = async () => {
        if (!userId) return;
        setSaving(true);
        setSuccess(false);
        try {
            await SettingsService.updateSettings(userId, settings);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 2000);
        } catch (error) {
            console.error("Failed to save settings", error);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary" />
                    Settings
                </h1>
                <p className="text-muted-foreground mt-1">
                    Hesap tercihlerinizi ve bildirimlerinizi yönetin.
                </p>
            </header>

            <div className="grid gap-6">
                {/* Account Section */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Hesap
                        </CardTitle>
                        <CardDescription>
                            Kişisel bilgilerinizi yönetin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Email</Label>
                            {loading ? (
                                <Skeleton className="h-10 w-full" />
                            ) : (
                                <div className="p-3 rounded-md bg-secondary/50 text-sm text-muted-foreground cursor-not-allowed">
                                    Kimlik Sağlayıcı üzerinden yönetiliyor
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Section */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Ödeme ve Planlar
                        </CardTitle>
                        <CardDescription>
                            Manage your subscription and billing history.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background/50">
                            <div>
                                <p className="font-medium">Mevcut Plan</p>
                                <p className="text-sm text-muted-foreground">Abonelik detaylarınızı yönetin</p>
                            </div>
                            <Button variant="outline" onClick={() => router.push('/settings/billing')}>
                                Ödemeleri Yönet
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Notifications Section */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="w-5 h-5" />
                            Bildirimler
                        </CardTitle>
                        <CardDescription>
                            Nasıl bildirim almak istediğinizi seçin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loading ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                    <Skeleton className="h-6 w-10 rounded-md" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-64" />
                                    </div>
                                    <Skeleton className="h-6 w-10 rounded-md" />
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="email-notifs" className="font-medium">E-posta Bildirimleri</Label>
                                        <span className="text-sm text-muted-foreground">Kurs ilerlemenizle ilgili güncellemeleri e-posta ile alın.</span>
                                    </div>
                                    <Switch
                                        id="email-notifs"
                                        checked={settings.email_notifications}
                                        onCheckedChange={(checked) => setSettings(s => ({ ...s, email_notifications: checked }))}
                                    />
                                </div>
                                <div className="flex items-center justify-between space-x-2">
                                    <div className="flex flex-col space-y-1">
                                        <Label htmlFor="push-notifs" className="font-medium">Anlık Bildirimler</Label>
                                        <span className="text-sm text-muted-foreground">Gerçek zamanlı bildirimler alın.</span>
                                    </div>
                                    <Switch
                                        id="push-notifs"
                                        checked={settings.push_notifications}
                                        onCheckedChange={(checked) => setSettings(s => ({ ...s, push_notifications: checked }))}
                                    />
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>
                {/* Marketing Section */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Mail className="w-5 h-5" />
                            İletişim
                        </CardTitle>
                        <CardDescription>
                            Pazarlama e-postalarını ve bültenleri yönetin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {loading ? (
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-64" />
                                </div>
                                <Skeleton className="h-6 w-10 rounded-md" />
                            </div>
                        ) : (
                            <div className="flex items-center justify-between space-x-2">
                                <div className="flex flex-col space-y-1">
                                    <Label htmlFor="marketing-emails" className="font-medium">Pazarlama E-postaları</Label>
                                    <span className="text-sm text-muted-foreground">Yeni kurslar ve özellikler hakkında güncellemeler alın.</span>
                                </div>
                                <Switch
                                    id="marketing-emails"
                                    checked={settings.marketing_emails}
                                    onCheckedChange={(checked) => setSettings(s => ({ ...s, marketing_emails: checked }))}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>


            <div className="flex justify-end gap-4">
                <Button variant="outline" onClick={() => router.back()}>İptal</Button>
                <Button onClick={handleSave} disabled={saving || success}>
                    {saving ? 'Kaydediliyor...' : success ? 'Kaydedildi!' : 'Değişiklikleri Kaydet'}
                </Button>
            </div>
        </div>
    );
}
