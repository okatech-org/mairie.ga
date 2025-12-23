import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users, FileText, Calendar, Building2, CheckCircle2, Clock, BarChart3, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MunicipalRole } from "@/types/municipal-roles";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionReminder } from "@/components/dashboard/FunctionReminder";

interface DashboardStats {
    pendingRequests: number;
    processedThisMonth: number;
    activeAgents: number;
    appointmentsToday: number;
    serviceStats: {
        name: string;
        pending: number;
        processed: number;
        color: string;
    }[];
    recentActivity: {
        action: string;
        user: string;
        time: string;
        type: 'success' | 'warning' | 'info';
    }[];
}

export default function MaireDashboard() {
    const { currentUser } = useDemo();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Protection: Access for MAIRE and MAIRE_ADJOINT only
    const hasAccess = currentUser?.role === MunicipalRole.MAIRE || currentUser?.role === MunicipalRole.MAIRE_ADJOINT;

    useEffect(() => {
        if (hasAccess) {
            loadDashboardStats();
        }
    }, [hasAccess]);

    async function loadDashboardStats() {
        try {
            setLoading(true);
            setError(null);

            // Fetch request statistics
            const { data: requests, error: reqError } = await supabase
                .from('requests')
                .select('id, status, created_at, type');

            if (reqError) throw reqError;

            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const pending = requests?.filter(r => r.status === 'PENDING' || r.status === 'IN_PROGRESS').length || 0;
            const processedThisMonth = requests?.filter(r =>
                (r.status === 'COMPLETED' || r.status === 'VALIDATED') &&
                new Date(r.created_at) >= startOfMonth
            ).length || 0;

            // Fetch active agents (users with agent role who logged in today)
            const { data: sessions } = await supabase
                .from('active_sessions')
                .select('user_id')
                .gte('last_activity', startOfDay.toISOString());

            const uniqueAgents = new Set(sessions?.map(s => s.user_id) || []).size;

            // Fetch today's appointments
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id')
                .gte('appointment_date', startOfDay.toISOString())
                .lt('appointment_date', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString());

            const appointmentsToday = appointments?.length || 0;

            // Calculate service stats by type
            const typeColors: Record<string, string> = {
                'CIVIL_REGISTRY': 'bg-blue-500',
                'PASSPORT': 'bg-green-500',
                'VISA': 'bg-orange-500',
                'LEGALIZATION': 'bg-purple-500',
                'CONSULAR_CARD': 'bg-pink-500',
                'ATTESTATION': 'bg-indigo-500'
            };

            const typeLabels: Record<string, string> = {
                'CIVIL_REGISTRY': 'État Civil',
                'PASSPORT': 'Passeport',
                'VISA': 'Visa',
                'LEGALIZATION': 'Légalisation',
                'CONSULAR_CARD': 'Carte Consulaire',
                'ATTESTATION': 'Attestation'
            };

            const serviceStats = Object.entries(
                (requests || []).reduce((acc, r) => {
                    if (!acc[r.type]) acc[r.type] = { pending: 0, processed: 0 };
                    if (r.status === 'PENDING' || r.status === 'IN_PROGRESS') {
                        acc[r.type].pending++;
                    } else if (r.status === 'COMPLETED' || r.status === 'VALIDATED') {
                        acc[r.type].processed++;
                    }
                    return acc;
                }, {} as Record<string, { pending: number; processed: number }>)
            ).map(([type, data]) => ({
                name: typeLabels[type] || type,
                pending: data.pending,
                processed: data.processed,
                color: typeColors[type] || 'bg-gray-500'
            })).slice(0, 4);

            // Fetch recent activity (last 5 requests)
            const { data: recentRequests } = await supabase
                .from('requests')
                .select('subject, status, updated_at, assigned_to_name')
                .order('updated_at', { ascending: false })
                .limit(5);

            const recentActivity = (recentRequests || []).map(r => ({
                action: r.subject || 'Demande mise à jour',
                user: r.assigned_to_name || 'Agent',
                time: formatRelativeTime(new Date(r.updated_at)),
                type: r.status === 'COMPLETED' || r.status === 'VALIDATED' ? 'success' as const :
                    r.status === 'PENDING' ? 'warning' as const : 'info' as const
            }));

            setStats({
                pendingRequests: pending,
                processedThisMonth,
                activeAgents: uniqueAgents,
                appointmentsToday,
                serviceStats,
                recentActivity
            });

        } catch (err: any) {
            console.error('Failed to load dashboard stats:', err);
            setError(err.message || 'Erreur lors du chargement des statistiques');
        } finally {
            setLoading(false);
        }
    }

    function formatRelativeTime(date: Date): string {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        const diffDays = Math.floor(diffHours / 24);
        return `Il y a ${diffDays}j`;
    }

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

    const isMaire = currentUser?.role === MunicipalRole.MAIRE;

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Alert className="max-w-md border-destructive">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>
                        {error}
                        <div className="mt-4">
                            <Button onClick={loadDashboardStats} variant="outline">
                                Réessayer
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const kpis = [
        { label: "Demandes en attente", value: stats?.pendingRequests || 0, icon: Clock, color: "text-orange-500" },
        { label: "Demandes traitées (mois)", value: stats?.processedThisMonth || 0, icon: CheckCircle2, color: "text-green-500" },
        { label: "Agents actifs", value: stats?.activeAgents || 0, icon: Users, color: "text-blue-500" },
        { label: "Rendez-vous aujourd'hui", value: stats?.appointmentsToday || 0, icon: Calendar, color: "text-purple-500" },
    ];

    return (
        <div className="flex-1 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        {isMaire ? `Cockpit du Maire` : `Espace Maire Adjoint`}
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenue, {currentUser?.name || (isMaire ? 'Monsieur le Maire' : 'Monsieur le Maire Adjoint')}.
                        Mairie de {mairieName}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button className="neu-raised gap-2" onClick={() => navigate('/dashboard/agent/requests')}>
                        <FileText className="w-4 h-4" />
                        Voir les Demandes
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="neu-raised">
                        <CardContent className="pt-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-2xl font-bold">{kpi.value}</p>
                                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                                </div>
                                <div className={`p-2 rounded-full bg-background ${kpi.color}`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Function Reminder */}
            <FunctionReminder />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
                {/* Services Overview */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-primary" />
                            Services Municipaux
                        </CardTitle>
                        <CardDescription>Activité par département</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats?.serviceStats && stats.serviceStats.length > 0 ? (
                            stats.serviceStats.map((service, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${service.color}`} />
                                        <span className="font-medium">{service.name}</span>
                                    </div>
                                    <div className="flex gap-4 text-sm">
                                        <span className="text-orange-600">{service.pending} en attente</span>
                                        <span className="text-green-600">{service.processed} traités</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                Aucune demande enregistrée
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-primary" />
                            Activité Récente
                        </CardTitle>
                        <CardDescription>Dernières actions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                            stats.recentActivity.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 border-b border-border/30 last:border-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${item.type === 'success' ? 'bg-green-500' :
                                            item.type === 'warning' ? 'bg-orange-500' : 'bg-blue-500'
                                            }`} />
                                        <div>
                                            <p className="text-sm font-medium">{item.action}</p>
                                            <p className="text-xs text-muted-foreground">{item.user}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-muted-foreground">{item.time}</span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-muted-foreground py-8">
                                Aucune activité récente
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="neu-raised animate-slide-up" style={{ animationDelay: "0.3s" }}>
                <CardHeader>
                    <CardTitle>Actions Rapides</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/dashboard/agent/requests')}>
                            <FileText className="w-6 h-6" />
                            <span className="text-xs">Valider Demandes</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/dashboard/admin/agents')}>
                            <Users className="w-6 h-6" />
                            <span className="text-xs">Gérer Personnel</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/dashboard/agent/appointments')}>
                            <Calendar className="w-6 h-6" />
                            <span className="text-xs">Rendez-vous</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/iboite')}>
                            <Building2 className="w-6 h-6" />
                            <span className="text-xs">Courrier</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
