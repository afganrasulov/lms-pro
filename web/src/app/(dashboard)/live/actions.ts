'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function setQuickLiveUrl(url: string) {
    const supabase = await createClient();

    // 1. Auth Check - Admin only
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Unauthorized' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return { success: false, error: 'Permission denied' };
    }

    // 2. Update System Settings
    // value is JSONB
    const { error } = await supabase
        .from('system_settings')
        .upsert({
            key: 'live_session_config',
            value: { video_url: url },
            updated_by: user.id,
            updated_at: new Date().toISOString()
        }, { onConflict: 'key' });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/live');
    revalidatePath('/');
    return { success: true };
}

// Helper to get the live url (server-side helper for consistency)
export async function getLiveUrl() {
    const supabase = await createClient();
    const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'live_session_config')
        .single();

    return (data?.value as any)?.video_url || null;
}

export async function createLiveClass(data: any) {
    return { success: false, error: "Not implemented" };
}

export async function getAdminCoursesForSelect() {
    return [];
}

export async function getModulesForCourse(courseId: string) {
    return [];
}

export async function updateLiveUrl(lessonId: string, url: string) {
    return setQuickLiveUrl(url);
}
