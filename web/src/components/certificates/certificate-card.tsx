import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Certificate } from '@/types/index';

interface CertificateCardProps {
    certificate: Certificate & {
        courseString?: string;
        courses?: { title: string } | null;
    };
}

export function CertificateCard({ certificate }: CertificateCardProps) {
    return (
        <Card className="group hover:border-primary transition-colors h-full">
            <CardContent className="p-6 flex items-start gap-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-md">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                    <h3 className="font-bold line-clamp-1" title={certificate.courses?.title || certificate.courseString}>
                        {certificate.courses?.title || certificate.courseString || 'Bilinmeyen Kurs'}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-2">
                        Veriliş: {new Date(certificate.issued_at).toLocaleDateString()}
                    </p>
                    <div className="text-xs font-mono text-muted-foreground bg-muted p-1 rounded inline-block mb-3">
                        ID: {certificate.credential_id}
                    </div>
                    <Button variant="outline" size="sm" className="w-full gap-2" asChild>
                        <Link href={`/certificates/${certificate.credential_id}`} target="_blank" rel="noopener noreferrer">
                            Sertifikayı Görüntüle <ExternalLink size={14} />
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
