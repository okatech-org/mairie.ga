import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
    AlertTriangle,
    Users,
    FileText,
    Calendar,
    CheckCircle2,
    Clock,
    Loader2,
    ClipboardList,
    Mail,
    FolderOpen,
    UserCheck,
    Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MunicipalRole } from "@/types/municipal-roles";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FunctionReminder } from "@/components/dashboard/FunctionReminder";

interface DashboardStats {
    pendingDossiers: number;
    activePersonnel: number;
    appointmentsToday: number;
    pendingCorrespondance: number;
    personnelStats: {
        total: number;
        present: number;
        absent: number;
        enConge: number;
    };
    recentActivity: {
        action: string;
        user: string;
        time: string;
        type: 'success' | 'warning' | 'info';
    }[];
}

export default function SGDashboard() {
    const { currentUser } = useDemo();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Protection: Access for SECRETAIRE_GENERAL only
    const hasAccess = currentUser?.role === MunicipalRole.SECRETAIRE_GENERAL;

    useEffect(() => {
        if (hasAccess) {
            loadDashboardStats();
        }
    }, [hasAccess]);

    async function loadDashboardStats() {
        try {
            setLoading(true);
            setError(null);

            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            // Fetch request statistics
            const { data: requests, error: reqError } = await supabase
                .from('requests')
                .select('id, status, created_at, type');

            if (reqError) throw reqError;

            const pendingDossiers = requests?.filter(r =>
                r.status === 'PENDING' || r.status === 'IN_PROGRESS'
            ).length || 0;

            // Fetch active personnel (users who logged in today)
            const { data: sessions } = await supabase
                .from('active_sessions')
                .select('user_id')
                .gte('last_activity', startOfDay.toISOString());

            const activePersonnel = new Set(sessions?.map(s => s.user_id) || []).size;

            // Fetch today's appointments
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id')
                .gte('appointment_date', startOfDay.toISOString())
                .lt('appointment_date', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString());

            const appointmentsToday = appointments?.length || 0;

            // Fetch pending correspondance (mock for now)
            const pendingCorrespondance = Math.floor(Math.random() * 10) + 5;

            // Personnel stats (simulated based on organization structure)
            const personnelStats = {
                total: 42,
                present: activePersonnel || 28,
                absent: 4,
                enConge: 10
            };

            // Fetch recent activity
            const { data: recentRequests } = await supabase
                .from('requests')
                .select('subject, status, updated_at, assigned_to_name')
                .order('updated_at', { ascending: false })
                .limit(5);

            const recentActivity = (recentRequests || []).map(r => ({
                action: r.subject || 'Dossier mis à jour',
                user: r.assigned_to_name || 'Agent',
                time: formatRelativeTime(new Date(r.updated_at)),
                type: r.status === 'COMPLETED' || r.status === 'VALIDATED' ? 'success' as const :
                    r.status === 'PENDING' ? 'warning' as const : 'info' as const
            }));

            setStats({
                pendingDossiers,
                activePersonnel,
                appointmentsToday,
                pendingCorrespondance,
                personnelStats,
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
                        Cette section est réservée au Secrétaire Général.
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

    // Get city name from user
    const cityName = currentUser?.name?.includes('(')
        ? currentUser.name.match(/\(([^)]+)\)/)?.[1] || 'Commune'
        : 'Port-Gentil';

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
        { label: "Dossiers à traiter", value: stats?.pendingDossiers || 0, icon: ClipboardList, color: "text-orange-500" },
        { label: "Personnel actif", value: stats?.activePersonnel || 0, icon: Users, color: "text-blue-500" },
        { label: "Rendez-vous du jour", value: stats?.appointmentsToday || 0, icon: Calendar, color: "text-purple-500" },
        { label: "Courriers en attente", value: stats?.pendingCorrespondance || 0, icon: Mail, color: "text-green-500" },
    ];

    return (
        <div className="flex-1 space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Secrétariat Général
                    </h1>
                    <p className="text-muted-foreground">
                        Bienvenue, {currentUser?.name || 'Monsieur le Secrétaire Général'}.
                        Mairie de {cityName}.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button className="neu-raised gap-2" onClick={() => navigate('/dashboard/agent/requests')}>
                        <FileText className="w-4 h-4" />
                        Voir les Dossiers
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
                {/* Gestion RH */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary" />
                            Gestion du Personnel
                        </CardTitle>
                        <CardDescription>État des ressources humaines</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{stats?.personnelStats.total || 0}</p>
                                    <p className="text-xs text-muted-foreground">Effectif total</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-green-100 text-green-600">
                                    <UserCheck className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{stats?.personnelStats.present || 0}</p>
                                    <p className="text-xs text-muted-foreground">Présents</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{stats?.personnelStats.enConge || 0}</p>
                                    <p className="text-xs text-muted-foreground">En congé</p>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 flex items-center gap-3">
                                <div className="p-2 rounded-full bg-red-100 text-red-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold">{stats?.personnelStats.absent || 0}</p>
                                    <p className="text-xs text-muted-foreground">Absents</p>
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => navigate('/dashboard/admin/agents')}
                        >
                            Gérer le Personnel
                        </Button>
                    </CardContent>
                </Card>

                {/* Activité Récente */}
                <Card className="neu-raised">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardList className="w-5 h-5 text-primary" />
                            Activité Récente
                        </CardTitle>
                        <CardDescription>Dernières actions administratives</CardDescription>
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
                            <ClipboardList className="w-6 h-6" />
                            <span className="text-xs">Suivi Dossiers</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/dashboard/admin/agents')}>
                            <Users className="w-6 h-6" />
                            <span className="text-xs">Personnel</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/dashboard/agent/appointments')}>
                            <Calendar className="w-6 h-6" />
                            <span className="text-xs">Rendez-vous</span>
                        </Button>
                        <Button variant="outline" className="h-20 flex-col gap-2 neu-raised" onClick={() => navigate('/icorrespondance')}>
                            <FolderOpen className="w-6 h-6" />
                            <span className="text-xs">iCorrespondance</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
