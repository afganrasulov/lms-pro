import { createClient } from '@/lib/supabase/server';
import { CertificateService } from '@/services/certificate-service';
import { CertificateCard } from '@/components/certificates/certificate-card';

export async function DashboardCertificates({ userId }: { userId: string }) {
    const supabase = await createClient();

    // Direct fetch is often safer for Server Components if Service isn't updated
    const { data: certificates } = await supabase
        .from('certificates')
        .select('*, courses(title)')
        .eq('user_id', userId)
        .order('issued_at', { ascending: false });

    if (!certificates || certificates.length === 0) {
        return (
            <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p className="text-gray-400">Henüz sertifikan bulunmuyor.</p>
                <p className="text-xs text-gray-500 mt-1">Kursları tamamlayarak sertifika kazanabilirsin.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert: any) => (
                <CertificateCard
                    key={cert.id}
                    certificate={{
                        ...cert,
                        courseString: cert.courses?.title // Adapter for UI if needed
                    }}
                />
            ))}
        </div>
    );
}
