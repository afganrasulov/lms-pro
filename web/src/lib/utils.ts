import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getGradient(str: string) {
    const gradients = [
        "from-violet-600 to-indigo-600",
        "from-blue-600 to-cyan-600",
        "from-pink-600 to-rose-600",
        "from-emerald-600 to-teal-600",
        "from-orange-600 to-amber-600"
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return gradients[Math.abs(hash) % gradients.length];
}

export function getInitials(name: string) {
    return name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

