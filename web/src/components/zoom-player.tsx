'use client';

import { useEffect, useState } from 'react';
import { generateZoomSignature } from '@/actions/zoom';
import { Button } from '@/components/ui/button';
import { Loader2, Lock } from 'lucide-react';

interface ZoomPlayerProps {
    meetingNumber: string;
    passcode: string;
}

export default function ZoomPlayer({ meetingNumber, passcode }: ZoomPlayerProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

    useEffect(() => {
        const loadZoomSDK = async () => {
            if (typeof window === 'undefined') return;

            // Dynamic import to avoid SSR issues with Zoom SDK
            const { ZoomMtg } = (await import('@zoomus/websdk')).default;

            ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
            ZoomMtg.preLoadWasm();
            ZoomMtg.prepareWebSDK();
            // Standard generic language
            ZoomMtg.i18n.load('en-US');

            setIsSdkLoaded(true);
        };

        loadZoomSDK();
    }, []);

    const handleJoin = async () => {
        setLoading(true);
        setError(null);

        try {
            const { ZoomMtg } = (await import('@zoomus/websdk')).default;
            const result = await generateZoomSignature(meetingNumber, 0); // 0 = Participant

            if (!result.success || !result.signature) {
                throw new Error(result.error || 'Failed to generate access signature');
            }

            const meetConfig = {
                meetingNumber: meetingNumber,
                userName: result.userName || 'Participant',
                sdkKey: result.sdkKey,
                userEmail: '', // Optional
                passWord: passcode,
                signature: result.signature,
            };

            const root = document.getElementById('zmmtg-root');
            if (root) {
                root.style.display = 'block';
                root.style.position = 'relative';
                root.style.width = '100%';
                root.style.height = '100%';
                root.style.zIndex = '1';
                // Adjust container style to match embedded view if needed
            }

            ZoomMtg.init({
                leaveUrl: window.location.href, // Stay on page after leave
                success: (success: any) => {
                    console.log('Zoom Init Success', success);
                    ZoomMtg.join({
                        ...meetConfig,
                        success: (joinSuccess: any) => {
                            console.log('Zoom Join Success', joinSuccess);
                            setLoading(false);
                        },
                        error: (joinError: any) => {
                            console.error('Zoom Join Error', joinError);
                            setError('Could not join the meeting. Check ID/Passcode.');
                            setLoading(false);
                        }
                    });
                },
                error: (initError: any) => {
                    console.error('Zoom Init Error', initError);
                    setError('Failed to initialize Zoom player.');
                    setLoading(false);
                }
            });

        } catch (err: any) {
            console.error('Zoom Join Exception:', err);
            setError(err.message || 'An unexpected error occurred.');
            setLoading(false);
        }
    };

    if (!isSdkLoaded) {
        return (
            <div className="flex items-center justify-center h-96 bg-black/5 rounded-lg border border-dashed">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Oynatıcı Yükleniyor...</span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden border border-white/10 shadow-2xl flex flex-col items-center justify-center">
            {/* The Zoom SDK mounts directly to zmmtg-root global ID usually, 
                For Component View, we might strictly need <div id="zmmtg-root"></div> somewhere. 
                However, Component View is tricky. 
                Let's use the element approach if possible or overlay.
            */}

            {/* 
              IMPORTANT: Zoom Web SDK (Component View) attaches to specific ID.
              We'll place it here.
            */}
            <div id="zmmtg-root" className="absolute inset-0 bg-transparent" style={{ display: 'none' }} />

            {!loading && (
                <div className="z-10 text-center space-y-4 p-8 bg-black/80 backdrop-blur-md rounded-xl border border-white/5 mx-4">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Canlı Ders Oturumu</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                        Bu derse katılmak için Polar lisansınız doğrulanmıştır.
                        Hazır olduğunuzda yayına katılabilirsiniz.
                    </p>
                    <Button
                        size="lg"
                        onClick={handleJoin}
                        className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px]"
                    >
                        Yayına Katıl
                    </Button>
                    {error && (
                        <p className="text-red-400 text-xs mt-2 font-medium bg-red-900/20 py-1 px-2 rounded">
                            {error}
                        </p>
                    )}
                </div>
            )}

            {loading && (
                <div className="z-10 text-white flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                    <p className="text-sm text-blue-200">Bağlanılıyor...</p>
                </div>
            )}
        </div>
    );
}
