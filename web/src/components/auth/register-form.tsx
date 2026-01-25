'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function RegisterForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
        });
        setLoading(false);

        if (error) {
            alert(error.message);
        } else {
            // Sync to Acumbamail (Fire and forget or await)
            try {
                await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
            } catch (err) {
                console.error('Failed to sync to newsletter', err);
            }

            alert('Check your email for the confirmation link!');
            router.push('/login');
        }
    };

    return (
        <div
            className="w-full max-w-[460px] p-10 md:p-14 rounded-md border animate-in fade-in slide-in-from-bottom-4 duration-700 shadow-2xl z-10"
            style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                backdropFilter: 'blur(32px)',
                borderColor: 'rgba(255, 255, 255, 0.08)'
            }}
        >
            {/* Header section with back button */}
            <div className="space-y-4 mb-10">
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="flex items-center text-3xl font-black tracking-tight text-white group uppercase bg-transparent border-none p-0 cursor-pointer outline-none"
                    style={{ fontStyle: 'italic' }}
                >
                    <ChevronLeft className="w-8 h-8 mr-2 -ml-2 group-hover:-translate-x-1 transition-transform stroke-[4]" />
                    JOIN US!
                </button>
                <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Start your learning journey today.
                    </p>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        Create an account to access premium courses.
                    </p>
                </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-8">
                <div className="space-y-4">
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-14 text-white placeholder:text-gray-600 rounded-md transition-all text-md px-5 border outline-none focus:ring-1 focus:ring-blue-500/50"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                            required
                        />
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-14 text-white placeholder:text-gray-600 rounded-md transition-all pr-12 text-md px-5 border outline-none focus:ring-1 focus:ring-blue-500/50"
                            style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                                borderColor: 'rgba(255, 255, 255, 0.1)'
                            }}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="w-full h-14 text-white font-bold rounded-md text-lg tracking-wide shadow-lg transition-all active:scale-[0.98] border-none cursor-pointer"
                    style={{
                        background: 'linear-gradient(to right, #18181b, #27272a)',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                    }}
                    disabled={loading}
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>
            </form>

            <div className="text-center mt-8">
                <p className="text-sm font-medium text-gray-400">
                    Already have an account?{" "}
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
}
