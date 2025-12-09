import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    PieChart,
    Download,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RechartsPie,
    Pie,
    Cell
} from 'recharts';

const MONTHLY_DATA = [
    { month: 'Jan', recettes: 45000000, depenses: 38000000 },
    { month: 'Fév', recettes: 52000000, depenses: 42000000 },
    { month: 'Mar', recettes: 48000000, depenses: 45000000 },
    { month: 'Avr', recettes: 61000000, depenses: 52000000 },
    { month: 'Mai', recettes: 55000000, depenses: 48000000 },
    { month: 'Juin', recettes: 67000000, depenses: 55000000 },
    { month: 'Juil', recettes: 72000000, depenses: 58000000 },
    { month: 'Août', recettes: 63000000, depenses: 54000000 },
    { month: 'Sep', recettes: 58000000, depenses: 51000000 },
    { month: 'Oct', recettes: 69000000, depenses: 57000000 },
    { month: 'Nov', recettes: 71000000, depenses: 62000000 },
    { month: 'Déc', recettes: 75000000, depenses: 65000000 }
];

const EXPENSE_BREAKDOWN = [
    { name: 'Personnel', value: 35, color: '#3b82f6' },
    { name: 'Investissements', value: 25, color: '#10b981' },
    { name: 'Fonctionnement', value: 20, color: '#f59e0b' },
    { name: 'Transferts', value: 12, color: '#8b5cf6' },
    { name: 'Autres', value: 8, color: '#6b7280' }
];

const BUDGET_ITEMS = [
    { category: 'Voirie & Infrastructure', allocated: 180000000, spent: 145000000, status: 'normal' },
    { category: 'Éducation', allocated: 120000000, spent: 98000000, status: 'normal' },
    { category: 'Santé & Social', allocated: 85000000, spent: 72000000, status: 'normal' },
    { category: 'Culture & Sport', allocated: 45000000, spent: 48000000, status: 'warning' },
    { category: 'Environnement', allocated: 35000000, spent: 22000000, status: 'good' },
    { category: 'Administration', allocated: 65000000, spent: 61000000, status: 'normal' }
];

const formatCurrency = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M FCFA`;
    }
    return `${(value / 1000).toFixed(0)}K FCFA`;
};

export default function MaireBudgetPage() {
    const [year, setYear] = useState('2024');

    const totalRecettes = MONTHLY_DATA.reduce((sum, m) => sum + m.recettes, 0);
    const totalDepenses = MONTHLY_DATA.reduce((sum, m) => sum + m.depenses, 0);
    const balance = totalRecettes - totalDepenses;
    const executionRate = Math.round((totalDepenses / totalRecettes) * 100);

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Budget Municipal
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Suivi de l'exécution budgétaire {year}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {year}
                    </Button>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" />
                        Exporter
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Recettes</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRecettes)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                            <ArrowUpRight className="h-3 w-3" />
                            +12% vs N-1
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Dépenses</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalDepenses)}</p>
                            </div>
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <TrendingDown className="h-6 w-6 text-red-500" />
                            </div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
                            <ArrowDownRight className="h-3 w-3" />
                            +8% vs N-1
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Solde</p>
                                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(balance)}
                                </p>
                            </div>
                            <div className="p-3 rounded-xl bg-primary/10">
                                <DollarSign className="h-6 w-6 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Taux d'exécution</p>
                                <p className="text-2xl font-bold">{executionRate}%</p>
                            </div>
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <PieChart className="h-6 w-6 text-blue-500" />
                            </div>
                        </div>
                        <Progress value={executionRate} className="mt-2" />
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Area Chart */}
                <Card className="neu-card border-none lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Évolution Mensuelle</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={MONTHLY_DATA}>
                                    <defs>
                                        <linearGradient id="recettesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="depensesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Area type="monotone" dataKey="recettes" stroke="#10b981" strokeWidth={2} fill="url(#recettesGradient)" name="Recettes" />
                                    <Area type="monotone" dataKey="depenses" stroke="#ef4444" strokeWidth={2} fill="url(#depensesGradient)" name="Dépenses" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Pie Chart */}
                <Card className="neu-card border-none">
                    <CardHeader>
                        <CardTitle className="text-lg">Répartition Dépenses</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <RechartsPie>
                                    <Pie
                                        data={EXPENSE_BREAKDOWN}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {EXPENSE_BREAKDOWN.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: number) => `${value}%`} />
                                </RechartsPie>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-2 mt-4">
                            {EXPENSE_BREAKDOWN.map((item) => (
                                <div key={item.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span>{item.name}</span>
                                    </div>
                                    <span className="font-medium">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Lines */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Exécution par Poste</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {BUDGET_ITEMS.map((item) => {
                            const percentage = Math.round((item.spent / item.allocated) * 100);
                            const isOverBudget = percentage > 100;

                            return (
                                <div key={item.category} className="p-4 rounded-lg border bg-card/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-medium">{item.category}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={isOverBudget ? 'destructive' : 'secondary'}>
                                                {percentage}%
                                            </Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {formatCurrency(item.spent)} / {formatCurrency(item.allocated)}
                                            </span>
                                        </div>
                                    </div>
                                    <Progress
                                        value={Math.min(percentage, 100)}
                                        className={isOverBudget ? '[&>div]:bg-red-500' : ''}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
