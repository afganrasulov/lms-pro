'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { WeeklyLeaderboard as WeeklyLeaderboardType } from '@/types/index';
// import { useAuth } from '@/components/providers/auth-provider';

interface WeeklyLeaderboardProps {
    initialData: WeeklyLeaderboardType[];
    currentUserId?: string;
}

export function WeeklyLeaderboard({ initialData, currentUserId }: WeeklyLeaderboardProps) {
    const router = useRouter();


    // In a real app, we might want to subscribe to realtime updates here too,
    // or just rely on the server component revalidating.
    // For now, display the initial data passed from server.

    return (
        <Card variant="glass" className="border-none shadow-sm h-fit">
            <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg font-medium flex items-center gap-2 italic">
                    🏆 Haftalık Liderler
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
                <div className="space-y-1">
                    {initialData.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Lig yakında başlıyor...</p>
                    ) : (
                        initialData.map((entry, index) => (
                            <div
                                key={entry.user_id}
                                className={`flex items-center justify-between p-2 rounded-md transition-colors text-sm ${(entry.user_id === currentUserId)
                                        ? 'bg-primary/20 border border-primary/30'
                                        : 'hover:bg-secondary/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${index === 0 ? 'text-yellow-500' :
                                            index === 1 ? 'text-gray-400' :
                                                index === 2 ? 'text-orange-500' : 'text-muted-foreground'
                                        }`}>
                                        #{entry.rank || index + 1}
                                    </span>

                                    <Avatar className="h-6 w-6 border border-white/10">
                                        <AvatarImage src={entry.avatar_url || undefined} />
                                        <AvatarFallback className="text-[10px]">
                                            {(entry.full_name || 'U').substring(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>

                                    <span className={`font-medium ${(entry.user_id === currentUserId) ? 'text-primary' : 'text-foreground'
                                        }`}>
                                        {entry.full_name || 'İsimsiz'}
                                    </span>
                                </div>
                                <span className="font-mono text-xs text-primary font-bold">
                                    {entry.weekly_xp || 0} XP
                                </span>
                            </div>
                        ))
                    )}
                </div>
                <div className="mt-4 pt-4 border-t text-center">
                    <Button
                        onClick={() => router.push('/leaderboard')}
                        variant="link"
                        size="sm"
                        className="w-full text-muted-foreground"
                    >
                        Tüm Sıralamayı Gör
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
