'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@supabase/supabase-js';

// Client-side supabase for dev login
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function DevLogin() {
    const [email, setEmail] = useState('test@student.com');
    const [password, setPassword] = useState('password123');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        setLoading(false);

        if (error) alert(error.message);
        else window.location.reload();
    };

    return (
        <div className="fixed bottom-4 right-4 p-4 border rounded-lg bg-background shadow-lg max-w-sm z-50 opacity-90 hover:opacity-100 transition-opacity">
            <h3 className="font-bold mb-2 text-xs uppercase text-muted-foreground">Dev Login</h3>
            <div className="space-y-2">
                <Input
                    size={30} // Type issue workaround
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="h-8 text-xs"
                />
                <Input
                    type="password"
                    size={30}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="h-8 text-xs"
                />
                <Button size="sm" onClick={handleLogin} disabled={loading} className="w-full h-8 text-xs">
                    {loading ? '...' : 'Sign In (Dev)'}
                </Button>
            </div>
        </div>
    );
}
