import { Card } from '@/components/ui/card';
import { Flame, Diamond, Zap } from 'lucide-react';
import { ProfileWithStats } from '@/services/profile-service';

interface ProfileStatsProps {
    profile: ProfileWithStats | null;
}

export function ProfileStats({ profile }: ProfileStatsProps) {
    const streak = profile?.user_streaks?.[0]?.current_streak || 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card variant="glass" className="border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-white/5 transition-colors">
                <div className="p-3 rounded-md bg-orange-500/10 text-orange-500">
                    <Flame className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold">{streak}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Day Streak</div>
            </Card>

            <Card variant="glass" className="border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-white/5 transition-colors">
                <div className="p-3 rounded-md bg-blue-400/10 text-blue-400">
                    <Diamond className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold">{profile?.gems?.toLocaleString() ?? 0}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Gems</div>
            </Card>

            <Card variant="glass" className="border-white/5 p-6 flex flex-col items-center justify-center text-center space-y-2 hover:bg-white/5 transition-colors">
                <div className="p-3 rounded-md bg-yellow-400/10 text-yellow-400">
                    <Zap className="w-6 h-6" />
                </div>
                <div className="text-3xl font-bold">{profile?.xp_points?.toLocaleString() ?? 0}</div>
                <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Lifetime XP</div>
            </Card>
        </div>
    );
}
