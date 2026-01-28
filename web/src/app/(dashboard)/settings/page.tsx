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
import { Settings, User, Bell, Mail, CreditCard, Key } from 'lucide-react';
import { verifyLicense, deactivateLicense } from '@/actions/license';
import { updateOrganizationPolarKeys, getOrganizationSettings, disconnectOrganizationPolar } from '@/actions/organization';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
        language: 'en',
        license_key: '',
        license_status: 'inactive',
        email: ''
    });
    const [polarSettings, setPolarSettings] = useState({
        polar_access_token: '',
        polar_organization_id: ''
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
                const [userSettings, orgSettings] = await Promise.all([
                    SettingsService.getSettings(data.user.id),
                    getOrganizationSettings()
                ]);

                if (userSettings) {
                    setSettings({
                        email_notifications: userSettings.email_notifications ?? true,
                        push_notifications: userSettings.push_notifications ?? true,
                        marketing_emails: userSettings.marketing_emails ?? false,
                        language: userSettings.language || 'en',
                        license_key: (userSettings as any).license_key || '',
                        license_status: (userSettings as any).license_status || 'inactive',
                        email: data.user.email || ''
                    });
                }

                if (orgSettings) {
                    setPolarSettings({
                        polar_access_token: orgSettings.polar_access_token || '',
                        polar_organization_id: orgSettings.polar_organization_id || ''
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

    const handleEmailChange = async () => {
        if (!userId) return;
        setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: settings.email });
            if (error) {
                toast.error(`E-posta güncelleme hatası: ${error.message}`);
            } else {
                toast.success('Onay e-postası yeni adresinize gönderildi. Lütfen kutunuzu kontrol edin.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Hata oluştu');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleChange = async (key: keyof typeof settings, value: boolean) => {
        // 1. Optimistic Update
        setSettings(s => ({ ...s, [key]: value }));

        if (!userId) return;

        // 2. Background Save
        try {
            // Send ALL settings to ensure we don't partial-update/nullify others
            // Construct the latest state explicitly
            const newSettings = { ...settings, [key]: value };

            await SettingsService.updateSettings(userId, newSettings);
            toast.success("Ayar güncellendi");
        } catch (error) {
            console.error("Auto-save failed", error);
            toast.error("Kaydedilemedi");
            // Rollback on error
            setSettings(s => ({ ...s, [key]: !value }));
        }
    };

    const handlePolarSave = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('polar_access_token', polarSettings.polar_access_token);
            formData.append('polar_organization_id', polarSettings.polar_organization_id);

            const result = await updateOrganizationPolarKeys(formData);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Polar entegrasyonu kaydedildi!');
            }
        } catch (error) {
            toast.error('Kaydetme hatası');
        } finally {
            setSaving(false);
        }
    };

    const handlePolarDisconnect = async () => {
        if (!confirm("Polar entegrasyonunu kaldırmak istediğinize emin misiniz? Bu işlem geri alınamaz.")) return;
        setSaving(true);
        try {
            const result = await disconnectOrganizationPolar();
            if (result.error) {
                toast.error(result.error);
            } else {
                setPolarSettings({ polar_access_token: '', polar_organization_id: '' });
                toast.success('Polar bağlantısı kesildi.');
            }
        } catch (error) {
            toast.error('Bağlantı kesme hatası');
        } finally {
            setSaving(false);
        }
    };

    const handleLicenseDeactivate = async () => {
        if (!confirm("Lisans anahtarını kaldırmak istediğinize emin misiniz? Kurs erişimleriniz kısıtlanabilir.")) return;
        setSaving(true);
        try {
            const result = await deactivateLicense();
            if (result.success) {
                setSettings(s => ({ ...s, license_key: '', license_status: 'inactive' }));
                toast.success('Lisans anahtarı kaldırıldı.');
            } else {
                toast.error(result.error);
            }
        } catch (e) {
            toast.error("İşlem başarısız.");
        } finally {
            setSaving(false);
        }
    };

    const handleLicenseVerify = async () => {
        if (!settings.license_key) return;
        setSaving(true);
        try {
            const result = await verifyLicense(settings.license_key);
            if (result.success) {
                setSettings(s => ({ ...s, license_status: 'active' }));
                toast.success('Lisans anahtarı doğrulandı ve aktif edildi!');
            } else {
                toast.error(result.error || 'Lisans anahtarı geçersiz.');
            }
        } catch (error) {
            toast.error('Doğrulama sırasında bir hata oluştu.');
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
                            <div className="flex gap-2">
                                <Input
                                    value={settings.email}
                                    onChange={(e) => setSettings(s => ({ ...s, email: e.target.value }))}
                                    placeholder="your@email.com"
                                />
                                <Button onClick={handleEmailChange} disabled={saving}>Güncelle</Button>
                            </div>
                            <p className="text-xs text-muted-foreground">E-posta değişikliği için yeni adrese gönderilen onayı doğrulamanız gerekir.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* License Key Section */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="w-5 h-5 text-yellow-500" />
                            Lisans Anahtarı
                        </CardTitle>
                        <CardDescription>
                            Polar.sh üzerinden aldığınız lisans anahtarını girin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <Label htmlFor="license-key" className="sr-only">Lisans Anahtarı</Label>
                                <Input
                                    id="license-key"
                                    placeholder="Lisans anahtarınızı buraya yapıştırın (örn: ONE-TWO-THREE)"
                                    value={settings.license_key}
                                    onChange={(e) => setSettings(s => ({ ...s, license_key: e.target.value }))}
                                    disabled={settings.license_status === 'active'}
                                    className="bg-background/50"
                                />
                            </div>
                            <Button
                                onClick={handleLicenseVerify}
                                disabled={saving || settings.license_status === 'active' || !settings.license_key}
                            >
                                {settings.license_status === 'active' ? 'Aktif ✅' : 'Doğrula'}
                            </Button>
                        </div>
                        {settings.license_status === 'active' && (
                            <div className="flex flex-col gap-2 mt-2">
                                <p className="text-sm text-green-500 font-medium">
                                    Lisansınız aktif. Tüm kurslara erişebilirsiniz.
                                </p>
                                <Button variant="destructive" size="sm" onClick={handleLicenseDeactivate} className="w-fit" disabled={saving}>
                                    Anahtarı Kaldır / Deaktive Et
                                </Button>
                            </div>
                        )}
                        {loading && <Skeleton className="h-10 w-full" />}
                    </CardContent>
                </Card>

                {/* Polar Integration Section (SaaS) */}
                <Card className="bg-card/50 backdrop-blur border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-blue-400" />
                            Polar Entegrasyonu (SaaS)
                        </CardTitle>
                        <CardDescription>
                            Kurslarınızı kendi Polar hesabınız üzerinden satmak için API anahtarınızı girin.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="polar-token">Polar Access Token</Label>
                            <Input
                                id="polar-token"
                                type="password"
                                placeholder="pol_..."
                                value={polarSettings.polar_access_token}
                                onChange={(e) => setPolarSettings(s => ({ ...s, polar_access_token: e.target.value }))}
                                className="bg-background/50"
                            />
                            <p className="text-xs text-muted-foreground">
                                Polar dashboard'dan aldığınız Access Token. (Ayarlar &rarr; Developers)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="polar-org">Polar Organization ID (Opsiyonel)</Label>
                            <Input
                                id="polar-org"
                                placeholder="Org ID..."
                                value={polarSettings.polar_organization_id}
                                onChange={(e) => setPolarSettings(s => ({ ...s, polar_organization_id: e.target.value }))}
                                className="bg-background/50"
                            />
                        </div>
                        <Button
                            onClick={handlePolarSave}
                            disabled={saving}
                            className="w-full sm:w-auto"
                        >
                            Entegrasyonu Kaydet
                        </Button>
                        {polarSettings.polar_access_token && (
                            <Button
                                variant="destructive"
                                onClick={handlePolarDisconnect}
                                disabled={saving}
                                className="w-full sm:w-auto ml-2"
                            >
                                Bağlantıyı Kes
                            </Button>
                        )}
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
                                        onCheckedChange={(checked) => handleToggleChange('email_notifications', checked)}
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
                                        onCheckedChange={(checked) => handleToggleChange('push_notifications', checked)}
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
                                    onCheckedChange={(checked) => handleToggleChange('marketing_emails', checked)}
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
        </div >
    );
}
