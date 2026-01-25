'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, LogOut } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { ProfileStats } from '@/components/profile/profile-stats';
import { ProfileForm } from '@/components/profile/profile-form';

export default function ProfilePage() {
    const {
        loading,
        saving,
        uploading,
        profile,
        userEmail,
        formData,
        setFormData,
        handleSave,
        handleUploadAvatar,
        handleSignOut
    } = useProfile();

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <Skeleton className="h-12 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
                <Card variant="glass" className="border-white/5">
                    <CardHeader><Skeleton className="h-8 w-64" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <User className="w-10 h-10 text-primary" />
                        Profilim
                    </h1>
                    <p className="text-muted-foreground mt-1">Kimliğini yönet ve gelişimini takip et.</p>
                </div>
                <Button
                    variant="destructive"
                    className="md:w-auto w-full gap-2"
                    onClick={handleSignOut}
                >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                </Button>
            </header>

            {/* Stats Overview */}
            <ProfileStats profile={profile} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Profile Settings */}
                <ProfileForm
                    profile={profile}
                    formData={formData}
                    userEmail={userEmail}
                    saving={saving}
                    uploading={uploading}
                    onSave={handleSave}
                    onUploadAvatar={handleUploadAvatar}
                    onNameChange={(val) => setFormData(prev => ({ ...prev, full_name: val }))}
                />
            </div>
        </div>
    );
}
