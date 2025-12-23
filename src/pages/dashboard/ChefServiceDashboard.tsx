import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    FileText,
    BarChart3,
    CheckCircle2,
    Clock,
    ArrowRight,
    Settings,
    ShieldCheck,
    ClipboardList
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { MunicipalStaffRole } from "@/types/environments";
import { Link } from "react-router-dom";

export default function ChefServiceDashboard() {
    const { user } = useAuth();
    const role = user?.role as MunicipalStaffRole;

    const isEtatCivil = role === MunicipalStaffRole.CHEF_SERVICE_ETAT_CIVIL;
    const isUrbanisme = role === MunicipalStaffRole.CHEF_SERVICE_URBANISME;

    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Espace {isEtatCivil ? 'Chef Service État Civil' : isUrbanisme ? 'Chef Service Urbanisme' : 'Chef de Service'}
                        </h1>
                        <p className="text-muted-foreground">
                            Pilotage technique et validation des dossiers
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" className="gap-2">
                            <Settings className="h-4 w-4" />
                            Paramètres Service
                        </Button>
                        <Button className="gap-2">
                            <ShieldCheck className="h-4 w-4" />
                            Validation Requise
                        </Button>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-orange-500/10">
                                    <ClipboardList className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">42</p>
                                    <p className="text-sm text-muted-foreground">Dossiers ouverts</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <ShieldCheck className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">8</p>
                                    <p className="text-sm text-muted-foreground">Attente Signature</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">156</p>
                                    <p className="text-sm text-muted-foreground">Traités ce mois</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10">
                                    <Users className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">5</p>
                                    <p className="text-sm text-muted-foreground">Agents actifs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="neu-card border-none hover:bg-muted/30 transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Rapports d'Activité
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Statistiques de production et délais de traitement du service.
                            </p>
                            <Button variant="outline" className="w-full">Consulter</Button>
                        </CardContent>
                    </Card>

                    <Card className="neu-card border-none hover:bg-muted/30 transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Gestion de l'Équipe
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Planning des agents et répartition des corbeilles de tâches.
                            </p>
                            <Button variant="outline" className="w-full">Gérer</Button>
                        </CardContent>
                    </Card>

                    <Card className="neu-card border-none hover:bg-muted/30 transition-shadow">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                Validation de Dossiers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">
                                Accéder aux dossiers nécessitant une validation hiérarchique.
                            </p>
                            <Button variant="outline" className="w-full">Ouvrir</Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Specific Sections */}
                {isEtatCivil && (
                    <Card className="neu-card border-none bg-blue-50/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Focus État Civil</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl neu-inset">
                                    <h4 className="font-semibold mb-1">Registres</h4>
                                    <p className="text-xs text-muted-foreground">Contrôle de la tenue des registres numériques</p>
                                </div>
                                <div className="p-4 rounded-xl neu-inset">
                                    <h4 className="font-semibold mb-1">Mariages</h4>
                                    <p className="text-xs text-muted-foreground">Planification et validation des bans</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {isUrbanisme && (
                    <Card className="neu-card border-none bg-green-50/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Focus Urbanisme</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl neu-inset">
                                    <h4 className="font-semibold mb-1">Instructions</h4>
                                    <p className="text-xs text-muted-foreground">Suivi technique des permis de construire</p>
                                </div>
                                <div className="p-4 rounded-xl neu-inset">
                                    <h4 className="font-semibold mb-1">Terrain</h4>
                                    <p className="text-xs text-muted-foreground">Gestion des descentes et contrôles</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </DashboardLayout>
    );
}
