'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface XPPopupProps {
    amount: number;
    reason: string;
    isVisible: boolean;
    onClose: () => void;
}

export function XPPopup({ amount, reason, isVisible, onClose }: XPPopupProps) {
    useEffect(() => {
        if (isVisible) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isVisible, onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed top-24 right-8 z-50 animate-bounce">
            <div className="bg-yellow-500 text-yellow-950 px-6 py-3 rounded-md font-bold shadow-lg flex items-center gap-2 border-4 border-yellow-300">
                <Sparkles className="w-5 h-5" />
                <span>+{amount} XP</span>
                <span className="text-xs opacity-75 font-normal ml-1">({reason})</span>
            </div>
        </div>
    );
}
