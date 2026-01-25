'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Shield, Heart } from 'lucide-react';

export function GemStore() {
    const items = [
        {
            id: 'streak-freeze',
            icon: <Shield className="w-8 h-8 text-blue-400" />,
            title: 'Seri Dondurma',
            desc: 'Serini kaybetmeden bir gün kaçır.',
            price: 200,
        },
        {
            id: 'double-xp',
            icon: <Zap className="w-8 h-8 text-yellow-400" />,
            title: 'Çifte XP İksiri',
            desc: 'Sonraki 30 dakika boyunca 2x XP kazan.',
            price: 150,
        },
        {
            id: 'health-refill',
            icon: <Heart className="w-8 h-8 text-red-500" />,
            title: 'Can Yenileme',
            desc: 'Quizler için canını tamamen doldur.',
            price: 100,
        }
    ];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    💎 Elmas Mağazası
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {items.map(item => (
                        <div key={item.id} className="border rounded-lg p-4 flex flex-col items-center text-center hover:bg-muted/50 transition-colors">
                            <div className="mb-3 p-3 bg-background rounded-md shadow-sm">
                                {item.icon}
                            </div>
                            <h3 className="font-bold">{item.title}</h3>
                            <p className="text-xs text-muted-foreground mb-4 min-h-[2.5rem]">{item.desc}</p>
                            <Button variant="secondary" className="w-full font-bold">
                                💎 {item.price}
                            </Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
