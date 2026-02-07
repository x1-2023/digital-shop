'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Fallback mock data khi API fail hoặc chưa có data
const FALLBACK_SPENDERS = [
    { id: '1', name: 'Ena***', totalSpent: 15200000, avatarUrl: null, rank: 1 },
    { id: '2', name: 'Air***', totalSpent: 8500000, avatarUrl: null, rank: 2 },
    { id: '3', name: 'liq***', totalSpent: 5200000, avatarUrl: null, rank: 3 },
];

interface TopSpender {
    id: string;
    name: string;
    totalSpent: number;
    avatarUrl: string | null;
    rank: number;
}

export function TopSellers() {
    const [spenders, setSpenders] = useState<TopSpender[]>(FALLBACK_SPENDERS);

    useEffect(() => {
        const fetchTopSellers = async () => {
            try {
                const res = await fetch('/api/top-sellers');
                if (res.ok) {
                    const data = await res.json();
                    if (data.spenders && data.spenders.length > 0) {
                        setSpenders(data.spenders);
                    }
                    // If empty spenders, keep fallback
                }
            } catch (error) {
                console.error('Error fetching top sellers:', error);
                // Keep fallback data on error
            }
        };

        fetchTopSellers();
    }, []);

    // Get current month name
    const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
        'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
    const currentMonth = monthNames[new Date().getMonth()];

    return (
        <Card className="border-2 border-purple-400/20 shadow-lg bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-900/10">
            <CardHeader className="pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-purple-500" />
                    <CardTitle className="text-base font-bold">TOP CHI TIÊU</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                    {currentMonth}
                </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
                {spenders.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center gap-3 group cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 p-2 rounded-lg transition-colors">
                        {/* Rank Badge */}
                        <div className={`
              w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm
              ${user.rank === 1 ? 'bg-yellow-500 ring-2 ring-yellow-200 dark:ring-yellow-900' :
                                user.rank === 2 ? 'bg-gray-400' :
                                    user.rank === 3 ? 'bg-orange-400' : 'bg-slate-200 text-slate-600'}
            `}>
                            {user.rank}
                        </div>

                        <Avatar className="h-9 w-9 border border-border">
                            <AvatarImage src={user.avatarUrl || ''} />
                            <AvatarFallback className="bg-purple-500/10 text-purple-600 font-bold text-xs">
                                {user.name[0]}
                            </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate group-hover:text-purple-600 transition-colors">
                                {user.name}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wallet className="w-3 h-3 text-green-500" />
                                <span className="text-green-600 font-medium">
                                    {formatCurrency(user.totalSpent)}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
