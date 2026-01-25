'use client';

import { RegisterForm } from '@/components/auth/register-form';

export default function SignUpPage() {
    return (
        <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#000000]">
            {/* Top Left Logo */}
            <div className="absolute top-10 left-10">
                <span className="text-3xl font-black tracking-tighter text-white">IPSUM</span>
            </div>

            {/* Premium Spotlight Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.03)_0%,transparent_50%)]" />
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.02)_0%,transparent_40%)]" />
            </div>

            {/* Decorative Blur */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-md blur-[120px] pointer-events-none" />

            <RegisterForm />
        </main>
    );
}
