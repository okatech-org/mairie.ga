import { useDemo } from "@/contexts/DemoContext";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingUp, Users, FileText, Calendar, Building2, CheckCircle2, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MunicipalRole } from "@/types/municipal-roles";

export default function MaireDashboard() {
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

    const isMaire = currentUser?.role === MunicipalRole.MAIRE;

    // Mock KPIs
    const kpis = [
        { label: "Demandes en attente", value: 47, trend: -12, icon: Clock, color: "text-orange-500" },
        { label: "Demandes traitées (mois)", value: 234, trend: 8, icon: CheckCircle2, color: "text-green-500" },
        { label: "Agents actifs", value: 12, trend: 0, icon: Users, color: "text-blue-500" },
        { label: "Rendez-vous aujourd'hui", value: 8, trend: 2, icon: Calendar, color: "text-purple-500" },
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
                            {kpi.trend !== 0 && (
                                <div className={`flex items-center gap-1 mt-2 text-xs ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    <TrendingUp className={`w-3 h-3 ${kpi.trend < 0 ? 'rotate-180' : ''}`} />
                                    <span>{Math.abs(kpi.trend)}% vs semaine dernière</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

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
                        {[
                            { name: "État Civil", pending: 15, processed: 89, color: "bg-blue-500" },
                            { name: "Urbanisme", pending: 23, processed: 45, color: "bg-green-500" },
                            { name: "Fiscalité", pending: 8, processed: 67, color: "bg-orange-500" },
                            { name: "Affaires Sociales", pending: 12, processed: 33, color: "bg-purple-500" },
                        ].map((service, idx) => (
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
                        ))}
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
                        {[
                            { action: "Acte de naissance validé", user: "Officier EC", time: "Il y a 5 min", type: "success" },
                            { action: "Permis de construire en attente", user: "Chef Urbanisme", time: "Il y a 15 min", type: "warning" },
                            { action: "Nouveau rendez-vous planifié", user: "Agent Accueil", time: "Il y a 30 min", type: "info" },
                            { action: "Demande de légalisation traitée", user: "Agent Municipal", time: "Il y a 1h", type: "success" },
                            { action: "Certificat de résidence émis", user: "Officier EC", time: "Il y a 2h", type: "success" },
                        ].map((item, idx) => (
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
                        ))}
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
