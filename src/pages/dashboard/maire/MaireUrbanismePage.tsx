import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
    Building2,
    Search,
    Plus,
    FileText,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    MapPin,
    Calendar,
    Eye,
    Loader2,
    Map
} from "lucide-react";
import { 
    urbanismeService, 
    UrbanismeDossier,
    UrbanismeType,
    UrbanismeStatus
} from "@/services/urbanisme-service";

const typeLabels: Record<UrbanismeType, string> = {
    'PERMIS_CONSTRUIRE': 'Permis de Construire',
    'DECLARATION_TRAVAUX': 'Déclaration Préalable',
    'PERMIS_DEMOLIR': 'Permis de Démolir',
    'PERMIS_AMENAGER': "Permis d'Aménager",
    'CERTIFICAT_URBANISME': "Certificat d'Urbanisme"
};

const typeColors: Record<UrbanismeType, string> = {
    'PERMIS_CONSTRUIRE': 'bg-blue-500/10 text-blue-600',
    'DECLARATION_TRAVAUX': 'bg-purple-500/10 text-purple-600',
    'PERMIS_DEMOLIR': 'bg-red-500/10 text-red-600',
    'PERMIS_AMENAGER': 'bg-orange-500/10 text-orange-600',
    'CERTIFICAT_URBANISME': 'bg-green-500/10 text-green-600'
};

const statusConfig: Record<UrbanismeStatus, { label: string; color: string; icon: React.ElementType }> = {
    'SUBMITTED': { label: 'Déposé', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: FileText },
    'IN_REVIEW': { label: 'En instruction', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
    'ADDITIONAL_INFO': { label: 'Pièces demandées', color: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: AlertCircle },
    'APPROVED': { label: 'Accordé', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
    'REJECTED': { label: 'Refusé', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    'WITHDRAWN': { label: 'Retiré', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: FileText }
};

interface NewDossierForm {
    type: UrbanismeType;
    title: string;
    description: string;
    surfaceTerrain?: number;
    surfaceConstruction?: number;
    address: {
        street: string;
        city: string;
    };
}

export default function MaireUrbanismePage() {
    const [dossiers, setDossiers] = useState<UrbanismeDossier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('tous');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDossier, setSelectedDossier] = useState<UrbanismeDossier | null>(null);
    
    const [newDossier, setNewDossier] = useState<NewDossierForm>({
        type: 'PERMIS_CONSTRUIRE',
        title: '',
        description: '',
        address: { street: '', city: 'Libreville' }
    });

    useEffect(() => {
        loadDossiers();
    }, []);

    const loadDossiers = async () => {
        setLoading(true);
        const data = await urbanismeService.getAll();
        setDossiers(data);
        setLoading(false);
    };

    const handleSubmit = async () => {
        if (!newDossier.title || !newDossier.type) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSubmitting(true);
        try {
            await urbanismeService.create({
                type: newDossier.type,
                title: newDossier.title,
                description: newDossier.description,
                surfaceTerrain: newDossier.surfaceTerrain,
                surfaceConstruction: newDossier.surfaceConstruction,
                address: newDossier.address,
                status: 'SUBMITTED',
                documents: [],
                metadata: {}
            });
            
            toast.success("Dossier créé avec succès");
            setIsDialogOpen(false);
            setNewDossier({
                type: 'PERMIS_CONSTRUIRE',
                title: '',
                description: '',
                address: { street: '', city: 'Libreville' }
            });
            loadDossiers();
        } catch (err) {
            toast.error("Erreur lors de la création du dossier");
        }
        setSubmitting(false);
    };

    const handleStatusChange = async (dossierId: string, newStatus: UrbanismeStatus) => {
        try {
            await urbanismeService.updateStatus(dossierId, newStatus);
            toast.success("Statut mis à jour");
            loadDossiers();
        } catch (err) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const filteredDossiers = dossiers.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.numero.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'tous' || 
            (activeTab === 'instruction' && d.status === 'IN_REVIEW') ||
            (activeTab === 'decision' && ['APPROVED', 'REJECTED'].includes(d.status));
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: dossiers.length,
        enInstruction: dossiers.filter(d => d.status === 'IN_REVIEW').length,
        enAttente: dossiers.filter(d => d.status === 'SUBMITTED' || d.status === 'ADDITIONAL_INFO').length,
        accordes: dossiers.filter(d => d.status === 'APPROVED').length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

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
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Nouveau dossier
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Déposer un dossier d'urbanisme</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Type de demande *</Label>
                                        <Select 
                                            value={newDossier.type} 
                                            onValueChange={(v) => setNewDossier({...newDossier, type: v as UrbanismeType})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(typeLabels).map(([key, label]) => (
                                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Surface terrain (m²)</Label>
                                        <Input 
                                            type="number"
                                            value={newDossier.surfaceTerrain || ''}
                                            onChange={(e) => setNewDossier({...newDossier, surfaceTerrain: parseFloat(e.target.value) || undefined})}
                                            placeholder="500"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Titre du projet *</Label>
                                    <Input 
                                        value={newDossier.title}
                                        onChange={(e) => setNewDossier({...newDossier, title: e.target.value})}
                                        placeholder="Construction d'une maison individuelle..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea 
                                        value={newDossier.description}
                                        onChange={(e) => setNewDossier({...newDossier, description: e.target.value})}
                                        placeholder="Décrivez votre projet..."
                                        rows={3}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Adresse</Label>
                                        <Input 
                                            value={newDossier.address.street}
                                            onChange={(e) => setNewDossier({
                                                ...newDossier, 
                                                address: {...newDossier.address, street: e.target.value}
                                            })}
                                            placeholder="Rue et numéro"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Ville</Label>
                                        <Input 
                                            value={newDossier.address.city}
                                            onChange={(e) => setNewDossier({
                                                ...newDossier, 
                                                address: {...newDossier.address, city: e.target.value}
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Surface construction (m²)</Label>
                                    <Input 
                                        type="number"
                                        value={newDossier.surfaceConstruction || ''}
                                        onChange={(e) => setNewDossier({...newDossier, surfaceConstruction: parseFloat(e.target.value) || undefined})}
                                        placeholder="150"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                    Annuler
                                </Button>
                                <Button onClick={handleSubmit} disabled={submitting}>
                                    {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Déposer le dossier
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
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
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <Clock className="h-6 w-6 text-yellow-500" />
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
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <AlertCircle className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.enAttente}</p>
                                <p className="text-sm text-muted-foreground">En attente</p>
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
                    <ScrollArea className="h-[500px]">
                        {filteredDossiers.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun dossier trouvé</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredDossiers.map((dossier) => {
                                    const StatusIcon = statusConfig[dossier.status]?.icon || FileText;
                                    return (
                                        <div
                                            key={dossier.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={typeColors[dossier.type]}>
                                                            {typeLabels[dossier.type]}
                                                        </Badge>
                                                        <Badge variant="outline" className={statusConfig[dossier.status]?.color}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig[dossier.status]?.label}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold">{dossier.title}</h3>
                                                    {dossier.description && (
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                            {dossier.description}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                            {dossier.numero}
                                                        </span>
                                                        {dossier.address && (
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3" />
                                                                {dossier.address.street}, {dossier.address.city}
                                                            </span>
                                                        )}
                                                        {dossier.dateDepot && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Déposé le {new Date(dossier.dateDepot).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                        {dossier.surfaceConstruction && (
                                                            <span>{dossier.surfaceConstruction} m² construction</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => setSelectedDossier(dossier)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Détails
                                                    </Button>
                                                    <Select 
                                                        value={dossier.status}
                                                        onValueChange={(v) => handleStatusChange(dossier.id, v as UrbanismeStatus)}
                                                    >
                                                        <SelectTrigger className="h-8 text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="SUBMITTED">Déposé</SelectItem>
                                                            <SelectItem value="IN_REVIEW">En instruction</SelectItem>
                                                            <SelectItem value="ADDITIONAL_INFO">Pièces demandées</SelectItem>
                                                            <SelectItem value="APPROVED">Accordé</SelectItem>
                                                            <SelectItem value="REJECTED">Refusé</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!selectedDossier} onOpenChange={(open) => !open && setSelectedDossier(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedDossier && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Badge className={typeColors[selectedDossier.type]}>
                                        {typeLabels[selectedDossier.type]}
                                    </Badge>
                                    {selectedDossier.numero}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div>
                                    <h3 className="font-semibold text-lg">{selectedDossier.title}</h3>
                                    <p className="text-muted-foreground mt-1">{selectedDossier.description}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Statut</Label>
                                        <Badge className={statusConfig[selectedDossier.status]?.color + " mt-1"}>
                                            {statusConfig[selectedDossier.status]?.label}
                                        </Badge>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Date de dépôt</Label>
                                        <p className="font-medium">
                                            {selectedDossier.dateDepot ? new Date(selectedDossier.dateDepot).toLocaleDateString('fr-FR') : '-'}
                                        </p>
                                    </div>
                                    {selectedDossier.surfaceTerrain && (
                                        <div>
                                            <Label className="text-muted-foreground">Surface terrain</Label>
                                            <p className="font-medium">{selectedDossier.surfaceTerrain} m²</p>
                                        </div>
                                    )}
                                    {selectedDossier.surfaceConstruction && (
                                        <div>
                                            <Label className="text-muted-foreground">Surface construction</Label>
                                            <p className="font-medium">{selectedDossier.surfaceConstruction} m²</p>
                                        </div>
                                    )}
                                    {selectedDossier.address && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Adresse du projet</Label>
                                            <p className="font-medium">
                                                {selectedDossier.address.street}, {selectedDossier.address.city}
                                            </p>
                                        </div>
                                    )}
                                    {selectedDossier.dateDecision && (
                                        <div>
                                            <Label className="text-muted-foreground">Date de décision</Label>
                                            <p className="font-medium">
                                                {new Date(selectedDossier.dateDecision).toLocaleDateString('fr-FR')}
                                            </p>
                                        </div>
                                    )}
                                    {selectedDossier.motifDecision && (
                                        <div className="col-span-2">
                                            <Label className="text-muted-foreground">Motif de la décision</Label>
                                            <p className="font-medium">{selectedDossier.motifDecision}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
