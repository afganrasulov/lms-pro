'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CertificateList } from '@/components/gamification/certificate-list';
import { DevLogin } from '@/components/dev-login';
import { GemStore } from '@/components/gamification/gem-store';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GamificationPage() {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data.user));
    }, []);

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-3xl font-bold">Gamification Hub</h1>
                <p className="text-muted-foreground">Spend gems and view your achievements.</p>
            </header>

            {/* 1. Gem Store Section */}
            <section>
                <GemStore />
            </section>

            {/* 2. Certificates Section */}
            <section>
                {user ? (
                    <CertificateList userId={user.id} />
                ) : (
                    <div className="p-4 bg-muted text-center rounded">Login to view certificates.</div>
                )}
            </section>

            <DevLogin />
        </div>
    );
}
