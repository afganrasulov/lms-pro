'use server';

import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { polar } from '@/lib/polar';
import { revalidatePath } from 'next/cache';

export async function verifyLicense(licenseKey: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        let isValid = false;
        let validationData = null;
        let checkedOrgsCount = 0;

        // Strategy: 
        // 1. Try Platform Default Token (Legacy/Platform Sales)
        // 2. Try All Organizations with Tokens (SaaS/BYOK Sales)

        // --- Attempt 1: Default Platform ---
        try {
            // Updated for SDK 0.42.2: Removed .users namespace
            // @ts-ignore
            const result = await polar.licenseKeys.validate({
                key: licenseKey,
                organizationId: process.env.POLAR_ORGANIZATION_ID ?? '',
            });

            if (result && result.status === 'granted') {
                isValid = true;
                validationData = result;
            }
        } catch (e) {
            // Platform token check failed, trying SaaS tokens...
        }

        // --- Attempt 2: SaaS Organizations ---
        if (!isValid) {
            // Fetch all organizations that have an access token
            // Use Admin client to bypass RLS, ensuring we check ALL valid tokens
            const supabaseAdmin = getSupabaseAdmin();

            const { data: orgs, error } = await (supabaseAdmin as any)
                .from('organizations')
                .select('id, polar_access_token, polar_organization_id')
                .not('polar_access_token', 'is', null);

            if (error) console.error('[License] Query Error:', error);

            checkedOrgsCount = orgs?.length || 0;

            if (orgs && orgs.length > 0) {
                const { createPolarClient } = await import('@/lib/polar');

                for (const org of orgs) {
                    if (!org.polar_access_token) continue;

                    try {
                        const client = createPolarClient(org.polar_access_token);

                        // Updated for SDK 0.42.2: Removed .users namespace
                        // @ts-ignore
                        const result = await client.licenseKeys.validate({
                            key: licenseKey,
                            organizationId: org.polar_organization_id || undefined,
                        });

                        if (result && result.status === 'granted') {
                            isValid = true;
                            validationData = result;
                            break; // Stop once found
                        }
                    } catch (err) {
                        // console.error(`[License] Error checking Org ${org.id}:`, err);
                    }
                }
            }
        }

        if (isValid) {
            // 2. Update Profile
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    license_key: licenseKey,
                    license_status: 'active'
                })
                .eq('id', user.id);

            if (updateError) {
                console.error('[License] DB Update Error:', updateError);
                return { success: false, error: 'Failed to update user profile' };
            }

            revalidatePath('/settings');
            return { success: true };
        } else {
            return {
                success: false,
                error: `Doğrulama başarısız. (Platform: Invalid, SaaS Orgs Checked: ${checkedOrgsCount})`
            };
        }

    } catch (error: any) {
        console.error('[License] System Error:', error);
        return { success: false, error: `Internal system error: ${error.message || error}` };
    }
}

export async function deactivateLicense() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    try {
        // Also deactivate locally in Polar if this was a "machine" activation concept, 
        // but for now, we just remove it from our local profile.
        // In a real BYOK system, we might want to call Polar's /deactivate API to free up a seat.
        // Assuming just local clearing for now as per "deaktive edebilmeli" request.

        const { error: updateError } = await supabase
            .from('profiles')
            .update({
                license_key: null,
                license_status: 'inactive'
            })
            .eq('id', user.id);

        if (updateError) {
            console.error('[License] Deactivate Error:', updateError);
            return { success: false, error: 'Failed to deactivate license' };
        }

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: `Internal error: ${error.message}` };
    }
}
