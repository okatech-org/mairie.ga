import DashboardLayout from "@/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    FileText,
    MessageSquare,
    Clock,
    ArrowRight,
    HelpCircle,
    MapPin,
    Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AccueilDashboard() {
    return (
        <DashboardLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Espace Accueil
                        </h1>
                        <p className="text-muted-foreground">
                            Orientation des usagers et premier niveau d'information
                        </p>
                    </div>
                </div>

                {/* Search Bar for Usagers */}
                <Card className="neu-card border-none bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher un usager (NIP, Nom, Email)..."
                                    className="pl-10 bg-background/50"
                                />
                            </div>
                            <Button className="gap-2">
                                <Users className="h-4 w-4" />
                                Identifier Usager
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats */}
                <div className="grid md:grid-cols-4 gap-4">
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-blue-500/10">
                                    <Users className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">24</p>
                                    <p className="text-sm text-muted-foreground">Visiteurs aujourd'hui</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-orange-500/10">
                                    <Clock className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">12 min</p>
                                    <p className="text-sm text-muted-foreground">Attente moyenne</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-green-500/10">
                                    <FileText className="h-6 w-6 text-green-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">15</p>
                                    <p className="text-sm text-muted-foreground">Formulaires remis</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="neu-card border-none">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-purple-500/10">
                                    <MessageSquare className="h-6 w-6 text-purple-500" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">8</p>
                                    <p className="text-sm text-muted-foreground">Demandes info</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Actions */}
                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="neu-card border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5 text-primary" />
                                Orientation Directe
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" className="justify-start gap-2 h-auto py-4">
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">État Civil</p>
                                        <p className="text-[10px] text-muted-foreground">Naissances, Mariages...</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="justify-start gap-2 h-auto py-4">
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">Urbanisme</p>
                                        <p className="text-[10px] text-muted-foreground">Permis, Travaux...</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="justify-start gap-2 h-auto py-4">
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">Légalisation</p>
                                        <p className="text-[10px] text-muted-foreground">Authentifications...</p>
                                    </div>
                                </Button>
                                <Button variant="outline" className="justify-start gap-2 h-auto py-4">
                                    <div className="text-left">
                                        <p className="font-semibold text-sm">Social / Fiscal</p>
                                        <p className="text-[10px] text-muted-foreground">Aides, Taxes...</p>
                                    </div>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="neu-card border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5 text-primary" />
                                FAQ & Guides
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="p-3 rounded-lg bg-muted/50 border flex justify-between items-center group cursor-pointer hover:bg-muted/80 transition-colors">
                                <span className="text-sm">Pièces pour acte de naissance ?</span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 border flex justify-between items-center group cursor-pointer hover:bg-muted/80 transition-colors">
                                <span className="text-sm">Délais pour permis de construire ?</span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50 border flex justify-between items-center group cursor-pointer hover:bg-muted/80 transition-colors">
                                <span className="text-sm">Coût d'une légalisation ?</span>
                                <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
}
