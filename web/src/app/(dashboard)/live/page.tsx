import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Video, Lock, ExternalLink, Radio } from 'lucide-react';
import { QuickLiveManager } from '@/components/live/quick-live-manager';

export const metadata = {
    title: 'Canlı Yayınlar | LMS Pro',
    description: 'Yaklaşan ve aktif canlı dersler.'
};

export default async function LiveClassesPage() {
    const supabase = await createClient();

    // 1. Get User License Status & Role
    const { data: { user } } = await supabase.auth.getUser();
    let hasLicense = false;
    let isAdmin = false;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('license_status, role')
            .eq('id', user.id)
            .single();
        hasLicense = profile?.license_status === 'active';
        isAdmin = profile?.role === 'admin';
    }

    // 2. Fetch Live URL from System Settings
    // We try to fetch the global live settings.
    const { data: settings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'live_session_config')
        .single();

    // Parse the value correctly. It implies value is JSONB
    const liveUrl = settings?.value && typeof settings.value === 'object' && 'video_url' in settings.value
        ? (settings.value as { video_url: string }).video_url
        : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 container max-w-5xl mx-auto py-8">
            <header className="flex flex-col gap-2 mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Video className="w-8 h-8 text-red-500" />
                    Canlı Yayınlar
                </h1>
                <p className="text-muted-foreground">
                    Katılabileceğiniz aktif canlı dersler.
                </p>
            </header>

            {/* ADMIN SECTION */}
            {isAdmin && (
                <QuickLiveManager currentUrl={liveUrl || ''} />
            )}

            {/* STUDENT / MAIN SECTION - License Check */}
            {!isAdmin && !hasLicense && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl flex items-start gap-4 mb-8">
                    <div className="bg-yellow-500/20 p-2 rounded-full">
                        <Lock className="w-6 h-6 text-yellow-500" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-xl text-yellow-500">Lisans Anahtarı Gerekli</h3>
                        <p className="text-muted-foreground mt-2">
                            Canlı yayınlara katılabilmek için Polar lisans anahtarınızı doğrulamanız gerekmektedir.
                        </p>
                        <Button asChild variant="outline" className="mt-4 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10">
                            <Link href="/settings">Lisans Gir</Link>
                        </Button>
                    </div>
                </div>
            )}

            {/* ACTIVE SESSION CARD - SIMPLIFIED UI */}
            {liveUrl ? (
                <Card className="bg-gradient-to-br from-red-950/30 to-black border-red-500/20 overflow-hidden relative">
                    {/* Background Effects */}
                    <div className="absolute top-0 right-0 p-32 bg-red-500/20 blur-[100px] rounded-full pointer-events-none" />

                    <CardContent className="relative z-10 p-8 flex flex-col items-center justify-center text-center gap-6 py-16">

                        <div className="flex items-center gap-2 mb-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            <span className="text-red-500 font-bold tracking-widest text-sm uppercase">CANLI YAYINDA</span>
                        </div>

                        {/* Title removed as requested by user ("dik dörtken kutuyla olan alanı sil") */}

                        <div className="flex flex-col md:flex-row gap-4 items-center w-full justify-center">
                            <Button
                                asChild
                                size="lg"
                                className="w-full md:w-auto text-lg h-16 px-12 bg-red-600 hover:bg-red-700 shadow-xl shadow-red-900/20 transition-all font-semibold rounded-full"
                                disabled={!hasLicense}
                            >
                                <Link
                                    href={hasLicense ? liveUrl : '/settings'}
                                    target={hasLicense ? "_blank" : undefined}
                                >
                                    {hasLicense ? (
                                        <>
                                            Yayına Git <ExternalLink className="w-5 h-5 ml-2" />
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-5 h-5 mr-2" />
                                            Kilitli
                                        </>
                                    )}
                                </Link>
                            </Button>
                        </div>

                        {!hasLicense && (
                            <p className="text-sm text-muted-foreground/60">
                                Yayına katılmak için lisans gereklidir.
                            </p>
                        )}
                    </CardContent>
                </Card>
            ) : (
                /* EMPTY STATE */
                <div className="py-24 text-center space-y-4 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Radio className="w-10 h-10 text-muted-foreground/50" />
                    </div>
                    <h3 className="text-xl font-medium text-foreground">Şu an aktif yayın yok</h3>
                    <p className="text-muted-foreground max-w-md mx-auto px-4">
                        Eğitmen yayın başlattığında burada görünecektir.
                    </p>
                </div>
            )}
        </div>
    );
}
