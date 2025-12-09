/**
 * iAsted Optimizer Stats Component
 * Affiche les statistiques d'optimisation et économies réalisées
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    getOptimizationStats,
    getUserQuota,
    type UserTier
} from '@/utils/iasted-optimizer';
import { Zap, TrendingDown, Database, Cpu, Clock } from 'lucide-react';

interface IAstedOptimizerStatsProps {
    userTier?: UserTier;
    compact?: boolean;
}

export function IAstedOptimizerStats({ userTier = 'citizen', compact = false }: IAstedOptimizerStatsProps) {
    const [stats, setStats] = useState(getOptimizationStats());
    const [quota, setQuota] = useState(getUserQuota(userTier));

    useEffect(() => {
        // Refresh stats every 5 seconds
        const interval = setInterval(() => {
            setStats(getOptimizationStats());
            setQuota(getUserQuota(userTier));
        }, 5000);

        return () => clearInterval(interval);
    }, [userTier]);

    const cacheRate = stats.totalRequests > 0
        ? Math.round((stats.cachedRequests / stats.totalRequests) * 100)
        : 0;

    const miniRate = stats.totalRequests > 0
        ? Math.round((stats.miniRequests / stats.totalRequests) * 100)
        : 0;

    const quotaUsedPercent = quota.dailyLimit === Infinity
        ? 0
        : Math.round((quota.used / quota.dailyLimit) * 100);

    if (compact) {
        return (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1">
                    <Zap className="w-3 h-3" />
                    {(stats.estimatedSavings ?? 0).toFixed(1)}¢ économisés
                </Badge>
                <Badge variant="outline" className="gap-1">
                    <Database className="w-3 h-3" />
                    {cacheRate}% cache
                </Badge>
                {quota.dailyLimit !== Infinity && (
                    <Badge variant={quota.remaining < 5 ? 'destructive' : 'outline'} className="gap-1">
                        <Clock className="w-3 h-3" />
                        {quota.remaining}/{quota.dailyLimit}
                    </Badge>
                )}
            </div>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-green-500" />
                    Optimisation iAsted
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Économies totales */}
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Économies réalisées</span>
                    <Badge className="bg-green-500 text-white">
                        {(stats.estimatedSavings ?? 0).toFixed(2)}¢ économisés
                    </Badge>
                </div>

                {/* Répartition des requêtes */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-blue-500" />
                            Cache local
                        </span>
                        <span className="font-medium">{stats.cachedRequests} ({cacheRate}%)</span>
                    </div>
                    <Progress value={cacheRate} className="h-2" />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                            <Cpu className="w-3 h-3 text-orange-500" />
                            GPT-4o-mini
                        </span>
                        <span className="font-medium">{stats.miniRequests} ({miniRate}%)</span>
                    </div>
                    <Progress value={miniRate} className="h-2 [&>div]:bg-orange-500" />
                </div>

                <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-purple-500" />
                        GPT-4o (complexe)
                    </span>
                    <span className="font-medium">{stats.fullRequests}</span>
                </div>

                {/* Quota utilisateur */}
                {quota.dailyLimit !== Infinity && (
                    <div className="pt-2 border-t space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Quota journalier</span>
                            <span className={quota.remaining < 5 ? 'text-red-500 font-bold' : ''}>
                                {quota.remaining} / {quota.dailyLimit} restantes
                            </span>
                        </div>
                        <Progress
                            value={quotaUsedPercent}
                            className={`h-2 ${quotaUsedPercent > 80 ? '[&>div]:bg-red-500' : ''}`}
                        />
                    </div>
                )}

                {/* Total */}
                <div className="pt-2 border-t text-center">
                    <span className="text-xs text-muted-foreground">
                        {stats.totalRequests} requêtes totales
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export default IAstedOptimizerStats;
