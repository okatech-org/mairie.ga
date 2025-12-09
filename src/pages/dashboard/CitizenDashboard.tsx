
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    FileText,
    Clock,
    Bell,
    CheckCircle,
    AlertCircle,
    Plus
} from "lucide-react";

import { useCitizenProfile } from '@/hooks/useCitizenProfile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// 🧠 Neuro-Hexagonal: Using Neuron hook instead of legacy service
import { useRequestNeurons } from '@/hooks/neurons';

export default function CitizenDashboard() {
    const { user: citizen, loading, error } = useCitizenProfile();
    const { user: authUser } = useAuth();
    const navigate = useNavigate();

    // 🧠 Neuro-Hexagonal: Hook injects adapter into neurons
    const { getStatistics, loading: statsLoading } = useRequestNeurons();

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        inProgress: 0,
        completed: 0,
        rejected: 0
    });

    useEffect(() => {
        if (authUser?.id) {
            loadStats(authUser.id);
        }
    }, [authUser?.id]);

    const loadStats = async (userId: string) => {
        try {
            // 🧠 Using Neuron instead of direct service call
            const data = await getStatistics(userId);
            if (data) {
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to load dashboard stats", err);
        }
    };

    if (loading) return <div className="p-8 text-center">Chargement du profil...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Erreur: {error}</div>;
    if (!citizen) return <div className="p-8 text-center">Profil introuvable</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground shadow-lg">
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">
                        Bonjour, {citizen.firstName} {citizen.lastName}
                    </h1>
                    <p className="opacity-90 max-w-xl">
                        Bienvenue sur votre espace citoyen unifié. Gérez toutes vos démarches administratives,
                        suivez vos demandes et accédez à vos documents officiels en un seul endroit.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                            variant="secondary"
                            onClick={() => navigate('/dashboard/citizen/requests')}
                            className="gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nouvelle Demande
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                            onClick={() => navigate('/dashboard/citizen/documents')}
                        >
                            Mes Documents
                        </Button>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <FileText className="h-64 w-64" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Demandes en cours",
                        value: stats.inProgress + stats.pending,
                        icon: Clock,
                        color: "text-blue-500",
                        bg: "bg-blue-500/10",
                    },
                    {
                        label: "Documents disponibles",
                        value: stats.total, // Using total requests as proxy if needed, ideally separate
                        icon: FileText,
                        color: "text-purple-500",
                        bg: "bg-purple-500/10",
                    },
                    {
                        label: "Dossiers terminés",
                        value: stats.completed,
                        icon: CheckCircle,
                        color: "text-emerald-500",
                        bg: "bg-emerald-500/10",
                    },
                    {
                        label: "Notifications",
                        value: "0",
                        icon: Bell,
                        color: "text-orange-500",
                        bg: "bg-orange-500/10",
                    }
                ].map((stat, i) => (
                    <Card key={i} className="hover:shadow-md transition-shadow cursor-default group">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    {stat.label}
                                </p>
                                <h3 className="text-2xl font-bold group-hover:scale-105 transition-transform origin-left">
                                    {stat.value}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon className={`h-6 w-6 ${stat.color}`} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Profile & Info Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Identity Card */}
                <Card className="md:row-span-2">
                    <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Identité Numérique
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/citizen/settings')}>Modifier</Button>
                    </div>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg overflow-hidden relative">
                                {citizen.photoUrl ? (
                                    <img
                                        src={citizen.photoUrl}
                                        alt={`${citizen.firstName} ${citizen.lastName}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <span className="text-2xl font-bold text-primary">
                                        {citizen.firstName[0]}{citizen.lastName[0]}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-xl">{citizen.firstName} {citizen.lastName}</h3>
                                <p className="text-muted-foreground">Né(e) le {citizen.dateOfBirth.toLocaleDateString()}</p>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
                                        Vérifié
                                    </span>
                                    <span className="text-sm text-muted-foreground">• {citizen.profession}</span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">N° NIP / CNI</p>
                                    <p className="font-medium">{citizen.cniNumber || "Non renseigné"}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nationalité</p>
                                    <p className="font-medium">Gabonaise 🇬🇦</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Adresse actuelle</p>
                                <p className="font-medium">
                                    {citizen.currentAddress.street}, {citizen.currentAddress.city}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                                    <p className="font-medium">{citizen.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                                    <p className="font-medium truncate" title={citizen.email}>{citizen.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-primary/5 rounded-lg p-4 mt-2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-sm font-medium">Dossier Municipal</p>
                                <span className="text-xs font-mono bg-background px-2 py-0.5 rounded border">{citizen.municipalFile}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Votre dossier est actif auprès de {citizen.assignedMunicipality}.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions & Status */}
                <Card>
                    <div className="p-6 border-b flex items-center justify-between bg-muted/30">
                        <h2 className="font-semibold text-lg flex items-center gap-2">
                            <Clock className="h-5 w-5 text-orange-500" />
                            Activités Récentes
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/citizen/requests')}>Tout voir</Button>
                    </div>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {/* Empty state or placeholder for now until we fetch recent requests specifically */}
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                {stats.total > 0 ? "Consultez 'Mes Demandes' pour voir le détail." : "Aucune activité récente à afficher."}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
