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
    Filter,
    Plus,
    FolderOpen,
    Calendar
} from "lucide-react";

interface Document {
    id: string;
    title: string;
    type: 'arrete' | 'deliberation' | 'pv' | 'rapport' | 'courrier';
    date: string;
    reference: string;
    status: 'brouillon' | 'signé' | 'publié';
}

const MOCK_DOCUMENTS: Document[] = [
    { id: '1', title: "Arrêté portant nomination du Secrétaire Général", type: 'arrete', date: '2024-12-01', reference: 'ARR-2024-045', status: 'publié' },
    { id: '2', title: "Délibération budget primitif 2025", type: 'deliberation', date: '2024-11-28', reference: 'DL-2024-089', status: 'signé' },
    { id: '3', title: "PV Conseil Municipal - Novembre 2024", type: 'pv', date: '2024-11-15', reference: 'PV-2024-011', status: 'publié' },
    { id: '4', title: "Rapport annuel activités 2024", type: 'rapport', date: '2024-12-05', reference: 'RAP-2024-001', status: 'brouillon' },
    { id: '5', title: "Courrier Préfet - Projet voirie", type: 'courrier', date: '2024-12-08', reference: 'COR-2024-234', status: 'signé' },
    { id: '6', title: "Arrêté réglementation marché central", type: 'arrete', date: '2024-12-02', reference: 'ARR-2024-046', status: 'publié' },
    { id: '7', title: "Délibération attribution marchés publics", type: 'deliberation', date: '2024-11-20', reference: 'DL-2024-090', status: 'publié' },
];

const typeLabels: Record<string, string> = {
    'arrete': 'Arrêté',
    'deliberation': 'Délibération',
    'pv': 'Procès-verbal',
    'rapport': 'Rapport',
    'courrier': 'Courrier'
};

const typeColors: Record<string, string> = {
    'arrete': 'bg-red-500/10 text-red-500',
    'deliberation': 'bg-blue-500/10 text-blue-500',
    'pv': 'bg-purple-500/10 text-purple-500',
    'rapport': 'bg-green-500/10 text-green-500',
    'courrier': 'bg-orange-500/10 text-orange-500'
};

const statusLabels: Record<string, string> = {
    'brouillon': 'Brouillon',
    'signé': 'Signé',
    'publié': 'Publié'
};

const statusColors: Record<string, string> = {
    'brouillon': 'bg-gray-500/10 text-gray-500',
    'signé': 'bg-yellow-500/10 text-yellow-500',
    'publié': 'bg-green-500/10 text-green-500'
};

export default function MaireDocumentsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string | null>(null);

    const filteredDocs = MOCK_DOCUMENTS.filter(doc => {
        const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            doc.reference.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = !selectedType || doc.type === selectedType;
        return matchesSearch && matchesType;
    });

    const stats = {
        total: MOCK_DOCUMENTS.length,
        arretes: MOCK_DOCUMENTS.filter(d => d.type === 'arrete').length,
        deliberations: MOCK_DOCUMENTS.filter(d => d.type === 'deliberation').length,
        brouillons: MOCK_DOCUMENTS.filter(d => d.status === 'brouillon').length
    };

    return (
        <div className="space-y-6 p-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Documents Officiels
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des actes et documents administratifs
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nouveau document
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="neu-card border-none cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setSelectedType(null)}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <FolderOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total documents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`neu-card border-none cursor-pointer transition-colors ${selectedType === 'arrete' ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`} onClick={() => setSelectedType(selectedType === 'arrete' ? null : 'arrete')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-red-500/10">
                                <FileText className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.arretes}</p>
                                <p className="text-sm text-muted-foreground">Arrêtés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`neu-card border-none cursor-pointer transition-colors ${selectedType === 'deliberation' ? 'ring-2 ring-primary' : 'hover:bg-muted/30'}`} onClick={() => setSelectedType(selectedType === 'deliberation' ? null : 'deliberation')}>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <FileText className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.deliberations}</p>
                                <p className="text-sm text-muted-foreground">Délibérations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <Calendar className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.brouillons}</p>
                                <p className="text-sm text-muted-foreground">En attente</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher par titre ou référence..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                </Button>
            </div>

            {/* Documents List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Documents récents</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[400px]">
                        <div className="space-y-3">
                            {filteredDocs.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={typeColors[doc.type]}>
                                                    {typeLabels[doc.type]}
                                                </Badge>
                                                <Badge variant="outline" className={statusColors[doc.status]}>
                                                    {statusLabels[doc.status]}
                                                </Badge>
                                            </div>
                                            <h3 className="font-semibold">{doc.title}</h3>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>Réf: {doc.reference}</span>
                                                <span>{new Date(doc.date).toLocaleDateString('fr-FR')}</span>
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
