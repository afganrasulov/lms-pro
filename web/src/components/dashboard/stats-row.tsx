import { Flame, Diamond, Zap, LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface UserStats {
    streak: number;
    gems: number;
    xp: number;
    level?: number;
    isStreakActive?: boolean;
}

interface StatsRowProps {
    stats: UserStats | null;
}

export function StatsRow({ stats }: StatsRowProps) {
    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
                icon={Flame}
                label="Day Streak"
                value={stats.streak.toString()}
                iconColor="text-orange-500"
                subtext={stats.isStreakActive ? "Active" : "Inactive"}
            />
            <StatCard
                icon={Diamond}
                label="Total Gems"
                value={stats.gems.toString()}
                iconColor="text-blue-400"
            />
            <StatCard
                icon={Zap}
                label="Lifetime XP"
                value={stats.xp.toLocaleString()}
                iconColor="text-yellow-400"
                subtext={`Level ${stats.level || 1}`}
            />
        </div>
    );
}

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    iconColor?: string;
    subtext?: string;
}

function StatCard({ icon: Icon, label, value, iconColor, subtext }: StatCardProps) {
    return (
        <Card variant="glass" className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors border border-white/5">
            <div className={cn("p-2 rounded-md bg-white/5 backdrop-blur-sm", iconColor)}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold">{value}</p>
                    {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
                </div>
            </div>
        </Card>
    );
}
