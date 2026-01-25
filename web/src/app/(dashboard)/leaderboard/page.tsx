import { GamificationService } from '@/services/gamification-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    const leaderboard = await GamificationService.getLeaderboard(50);

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold tracking-tight">Liderlik Tablosu</h1>
                <p className="text-muted-foreground">Haftanın en çok öğrenenleri. XP için yarışın!</p>
            </header>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Haftalık Sıralama
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                        {leaderboard?.map((user, index) => {
                            const rank = index + 1;
                            let RankIcon = null;
                            let rankColor = "text-muted-foreground";

                            if (rank === 1) {
                                RankIcon = Crown;
                                rankColor = "text-yellow-500";
                            } else if (rank === 2) {
                                RankIcon = Medal;
                                rankColor = "text-gray-400";
                            } else if (rank === 3) {
                                RankIcon = Medal;
                                rankColor = "text-amber-700";
                            }

                            return (
                                <div key={user.user_id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                    <div className={`flex h-8 w-8 items-center justify-center font-bold ${rankColor}`}>
                                        {RankIcon ? <RankIcon className="h-6 w-6" /> : <span>#{rank}</span>}
                                    </div>

                                    <Avatar className="h-10 w-10 border border-border">
                                        <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
                                        <AvatarFallback>{user.full_name?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">{user.full_name || 'İsimsiz Kullanıcı'}</p>
                                    </div>

                                    <div className="text-right">
                                        <Badge variant="secondary" className="font-mono">
                                            {user.weekly_xp?.toLocaleString()} XP
                                        </Badge>
                                    </div>
                                </div>
                            );
                        })}

                        {(!leaderboard || leaderboard.length === 0) && (
                            <div className="p-8 text-center text-muted-foreground">
                                Bu hafta henüz aktivite kaydedilmedi. İlk sen ol!
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
