import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Gavel,
    Download,
    Eye,
    Search,
    Plus,
    Calendar,
    FileSignature,
    Clock
} from "lucide-react";

interface Arrete {
    id: string;
    numero: string;
    objet: string;
    dateSignature: string;
    datePublication?: string;
    categorie: 'police' | 'circulation' | 'urbanisme' | 'personnel' | 'divers';
    status: 'projet' | 'signé' | 'publié' | 'abrogé';
}

const MOCK_ARRETES: Arrete[] = [
    { id: '1', numero: 'ARR-2024-045', objet: "Réglementation de la circulation lors de la fête nationale", dateSignature: '2024-12-01', datePublication: '2024-12-02', categorie: 'circulation', status: 'publié' },
    { id: '2', numero: 'ARR-2024-044', objet: "Interdiction temporaire de stationnement - Avenue de la Libération", dateSignature: '2024-11-28', datePublication: '2024-11-29', categorie: 'circulation', status: 'publié' },
    { id: '3', numero: 'ARR-2024-043', objet: "Nomination du Chef de Service État Civil", dateSignature: '2024-11-25', categorie: 'personnel', status: 'signé' },
    { id: '4', numero: 'ARR-2024-042', objet: "Fermeture temporaire du marché central pour travaux", dateSignature: '2024-11-20', datePublication: '2024-11-21', categorie: 'police', status: 'publié' },
    { id: '5', numero: 'ARR-2024-041', objet: "Autorisation d'occupation du domaine public - Terrasse café", dateSignature: '2024-11-15', categorie: 'divers', status: 'signé' },
    { id: '6', numero: '', objet: "Réglementation des horaires de chantier", dateSignature: '', categorie: 'urbanisme', status: 'projet' },
];

const categorieLabels: Record<string, string> = {
    'police': 'Police municipale',
    'circulation': 'Circulation',
    'urbanisme': 'Urbanisme',
    'personnel': 'Personnel',
    'divers': 'Divers'
};

const categorieColors: Record<string, string> = {
    'police': 'bg-red-500/10 text-red-500',
    'circulation': 'bg-blue-500/10 text-blue-500',
    'urbanisme': 'bg-green-500/10 text-green-500',
    'personnel': 'bg-purple-500/10 text-purple-500',
    'divers': 'bg-gray-500/10 text-gray-500'
};

const statusConfig: Record<string, { label: string; color: string }> = {
    'projet': { label: 'Projet', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
    'signé': { label: 'Signé', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
    'publié': { label: 'Publié', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    'abrogé': { label: 'Abrogé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
};

export default function MaireArretesPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredArretes = MOCK_ARRETES.filter(a =>
        a.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.numero.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: MOCK_ARRETES.length,
        projets: MOCK_ARRETES.filter(a => a.status === 'projet').length,
        signes: MOCK_ARRETES.filter(a => a.status === 'signé').length,
        publies: MOCK_ARRETES.filter(a => a.status === 'publié').length
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Arrêtés Municipaux
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des arrêtés du Maire
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvel arrêté
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Gavel className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total arrêtés</p>
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
                                <p className="text-2xl font-bold">{stats.projets}</p>
                                <p className="text-sm text-muted-foreground">Projets</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <FileSignature className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.signes}</p>
                                <p className="text-sm text-muted-foreground">Signés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <Calendar className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.publies}</p>
                                <p className="text-sm text-muted-foreground">Publiés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher un arrêté..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Arrêtés List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Liste des arrêtés</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {filteredArretes.map((arrete) => (
                                <div
                                    key={arrete.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={categorieColors[arrete.categorie]}>
                                                    {categorieLabels[arrete.categorie]}
                                                </Badge>
                                                <Badge variant="outline" className={statusConfig[arrete.status].color}>
                                                    {statusConfig[arrete.status].label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold">{arrete.objet}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                {arrete.numero && <span className="font-mono">{arrete.numero}</span>}
                                                {arrete.dateSignature && (
                                                    <span>Signé le {new Date(arrete.dateSignature).toLocaleDateString('fr-FR')}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="ghost">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <Button size="sm" variant="ghost">
                                                <Download className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
