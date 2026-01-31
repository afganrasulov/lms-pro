import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ProfileService, ProfileWithStats } from '@/services/profile-service';
import { toast } from 'sonner';

export function useProfile() {
    const supabase = createClient();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState<ProfileWithStats | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        full_name: '',
        avatar_url: ''
    });

    // Initial Load
    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setUserEmail(user.email ?? null);

            try {
                const data = await ProfileService.getProfileWithStats(user.id);
                setProfile(data);
                setFormData({
                    full_name: data.full_name || '',
                    avatar_url: data.avatar_url || ''
                });
            } catch (error) {
                console.error('Error loading profile:', error);
                toast.error('Failed to load profile data.');
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [router]);

    // Real-time Subscription
    useEffect(() => {
        if (!profile?.id) return;

        const channel = supabase
            .channel('profile-data-changes')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${profile.id}`
                },
                (payload) => {
                    const newProfile = payload.new as Partial<ProfileWithStats>;
                    setProfile((prev: ProfileWithStats | null) => prev ? { ...prev, ...newProfile } : null);

                    if (newProfile.xp_points !== undefined) {
                        toast.info('XP Güncellendi!');
                        router.refresh();
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for INSERT/UPDATE (in case streak is created)
                    schema: 'public',
                    table: 'user_streaks',
                    filter: `user_id=eq.${profile.id}`
                },
                (payload) => {
                    // Refresh the full profile to get clean relation data, or manually patch it.
                    // Patching is faster but tricky with nested arrays.
                    // Let's re-fetch for accuracy, or patch if simple.
                    // Since streak is just a number, let's patch it.
                    const newStreak = payload.new as { current_streak: number, longest_streak: number };

                    setProfile((prev: ProfileWithStats | null) => {
                        if (!prev) return null;

                        const currentStreaks = prev.user_streaks;
                        let updatedStreaks: any;

                        if (Array.isArray(currentStreaks)) {
                            // Handle Array Case
                            const copy = [...currentStreaks];
                            if (copy.length > 0) {
                                copy[0] = { ...copy[0], ...newStreak };
                            } else {
                                copy.push(newStreak);
                            }
                            updatedStreaks = copy;
                        } else {
                            // Handle Object/Null Case (1-to-1)
                            updatedStreaks = { ...(currentStreaks || {}), ...newStreak };
                        }

                        return { ...prev, user_streaks: updatedStreaks };
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [profile?.id]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setSaving(true);
        try {
            const updated = await ProfileService.updateProfile(profile.id, formData, supabase);
            if (updated) {
                setProfile((prev: ProfileWithStats | null) => prev ? { ...prev, ...updated } : null);
            }
            toast.success('Profile updated successfully!');
            router.refresh();
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile.');
        } finally {
            setSaving(false);
        }
    };

    const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        if (!profile) return;

        const file = e.target.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        setUploading(true);
        const toastId = toast.loading('Uploading avatar...');

        try {
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const newFormData = { ...formData, avatar_url: publicUrl };
            setFormData(newFormData);

            // Auto-save
            await ProfileService.updateProfile(profile.id, newFormData, supabase);

            // Optimistic update
            setProfile((prev: ProfileWithStats | null) => prev ? { ...prev, avatar_url: publicUrl } : null);

            toast.success('Avatar updated!', { id: toastId });
            router.refresh();

        } catch (error) {
            console.error('Error uploading avatar:', error);
            toast.error('Error uploading avatar!', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = () => {
        supabase.auth.signOut().then(() => router.push('/login'));
    };

    return {
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
    };
}

