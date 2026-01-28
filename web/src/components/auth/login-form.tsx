'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export function LoginForm() {
    const supabase = createClient();
    const router = useRouter();
    const [view, setView] = useState<'login' | 'forgotPassword'>('login');

    // Login States
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Reset Password Function
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/password-reset`,
            });

            if (error) {
                toast.error(error.message);
            } else {
                toast.success('Şifre sıfırlama bağlantısı e-posta adresine gönderildi.');
                setView('login');
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        console.log('LoginForm: Attempting login...');
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        console.log('LoginForm: Login result', { user: data.user?.id, error: error?.message });
        setLoading(false);

        if (error) toast.error(error.message);
        else {
            router.push('/dashboard');
            router.refresh();
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
                <div className="space-y-1">
                    <p className="text-gray-400 text-sm font-medium leading-relaxed">
                        {view === 'login'
                            ? "Bugün yeni bir gün. Bu senin günün. Onu sen şekillendir."
                            : "E-posta adresini gir, sana şifre sıfırlama bağlantısı gönderelim."}
                    </p>
                </div>
            </div>

            {view === 'login' ? (
                <form onSubmit={handleLogin} className="space-y-8">
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="E-posta Adresi"
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
                                placeholder="Şifre"
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
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setView('forgotPassword')}
                                className="text-sm font-semibold text-blue-500 hover:text-blue-400 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
                            >
                                Şifreni mi unuttun?
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
                        {loading ? "Doğrulanıyor..." : "Giriş Yap"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleResetPassword} className="space-y-8">
                    <div className="space-y-4">
                        <div className="relative">
                            <input
                                type="email"
                                placeholder="E-posta Adresi"
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
                    </div>

                    <div className="space-y-4">
                        <button
                            type="submit"
                            className="w-full h-14 text-white font-bold rounded-md text-lg tracking-wide shadow-lg transition-all active:scale-[0.98] border-none cursor-pointer"
                            style={{
                                background: 'linear-gradient(to right, #18181b, #27272a)',
                                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
                            }}
                            disabled={loading}
                        >
                            {loading ? "Gönderiliyor..." : "Sıfırlama Linki Gönder"}
                        </button>

                        <button
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full text-sm font-medium text-gray-400 hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
                        >
                            Giriş Yap'a Dön
                        </button>
                    </div>
                </form>
            )}

            <div className="text-center mt-8">
                <p className="text-sm font-medium text-gray-400">
                    Hesabın yok mu?{" "}
                    <button
                        type="button"
                        onClick={() => router.push('/sign-up')}
                        className="text-blue-500 hover:text-blue-400 font-bold ml-1 transition-colors bg-transparent border-none p-0 cursor-pointer outline-none"
                    >
                        Kayıt Ol
                    </button>
                </p>
            </div>
        </div>
    );
}
