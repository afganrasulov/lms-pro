import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function useNotifications(userId: string | undefined | null) {
    const router = useRouter();

    useEffect(() => {
        if (!userId) return;

        console.log("🔔 Subscribing to notifications for user:", userId);

        const channel = supabase
            .channel(`notifications:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log("🔔 New Notification Received:", payload);
                    const newNotification = payload.new as any;

                    // Trigger sound (optional)
                    // const audio = new Audio('/notification.mp3');
                    // audio.play().catch(e => console.log('Audio play failed', e));

                    // Show Toast
                    toast.info(newNotification.title || "New Notification", {
                        description: newNotification.message || "You have a new update!",
                        duration: 5000,
                    });

                    // Refresh Server Components (to update bell count etc.)
                    router.refresh();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId, router]);
}
