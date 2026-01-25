'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Award, ShieldCheck, ArrowRight } from 'lucide-react';

export default function CertificatesPage() {
    const router = useRouter();
    const [credentialId, setCredentialId] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (credentialId.trim()) {
            router.push(`/certificates/${credentialId.trim()}`);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-16 px-4">
            <div className="text-center space-y-4 mb-12">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                    Sertifika Doğrulama
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    LMS Pro üzerinden alınan sertifikaların orijinalliğini ve geçerliliğini buradan sorgulayabilirsiniz.
                </p>
            </div>

            <div className="max-w-md mx-auto mb-16 relative z-10">
                <Card className="glass border-white/10 shadow-xl ring-1 ring-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg">Sertifika ID Sorgula</CardTitle>
                        <CardDescription>Sertifika üzerindeki kimlik kodunu giriniz</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="örn: CERT-1234-XYZ"
                                    className="pl-9 bg-black/20 border-white/10 focus:border-primary/50"
                                    value={credentialId}
                                    onChange={(e) => setCredentialId(e.target.value)}
                                />
                            </div>
                            <Button type="submit" disabled={!credentialId.trim()}>
                                Sorgula
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Glow effect behind card */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-2xl -z-10 rounded-full opacity-50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Feature
                    icon={<ShieldCheck className="w-6 h-6 text-green-400" />}
                    title="Güvenli Doğrulama"
                    description="Tüm sertifikalar blokzincir benzeri kriptografik imzalar ile güvenle saklanır."
                />
                <Feature
                    icon={<Award className="w-6 h-6 text-yellow-400" />}
                    title="Resmi Başarı Belgesi"
                    description="Tamamlanan eğitimlerin resmi kanıtı olarak CV'nizde kullanabilirsiniz."
                />
                <Feature
                    icon={<Search className="w-6 h-6 text-blue-400" />}
                    title="Hızlı Sorgulama"
                    description="Sadece sertifika ID numarası ile saniyeler içinde doğrulama yapın."
                />
            </div>
        </div>
    );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-6 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 transition-colors">
            <div className="p-3 rounded-full bg-white/5 mb-4 group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-semibold text-lg mb-2">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
