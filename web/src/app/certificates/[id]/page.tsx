'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CertificateService } from '@/services/certificate-service';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, CheckCircle, AlertCircle, Calendar, User, BookOpen, ExternalLink, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useRef } from 'react';

export default function CertificateVerificationPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cert, setCert] = useState<any | null>(null);
    const certificateRef = useRef<HTMLDivElement>(null);

    const handleDownloadPdf = async () => {
        if (!certificateRef.current || downloading) return;

        try {
            setDownloading(true);
            const canvas = await html2canvas(certificateRef.current, {
                scale: 2,
                backgroundColor: '#ffffff',
                useCORS: true,
                logging: false,
                windowWidth: 1123,
                windowHeight: 794
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1123, 794]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, 1123, 794);
            pdf.save(`Certificate-${cert.credential_id}.pdf`);
        } catch (err) {
            console.error('PDF generation failed', err);
        } finally {
            setDownloading(false);
        }
    };

    useEffect(() => {
        if (!id) return;

        const fetchCert = async () => {
            try {
                setLoading(true);
                const data = await CertificateService.verifyCertificate(id);
                if (!data) {
                    setError('Certificate not found');
                } else {
                    setCert(data);
                }
            } catch (err) {
                console.error(err);
                setError('Sertifika doğrulanamadı. Kimlik no hatalı veya sertifika silinmiş olabilir.');
            } finally {
                setLoading(false);
            }
        };

        fetchCert();
    }, [id]);

    if (loading) {
        return (
            <div className="container max-w-lg mx-auto py-20 px-4">
                <Card className="glass border-white/10">
                    <CardHeader className="text-center space-y-4 pb-2">
                        <Skeleton className="w-16 h-16 rounded-full mx-auto" />
                        <Skeleton className="h-8 w-3/4 mx-auto" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-32 w-full rounded-md" />
                        <Skeleton className="h-4 w-1/2 mx-auto" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !cert) {
        return (
            <div className="container max-w-lg mx-auto py-20 px-4">
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6 text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                            <AlertCircle className="w-8 h-8 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold text-destructive">Doğrulama Başarısız</h1>
                        <p className="text-muted-foreground">{error || 'Bu kimlik numarasına ait geçerli bir sertifika bulunamadı.'}</p>
                        <Button variant="outline" onClick={() => router.push('/certificates')} className="mt-4">
                            <ArrowLeft className="mr-2 w-4 h-4" />
                            Sorgulamaya Dön
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl mx-auto py-12 px-4">
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 mb-4 ring-1 ring-green-500/30">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Sertifika Doğrulandı</h1>
                <p className="text-muted-foreground">Bu sertifikanın geçerliliği resmi olarak doğrulanmıştır.</p>
            </div>

            <Card className="glass border-white/10 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="relative h-32 bg-gradient-to-r from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                    <div className="absolute inset-0 bg-grid-white/5" />
                    <Award className="w-16 h-16 text-primary/80 relative z-10" />
                </div>

                <CardHeader className="text-center pb-2">
                    <Badge variant="secondary" className="w-fit mx-auto mb-2 font-mono text-xs">
                        ID: {cert.credential_id}
                    </Badge>
                    <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                        {cert.courses?.title}
                    </CardTitle>
                </CardHeader>

                <CardContent className="space-y-8 p-8 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <User className="w-3 h-3" /> Öğrenci
                            </span>
                            <p className="font-semibold text-lg">{cert.profiles?.full_name || 'İsimsiz Öğrenci'}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Calendar className="w-3 h-3" /> Veriliş Tarihi
                            </span>
                            <p className="font-semibold text-lg">{new Date(cert.issued_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>

                    {cert.certificate_url && (
                        <div className="rounded-lg border border-white/10 bg-black/20 p-4 flex items-center justify-between group hover:bg-black/30 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded bg-white/5">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div className="text-sm">
                                    <p className="font-medium">Orijinal Belge</p>
                                    <p className="text-muted-foreground text-xs">PDF formatında görüntüle</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </Button>
                        </div>
                    )}

                    <div className="flex justify-center pt-2">
                        <Button onClick={handleDownloadPdf} disabled={downloading} className="w-full sm:w-auto gap-2">
                            {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            {downloading ? 'Hazırlanıyor...' : 'PDF Olarak İndir'}
                        </Button>
                    </div>
                </CardContent>

                <CardFooter className="bg-white/5 p-6 flex justify-between items-center border-t border-white/5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <Award className="w-3 h-3 text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">LMS Pro Onaylı</span>
                    </div>

                    <Button variant="ghost" size="sm" asChild className="text-xs">
                        <Link href="/certificates">
                            Yeni Sorgulama
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Hidden Certificate Template for PDF Generation */}
            {cert && <CertificateVerificationPageContent cert={cert} certificateRef={certificateRef} />}
        </div>
    );
}

function CertificateVerificationPageContent({ cert, certificateRef }: { cert: any, certificateRef: any }) {
    // Hidden template for PDF generation
    // Uses fixed dimensions for A4 Landscape @ 96 DPI (approx 1123x794)
    return (
        <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
            <div
                ref={certificateRef}
                style={{
                    width: '1123px',
                    height: '794px',
                    padding: '60px',
                    background: '#ffffff',
                    color: '#1a1a1a',
                    fontFamily: 'serif',
                    position: 'relative',
                    border: '20px solid #f3f4f6',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {/* Border Pattern */}
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    right: '20px',
                    bottom: '20px',
                    border: '2px solid #e5e7eb',
                    pointerEvents: 'none'
                }} />

                <div className="text-center space-y-8 z-10 w-full max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="space-y-4">
                        <h1 style={{ fontSize: '64px', fontWeight: 'bold', color: '#111827', letterSpacing: '0.05em' }}>
                            SERTİFİKA
                        </h1>
                        <p style={{ fontSize: '24px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                            BAŞARI BELGESİ
                        </p>
                    </div>

                    {/* Content */}
                    <div className="py-12 space-y-6">
                        <p style={{ fontSize: '24px', color: '#374151' }}>
                            Sayın
                        </p>
                        <h2 style={{ fontSize: '48px', fontWeight: 'bold', color: '#000000', margin: '20px 0' }}>
                            {cert?.profiles?.full_name || 'Öğrenci'}
                        </h2>
                        <p style={{ fontSize: '24px', color: '#374151' }}>
                            Aşağıdaki eğitimi başarıyla tamamlayarak bu belgeyi almaya hak kazanmıştır:
                        </p>
                        <h3 style={{ fontSize: '36px', fontWeight: 'bold', color: '#2563eb', margin: '30px 0' }}>
                            {cert?.courses?.title || 'Eğitim'}
                        </h3>
                    </div>

                    {/* Footer */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '60px', width: '100%', padding: '0 40px' }}>
                        <div className="text-center">
                            <p style={{ fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #9ca3af', paddingTop: '10px', width: '200px' }}>
                                {new Date(cert?.issued_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Veriliş Tarihi</p>
                        </div>

                        <div className="text-center">
                            <div style={{ width: '80px', height: '80px', background: '#f3f4f6', borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Award size={40} className="text-blue-600" />
                            </div>
                            <p style={{ fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
                                ID: {cert?.credential_id}
                            </p>
                        </div>

                        <div className="text-center">
                            <p style={{ fontSize: '18px', fontWeight: 'bold', borderTop: '1px solid #9ca3af', paddingTop: '10px', width: '200px' }}>
                                LMS Pro Platform
                            </p>
                            <p style={{ fontSize: '14px', color: '#6b7280' }}>Yetkili Onayı</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
