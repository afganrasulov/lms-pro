'use server';

import { createClient } from '@/lib/supabase/server';
// @ts-ignore
import { KJUR } from 'jsrsasign';

export async function generateZoomSignature(meetingNumber: string, role: number = 0) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'User not authenticated' };
    }

    // 1. Check License Status
    const { data: profile } = await supabase
        .from('profiles')
        .select('license_status')
        .eq('id', user.id)
        .single();

    if (profile?.license_status !== 'active') {
        // Strict gating: No license, no zoom.
        return { success: false, error: 'License key required for live classes.' };
    }

    try {
        const iat = Math.round(new Date().getTime() / 1000) - 30;
        const exp = iat + 60 * 60 * 2; // 2 hours

        const oHeader = { alg: 'HS256', typ: 'JWT' };

        const oPayload = {
            sdkKey: process.env.ZOOM_CLIENT_ID,
            mn: meetingNumber,
            role: role,
            iat: iat,
            exp: exp,
            appKey: process.env.ZOOM_CLIENT_ID,
            tokenExp: exp
        };

        const sHeader = JSON.stringify(oHeader);
        const sPayload = JSON.stringify(oPayload);
        const signature = KJUR.jws.JWS.sign('HS256', sHeader, sPayload, process.env.ZOOM_CLIENT_SECRET);

        return {
            success: true,
            signature: signature,
            sdkKey: process.env.ZOOM_CLIENT_ID,
            userName: user.email || 'Student'
        };

    } catch (error) {
        console.error('[Zoom] Signature Error:', error);
        return { success: false, error: 'Failed to generate signature' };
    }
}
