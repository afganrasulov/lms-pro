import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    // 1. Authorization Check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin via profiles table
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    try {
        const { userIds } = await request.json();

        if (!Array.isArray(userIds) || userIds.length === 0) {
            return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
        }

        // 2. Delete from Auth (cascades to profiles if configured, or we assume it handles the auth part)
        // Note: 'profiles' usually has ON DELETE CASCADE from 'auth.users' if set up correctly.
        // If not, we might need to delete from profiles manually first or rely on this.
        // Usually, deleting from auth.users is the 'hard' delete.

        const deletePromises = userIds.map(async (id) => {
            const supabaseAdmin = getSupabaseAdmin();
            const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
            if (error) {
                console.error(`Failed to delete user ${id} from auth:`, error);
                throw error;
            }
            return id;
        });

        await Promise.all(deletePromises);

        return NextResponse.json({ success: true, count: userIds.length });
    } catch (error: any) {
        console.error('Delete User Error:', {
            message: error.message,
            name: error.name,
            status: error.status,
            details: error
        });
        return NextResponse.json({
            error: error.message || 'Internal Server Error',
            details: error.message
        }, { status: 500 });
    }
}
