import { Link } from 'react-router-dom';
import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, FileText, Calendar, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { FunctionReminder } from "@/components/dashboard/FunctionReminder";

const MOCK_REQUESTS = [
    { id: '1', initials: 'MN', name: 'Marie Ndong', type: 'Acte de naissance', time: 'Il y a 30 min' },
    { id: '2', initials: 'PO', name: 'Pierre Ondo', type: 'Certificat de résidence', time: 'Il y a 2h' },
    { id: '3', initials: 'SE', name: 'Sophie Ekang', type: 'Légalisation', time: 'Il y a 3h' },
];

export default function AgentDashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Espace Agent
                        </h1>
                        <p className="text-muted-foreground">
                            Gestion des demandes et rendez-vous
                        </p>
                    </div>
                    <Button className="gap-2">
                        <FileText className="h-4 w-4" />
                        Nouvelle Demande
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <FileText className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">12</p>
                                    <p className="text-sm text-muted-foreground">À traiter</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-yellow-500/10">
                                    <Clock className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">5</p>
                                    <p className="text-sm text-muted-foreground">En attente</p>
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
                                    <p className="text-2xl font-bold">28</p>
                                    <p className="text-sm text-muted-foreground">Traitées (24h)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10">
                                    <Calendar className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">8</p>
                                    <p className="text-sm text-muted-foreground">RDV aujourd'hui</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Function Reminder */}
                <FunctionReminder />

                {/* Quick Links */}
                <div className="grid md:grid-cols-2 gap-4">
                    <Link to="/dashboard/agent/requests">
                        <Card className="neu-card border-none hover:bg-muted/30 transition-colors cursor-pointer">
                            <CardContent className="pt-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-primary/10">
                                        <FileText className="h-8 w-8 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Mes demandes</h3>
                                        <p className="text-sm text-muted-foreground">Traiter les demandes citoyens</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                    <Link to="/dashboard/agent/appointments">
                        <Card className="neu-card border-none hover:bg-muted/30 transition-colors cursor-pointer">
                            <CardContent className="pt-6 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-xl bg-purple-500/10">
                                        <Calendar className="h-8 w-8 text-purple-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg">Rendez-vous</h3>
                                        <p className="text-sm text-muted-foreground">Gérer les audiences</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* Recent Requests */}
                <Card className="neu-card border-none">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Dernières demandes</CardTitle>
                        <Link to="/dashboard/agent/requests">
                            <Button variant="link" className="text-primary">
                                Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {MOCK_REQUESTS.map((request) => (
                                <div key={request.id} className="flex items-center justify-between p-4 rounded-xl neu-inset">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                            {request.initials}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{request.name}</p>
                                            <p className="text-sm text-muted-foreground">{request.type} • {request.time}</p>
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm">
                                        Voir le dossier
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}

