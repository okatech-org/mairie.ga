import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Building2,
    MapPin,
    Search,
    Plus,
    FileCheck,
    Clock,
    AlertTriangle,
    Map,
    Eye
} from "lucide-react";

interface UrbanismeDossier {
    id: string;
    reference: string;
    type: 'permis_construire' | 'declaration_travaux' | 'certificat_urbanisme' | 'permis_demolir' | 'autorisation_lotir';
    demandeur: string;
    adresse: string;
    dateDepot: string;
    status: 'instruction' | 'avis_favorable' | 'avis_defavorable' | 'attente_pieces' | 'accordé' | 'refusé';
    surface?: number;
    description: string;
}

const MOCK_DOSSIERS: UrbanismeDossier[] = [
    { id: '1', reference: 'PC-2024-0089', type: 'permis_construire', demandeur: 'SCI Les Palmiers', adresse: '45 Avenue du Port', dateDepot: '2024-11-15', status: 'instruction', surface: 450, description: 'Construction immeuble R+4' },
    { id: '2', reference: 'DP-2024-0156', type: 'declaration_travaux', demandeur: 'M. Ekang Jean', adresse: '12 Rue des Manguiers', dateDepot: '2024-12-01', status: 'avis_favorable', surface: 35, description: 'Extension véranda' },
    { id: '3', reference: 'PC-2024-0088', type: 'permis_construire', demandeur: 'SARL Gabon Immobilier', adresse: 'Lot 234, Zone Industrielle', dateDepot: '2024-10-20', status: 'accordé', surface: 1200, description: 'Entrepôt logistique' },
    { id: '4', reference: 'CU-2024-0045', type: 'certificat_urbanisme', demandeur: 'Mme Mbeng Sophie', adresse: 'Parcelle 78, Quartier Louis', dateDepot: '2024-12-05', status: 'instruction', description: 'Demande info constructibilité' },
    { id: '5', reference: 'PC-2024-0087', type: 'permis_construire', demandeur: 'M. Ondo Pierre', adresse: '8 Rue de la Paix', dateDepot: '2024-11-01', status: 'attente_pieces', surface: 180, description: 'Maison individuelle' },
    { id: '6', reference: 'PD-2024-0012', type: 'permis_demolir', demandeur: 'Commune de Libreville', adresse: 'Ancien marché central', dateDepot: '2024-09-15', status: 'accordé', description: 'Démolition bâtiment vétuste' },
];

const typeLabels: Record<string, string> = {
    'permis_construire': 'Permis de construire',
    'declaration_travaux': 'Déclaration préalable',
    'certificat_urbanisme': 'Certificat d\'urbanisme',
    'permis_demolir': 'Permis de démolir',
    'autorisation_lotir': 'Autorisation de lotir'
};

const typeColors: Record<string, string> = {
    'permis_construire': 'bg-blue-500/10 text-blue-500',
    'declaration_travaux': 'bg-green-500/10 text-green-500',
    'certificat_urbanisme': 'bg-purple-500/10 text-purple-500',
    'permis_demolir': 'bg-red-500/10 text-red-500',
    'autorisation_lotir': 'bg-orange-500/10 text-orange-500'
};

const statusConfig: Record<string, { label: string; color: string }> = {
    'instruction': { label: 'En instruction', color: 'bg-blue-500/10 text-blue-600' },
    'avis_favorable': { label: 'Avis favorable', color: 'bg-green-500/10 text-green-600' },
    'avis_defavorable': { label: 'Avis défavorable', color: 'bg-red-500/10 text-red-600' },
    'attente_pieces': { label: 'Pièces manquantes', color: 'bg-yellow-500/10 text-yellow-600' },
    'accordé': { label: 'Accordé', color: 'bg-emerald-500/10 text-emerald-600' },
    'refusé': { label: 'Refusé', color: 'bg-red-500/10 text-red-600' }
};

export default function MaireUrbanismePage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('tous');

    const filteredDossiers = MOCK_DOSSIERS.filter(d => {
        const matchesSearch = d.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.demandeur.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.adresse.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'tous' ||
            (activeTab === 'instruction' && d.status === 'instruction') ||
            (activeTab === 'decision' && ['accordé', 'refusé'].includes(d.status));
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: MOCK_DOSSIERS.length,
        enInstruction: MOCK_DOSSIERS.filter(d => d.status === 'instruction').length,
        attentesPieces: MOCK_DOSSIERS.filter(d => d.status === 'attente_pieces').length,
        accordes: MOCK_DOSSIERS.filter(d => d.status === 'accordé').length
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Urbanisme
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des autorisations d'urbanisme
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Map className="h-4 w-4" />
                        Voir le PLU
                    </Button>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nouveau dossier
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <Building2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total dossiers</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <Clock className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.enInstruction}</p>
                                <p className="text-sm text-muted-foreground">En instruction</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.attentesPieces}</p>
                                <p className="text-sm text-muted-foreground">Pièces manquantes</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-green-500/10">
                                <FileCheck className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.accordes}</p>
                                <p className="text-sm text-muted-foreground">Accordés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList>
                        <TabsTrigger value="tous">Tous les dossiers</TabsTrigger>
                        <TabsTrigger value="instruction">En instruction</TabsTrigger>
                        <TabsTrigger value="decision">Décisions</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Dossiers List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Dossiers d'urbanisme</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {filteredDossiers.map((dossier) => (
                                <div
                                    key={dossier.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={typeColors[dossier.type]}>
                                                    {typeLabels[dossier.type]}
                                                </Badge>
                                                <Badge variant="outline" className={statusConfig[dossier.status].color}>
                                                    {statusConfig[dossier.status].label}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold">{dossier.description}</h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                <span className="font-medium">{dossier.demandeur}</span>
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span className="font-mono text-primary">{dossier.reference}</span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {dossier.adresse}
                                                </span>
                                                {dossier.surface && <span>{dossier.surface} m²</span>}
                                            </div>
                                        </div>
                                        <Button size="sm" variant="ghost">
                                            <Eye className="h-4 w-4" />
                                        </Button>
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
