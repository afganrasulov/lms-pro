import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Video, Calendar, ArrowRight, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata = {
    title: 'Canlı Yayınlar | LMS Pro',
    description: 'Yaklaşan ve aktif canlı dersler.'
};

export default async function LiveClassesPage() {
    const supabase = await createClient();

    // 1. Get User License Status
    const { data: { user } } = await supabase.auth.getUser();
    let hasLicense = false;

    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('license_status')
            .eq('id', user.id)
            .single();
        hasLicense = profile?.license_status === 'active';
    }

    // 2. Fetch Live Classes
    // We strictly filter for type 'live_class'. 
    // We join with modules and courses to get context.
    const { data: liveLessons } = await supabase
        .from('lessons')
        .select(`
            id,
            title,
            slug,
            description,
            created_at,
            modules (
                id,
                title,
                courses (
                    id,
                    title,
                    slug
                )
            )
        `)
        .eq('type', 'live_class')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    <Video className="w-8 h-8 text-red-500" />
                    Canlı Yayınlar
                </h1>
                <p className="text-muted-foreground">
                    Katılabileceğiniz aktif ve planlanmış canlı dersler.
                </p>
            </header>

            {!hasLicense && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg flex items-start gap-3">
                    <Lock className="w-5 h-5 text-yellow-500 mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-yellow-500">Lisans Anahtarı Gerekli</h3>
                        <p className="text-sm text-yellow-500/80 mt-1">
                            Canlı yayınlara katılabilmek için Polar lisans anahtarınızı <Link href="/settings" className="underline hover:text-yellow-400">ayarlar sayfasından</Link> giriniz.
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {liveLessons?.map((lesson: any) => {
                    const course = lesson.modules?.courses;
                    const courseSlug = course?.slug;
                    const href = `/courses/${courseSlug}/learn?lesson=${lesson.slug}`;

                    return (
                        <Card key={lesson.id} className="bg-card/50 backdrop-blur border-white/10 hover:border-primary/50 transition-colors group">
                            <CardHeader>
                                <div className="flex justify-between items-start mb-2">
                                    <Badge variant="destructive" className="animate-pulse">CANLI</Badge>
                                    <Badge variant="outline" className="text-xs bg-background/50">
                                        {course?.title || 'Genel'}
                                    </Badge>
                                </div>
                                <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                                    {lesson.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-2">
                                    {lesson.description || "Bu ders için açıklama girilmemiş."}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                                        <Calendar className="w-4 h-4" />
                                        <span>Her Zaman Erişilebilir</span>
                                    </div>

                                    <Button asChild className="w-full" disabled={!hasLicense}>
                                        <Link href={hasLicense ? href : '/settings'}>
                                            {hasLicense ? (
                                                <>
                                                    Yayına Git <ArrowRight className="w-4 h-4 ml-2" />
                                                </>
                                            ) : (
                                                <>
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Lisans Gerekli
                                                </>
                                            )}
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}

                {(!liveLessons || liveLessons.length === 0) && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-card/30 rounded-lg border border-dashed border-white/10">
                        <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">Şu an aktif canlı yayın yok</h3>
                        <p className="text-sm mt-1">Daha sonra tekrar kontrol edin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
