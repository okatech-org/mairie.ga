import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { TrendingUp, Users, FileText, Clock, CheckCircle2, AlertTriangle, Calendar, Building2, Stamp, Scale, BarChart3 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useDemo } from "@/contexts/DemoContext";
import { MunicipalRole } from "@/types/municipal-roles";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Donnée évolution demandes sur 6 mois
const DATA_DEMANDES = [
    { name: 'Juil', deposees: 120, traitees: 95, enAttente: 25 },
    { name: 'Août', deposees: 98, traitees: 88, enAttente: 35 },
    { name: 'Sept', deposees: 145, traitees: 130, enAttente: 50 },
    { name: 'Oct', deposees: 180, traitees: 165, enAttente: 65 },
    { name: 'Nov', deposees: 210, traitees: 195, enAttente: 80 },
    { name: 'Déc', deposees: 234, traitees: 187, enAttente: 47 },
];

// Répartition par service
const DATA_SERVICES = [
    { name: 'État Civil', value: 45, color: '#3b82f6' },
    { name: 'Urbanisme', value: 25, color: '#10b981' },
    { name: 'Fiscalité', value: 18, color: '#f59e0b' },
    { name: 'Légalisation', value: 12, color: '#8b5cf6' },
];

// Performance agents
const DATA_AGENTS = [
    { name: 'Officier EC 1', traites: 78, objectif: 80 },
    { name: 'Officier EC 2', traites: 65, objectif: 80 },
    { name: 'Agent Urba', traites: 45, objectif: 50 },
    { name: 'Agent Fiscal', traites: 38, objectif: 40 },
    { name: 'Agent Municipal', traites: 52, objectif: 60 },
];

// Délais moyens par type
const DATA_DELAIS = [
    { name: 'Acte naissance', delai: 2, cible: 3 },
    { name: 'Acte mariage', delai: 5, cible: 7 },
    { name: 'Légalisation', delai: 1, cible: 2 },
    { name: 'Permis construire', delai: 15, cible: 21 },
    { name: 'Certificat residence', delai: 3, cible: 5 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function MaireAnalyticsPage() {
    const [period, setPeriod] = useState("6m");
    const { currentUser } = useDemo();
    const navigate = useNavigate();

    // Protection: Access for MAIRE and MAIRE_ADJOINT only
    const hasAccess = currentUser?.role === MunicipalRole.MAIRE || currentUser?.role === MunicipalRole.MAIRE_ADJOINT;

    if (!hasAccess) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Alert className="max-w-md border-destructive">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <AlertTitle>Accès Refusé</AlertTitle>
                    <AlertDescription>
                        Cette section est réservée au Maire et aux Maires Adjoints.
                        <div className="mt-4">
                            <Button onClick={() => navigate("/")} variant="outline">
                                Retour à l'accueil
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Get mairie name from entity or user
    const mairieName = currentUser?.name?.includes('(')
        ? currentUser.name.match(/\(([^)]+)\)/)?.[1] || 'Mairie'
        : 'Libreville';

    return (
        <div className="space-y-8 pb-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Indicateurs de Performance</h1>
                    <p className="text-muted-foreground">
                        Mairie de {mairieName} — Vue analytique
                    </p>
                </div>
                <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger className="w-[180px] neu-raised">
                        <SelectValue placeholder="Période" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="6m">6 derniers mois</SelectItem>
                        <SelectItem value="1y">Cette année</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="neu-raised p-5 rounded-2xl border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Demandes Totales</p>
                            <h3 className="text-2xl font-bold mt-2">987</h3>
                        </div>
                        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                            <FileText className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-green-600 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        +15% vs mois dernier
                    </div>
                </div>

                <div className="neu-raised p-5 rounded-2xl border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Taux Traitement</p>
                            <h3 className="text-2xl font-bold mt-2">94.2%</h3>
                        </div>
                        <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-green-600 font-medium">
                        <TrendingUp className="w-3 h-3" />
                        +3.5% d'efficacité
                    </div>
                </div>

                <div className="neu-raised p-5 rounded-2xl border-l-4 border-l-orange-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Délai Moyen</p>
                            <h3 className="text-2xl font-bold mt-2">3.2j</h3>
                        </div>
                        <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-green-600 font-medium">
                        <TrendingUp className="w-3 h-3 rotate-180" />
                        -0.5j vs objectif
                    </div>
                </div>

                <div className="neu-raised p-5 rounded-2xl border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase">Agents Actifs</p>
                            <h3 className="text-2xl font-bold mt-2">12</h3>
                        </div>
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground font-medium">
                        Effectif complet
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Evolution Demandes */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Évolution des Demandes
                        </CardTitle>
                        <CardDescription>Demandes déposées vs traitées sur 6 mois</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={DATA_DEMANDES} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorDeposees" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorTraitees" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="deposees" stroke="#3b82f6" fillOpacity={1} fill="url(#colorDeposees)" name="Déposées" />
                                    <Area type="monotone" dataKey="traitees" stroke="#10b981" fillOpacity={1} fill="url(#colorTraitees)" name="Traitées" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Répartition par Service */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Répartition par Service
                        </CardTitle>
                        <CardDescription>Volume de demandes par département</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={DATA_SERVICES}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                        labelLine={false}
                                    >
                                        {DATA_SERVICES.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Performance Agents */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Performance des Agents
                        </CardTitle>
                        <CardDescription>Dossiers traités vs objectifs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={DATA_AGENTS} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                    <XAxis type="number" tick={{ fontSize: 12 }} />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="traites" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Traités" />
                                    <Bar dataKey="objectif" fill="#e5e7eb" radius={[0, 4, 4, 0]} name="Objectif" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Délais de Traitement */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Délais de Traitement
                        </CardTitle>
                        <CardDescription>Délai réel vs objectif (en jours)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={DATA_DELAIS} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={60} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="delai" fill="#10b981" radius={[4, 4, 0, 0]} name="Délai réel" />
                                    <Bar dataKey="cible" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="Cible" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats */}
            <div className="neu-inset p-6 rounded-2xl">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Scale className="w-5 h-5 text-primary" />
                    Récapitulatif Mensuel
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 rounded-xl bg-background">
                        <p className="text-3xl font-bold text-blue-600">234</p>
                        <p className="text-sm text-muted-foreground">Actes émis</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-background">
                        <p className="text-3xl font-bold text-green-600">156</p>
                        <p className="text-sm text-muted-foreground">Légalisations</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-background">
                        <p className="text-3xl font-bold text-orange-600">45</p>
                        <p className="text-sm text-muted-foreground">Permis délivrés</p>
                    </div>
                    <div className="text-center p-4 rounded-xl bg-background">
                        <p className="text-3xl font-bold text-purple-600">892</p>
                        <p className="text-sm text-muted-foreground">RDV honorés</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
