import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    FileText,
    Download,
    Eye,
    Search,
    Plus,
    Users,
    Calendar,
    CheckCircle,
    XCircle
} from "lucide-react";

interface Deliberation {
    id: string;
    numero: string;
    objet: string;
    dateSeance: string;
    dateVote?: string;
    resultat: 'adopté' | 'rejeté' | 'reporté' | 'en_cours';
    votePour?: number;
    voteContre?: number;
    abstention?: number;
    categorie: 'budget' | 'urbanisme' | 'social' | 'culture' | 'environnement' | 'divers';
}

const MOCK_DELIBERATIONS: Deliberation[] = [
    { id: '1', numero: 'DEL-2024-089', objet: "Adoption du budget primitif 2025", dateSeance: '2024-11-28', dateVote: '2024-11-28', resultat: 'adopté', votePour: 18, voteContre: 3, abstention: 2, categorie: 'budget' },
    { id: '2', numero: 'DEL-2024-088', objet: "Modification du PLU - Zone commerciale Est", dateSeance: '2024-11-28', dateVote: '2024-11-28', resultat: 'adopté', votePour: 15, voteContre: 5, abstention: 3, categorie: 'urbanisme' },
    { id: '3', numero: 'DEL-2024-087', objet: "Subvention associations sportives 2025", dateSeance: '2024-11-28', dateVote: '2024-11-28', resultat: 'adopté', votePour: 21, voteContre: 0, abstention: 2, categorie: 'culture' },
    { id: '4', numero: 'DEL-2024-086', objet: "Projet parc écologique municipal", dateSeance: '2024-11-28', resultat: 'reporté', categorie: 'environnement' },
    { id: '5', numero: 'DEL-2024-085', objet: "Convention partenariat avec l'État - Voirie", dateSeance: '2024-10-15', dateVote: '2024-10-15', resultat: 'adopté', votePour: 20, voteContre: 1, abstention: 2, categorie: 'divers' },
    { id: '6', numero: '', objet: "Création d'une crèche municipale", dateSeance: '2024-12-15', resultat: 'en_cours', categorie: 'social' },
];

const categorieLabels: Record<string, string> = {
    'budget': 'Budget & Finances',
    'urbanisme': 'Urbanisme',
    'social': 'Affaires Sociales',
    'culture': 'Culture & Sport',
    'environnement': 'Environnement',
    'divers': 'Divers'
};

const categorieColors: Record<string, string> = {
    'budget': 'bg-green-500/10 text-green-500',
    'urbanisme': 'bg-blue-500/10 text-blue-500',
    'social': 'bg-pink-500/10 text-pink-500',
    'culture': 'bg-purple-500/10 text-purple-500',
    'environnement': 'bg-emerald-500/10 text-emerald-500',
    'divers': 'bg-gray-500/10 text-gray-500'
};

const resultatConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    'adopté': { label: 'Adopté', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
    'rejeté': { label: 'Rejeté', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    'reporté': { label: 'Reporté', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Calendar },
    'en_cours': { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: FileText }
};

export default function MaireDeliberationsPage() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDelibs = MOCK_DELIBERATIONS.filter(d =>
        d.objet.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.numero.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: MOCK_DELIBERATIONS.length,
        adoptees: MOCK_DELIBERATIONS.filter(d => d.resultat === 'adopté').length,
        enCours: MOCK_DELIBERATIONS.filter(d => d.resultat === 'en_cours').length,
        prochainConseil: '15 décembre 2024'
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Délibérations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Décisions du Conseil Municipal
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau projet
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total 2024</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <CheckCircle className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.adoptees}</p>
                                <p className="text-sm text-muted-foreground">Adoptées</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Users className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.enCours}</p>
                                <p className="text-sm text-muted-foreground">En préparation</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <Calendar className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{stats.prochainConseil}</p>
                                <p className="text-sm text-muted-foreground">Prochain conseil</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Rechercher une délibération..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Délibérations List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Liste des délibérations</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {filteredDelibs.map((delib) => {
                                const ResultIcon = resultatConfig[delib.resultat].icon;
                                return (
                                    <div
                                        key={delib.id}
                                        className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge className={categorieColors[delib.categorie]}>
                                                        {categorieLabels[delib.categorie]}
                                                    </Badge>
                                                    <Badge variant="outline" className={resultatConfig[delib.resultat].color}>
                                                        <ResultIcon className="h-3 w-3 mr-1" />
                                                        {resultatConfig[delib.resultat].label}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-semibold">{delib.objet}</h3>
                                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                    {delib.numero && <span className="font-mono">{delib.numero}</span>}
                                                    <span>Séance du {new Date(delib.dateSeance).toLocaleDateString('fr-FR')}</span>
                                                    {delib.votePour !== undefined && (
                                                        <span className="text-green-600">
                                                            Pour: {delib.votePour} | Contre: {delib.voteContre} | Abst: {delib.abstention}
                                                        </span>
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
                                );
                            })}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
