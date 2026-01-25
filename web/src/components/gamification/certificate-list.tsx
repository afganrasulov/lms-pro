'use client';

import { useEffect, useState } from 'react';
import { CertificateService } from '@/services/certificate-service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';

interface CertificateListProps {
    userId: string;
}

export function CertificateList({ userId }: CertificateListProps) {
    const [certs, setCerts] = useState<any[]>([]);

    useEffect(() => {
        CertificateService.getMyCertificates(userId).then(setCerts);
    }, [userId]);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Award className="text-yellow-500" />
                Sertifikalarım
            </h2>

            {certs.length === 0 ? (
                <div className="p-8 border border-dashed rounded-lg text-center text-muted-foreground">
                    Henüz sertifika kazanılmadı. Bir kurs tamamlayarak kazan!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certs.map(cert => (
                        <Card key={cert.id} className="group hover:border-primary transition-colors">
                            <CardContent className="p-6 flex items-start gap-4">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold">{cert.courses?.title || 'Bilinmeyen Kurs'}</h3>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Veriliş tarihi: {new Date(cert.issued_at).toLocaleDateString()}
                                    </p>
                                    <div className="text-xs font-mono text-muted-foreground bg-muted p-1 rounded inline-block mb-3">
                                        ID: {cert.credential_id}
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                                        <a href={`/certificates/${cert.credential_id}`} target="_blank" rel="noopener noreferrer">
                                            Sertifikayı Görüntüle <ExternalLink size={14} />
                                        </a>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
