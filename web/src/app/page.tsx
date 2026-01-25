'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';

export default function HomeGate() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return <div className="min-h-screen bg-black" />;
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden dark">
      {/* Premium Spotlight Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.02)_0%,transparent_40%)]" />
      </div>

      {/* Top Header Section */}
      <div className="absolute top-10 left-10 z-10">
        <span className="text-3xl font-black tracking-tighter text-white">IPSUM</span>
      </div>

      {/* Content Layer */}
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  );
}
