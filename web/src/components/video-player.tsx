"use client";

import dynamic from 'next/dynamic';
import { useMemo, useState, useEffect } from 'react';

// Dynamic imports to handle SSR and lazy loading correctly
const ReactPlayer = dynamic(() => import('react-player'), { ssr: false });
const VimeoPlayer = dynamic(() => import('vimeo-video-element/react'), { ssr: false });

interface VideoPlayerProps {
    url: string;
    onEnded?: () => void;
}

export const VideoPlayer = ({ url, onEnded }: VideoPlayerProps) => {
    const [hasError, setHasError] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Clean and normalize URLs
    const finalUrl = useMemo(() => {
        if (!url) return '';

        // Helper regex to extract URL from iframe string if present
        let processedUrl = url;
        if (url.includes('<iframe')) {
            const match = url.match(/src\s*=\s*["']([^"']+)["']/);
            if (match) {
                processedUrl = match[1];
            }
        }

        // Handle Vimeo URLs specifically
        if (processedUrl.includes('vimeo.com')) {
            // clean tracking params but KEEP hash if present
            try {
                const urlObj = new URL(processedUrl);
                // Remove common tracking params
                urlObj.searchParams.delete('fl');
                urlObj.searchParams.delete('fe');

                // If it's player.vimeo.com, convert to standard vimeo.com/ID for compatibility
                if (urlObj.hostname === 'player.vimeo.com') {
                    // path is /video/ID -> we want vimeo.com/ID
                    const parts = urlObj.pathname.split('/');
                    const id = parts[parts.length - 1]; // last part
                    processedUrl = `https://vimeo.com/${id}${urlObj.search}${urlObj.hash}`;
                } else {
                    processedUrl = urlObj.toString();
                }

                // Logging for verification
                console.log('[VideoPlayer] Cleaned Vimeo URL:', {
                    original: url,
                    cleaned: processedUrl
                });

            } catch (e) {
                console.error('[VideoPlayer] Invalid URL:', url);
            }
        }

        return processedUrl;
    }, [url]);

    const isVimeo = useMemo(() => {
        return finalUrl.includes('vimeo.com');
    }, [finalUrl]);

    if (!isClient) return <div className="aspect-video bg-black rounded-lg" />;

    // Cast to any to avoid TS issues with dynamic imports/props
    const Player = ReactPlayer as any;
    const Vimeo = VimeoPlayer as any;

    if (hasError) {
        return (
            <div className="aspect-video bg-black rounded-lg flex items-center justify-center text-white">
                <p>Video playback error. Please try refreshing.</p>
            </div>
        );
    }

    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-800">
            {isVimeo ? (
                /* Use vimeo-video-element direct wrapper for Vimeo to avoid react-player fallback issues */
                <Vimeo
                    src={finalUrl}
                    controls
                    style={{ width: '100%', height: '100%' }}
                    onended={onEnded} /* React wrapper handles standard events */
                    onEnded={onEnded}
                    onError={(e: any) => {
                        console.error('[VideoPlayer] Vimeo Error:', e);
                        setHasError(true);
                    }}
                />
            ) : (
                <Player
                    url={finalUrl}
                    width="100%"
                    height="100%"
                    controls={true}
                    onEnded={onEnded}
                    onError={(e: any) => {
                        console.error('[VideoPlayer] Playback Error:', e);
                        setHasError(true);
                    }}
                    config={{
                        youtube: { playerVars: { showinfo: 1 } }
                    }}
                />
            )}
        </div>
    );
};
