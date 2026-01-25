import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, User, Camera, Loader2, Save } from 'lucide-react';
import { ProfileWithStats } from '@/services/profile-service';

interface ProfileFormProps {
    profile: ProfileWithStats | null;
    formData: {
        full_name: string;
        avatar_url: string;
    };
    userEmail: string | null;
    saving: boolean;
    uploading: boolean;
    onSave: (e: React.FormEvent) => void;
    onUploadAvatar: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onNameChange: (value: string) => void;
}

export function ProfileForm({
    profile,
    formData,
    userEmail,
    saving,
    uploading,
    onSave,
    onUploadAvatar,
    onNameChange
}: ProfileFormProps) {
    return (
        <Card variant="glass" className="lg:col-span-12 border-white/5">
            <CardHeader>
                <CardTitle className="text-2xl font-bold">Kişisel Bilgiler</CardTitle>
                <CardDescription>Profil detaylarınızı güncelleyin.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSave} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-md bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-white/10 group-hover:border-primary/50 transition-colors relative">
                                {uploading ? (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                ) : null}
                                {formData.avatar_url ? (
                                    <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-primary" />
                                )}
                            </div>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 p-2 rounded-md bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-transform cursor-pointer"
                            >
                                <Camera className="w-4 h-4" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={onUploadAvatar}
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="flex-1 w-full space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Ad Soyad</Label>
                                    <Input
                                        id="full_name"
                                        value={formData.full_name}
                                        onChange={(e) => onNameChange(e.target.value)}
                                        className="bg-white/5 border-white/10 focus:border-primary"
                                        placeholder="Adınızı ve soyadınızı girin"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>E-posta (Salt Okunur)</Label>
                                    <Input
                                        value={userEmail || 'Yükleniyor...'}
                                        readOnly
                                        className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Platform Rolü</Label>
                                    <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm font-medium capitalize">
                                        {profile?.role === 'admin' ? <Shield className="w-4 h-4 text-primary" /> : <User className="w-4 h-4 text-muted-foreground" />}
                                        {profile?.role}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Üyelik Tarihi</Label>
                                    <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-white/5 border border-white/10 text-sm font-medium">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '...'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-white/5">
                        <Button type="submit" disabled={saving} className="gap-2 min-w-[140px]">
                            {saving ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
