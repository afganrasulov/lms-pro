import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradient(id: string | number) {
  const gradients = [
    "from-rose-500 to-indigo-700",
    "from-blue-600 to-cyan-500",
    "from-fuchsia-600 to-purple-600",
    "from-emerald-500 to-teal-700",
    "from-orange-500 to-red-600",
    "from-violet-600 to-indigo-600",
    "from-yellow-400 to-orange-500",
    "from-slate-900 to-slate-700",
  ];

  let hash = 0;
  const str = String(id);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}
