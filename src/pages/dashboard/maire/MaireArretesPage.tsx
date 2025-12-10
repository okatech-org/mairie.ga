import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import {
    Gavel,
    Download,
    Eye,
    Search,
    Plus,
    Calendar,
    FileSignature,
    Clock,
    Loader2,
    Pencil,
    Trash2,
    Globe,
    XCircle,
    Mail,
    Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { 
    arreteService, 
    Arrete, 
    ArreteType, 
    ArreteStatus 
} from "@/services/arrete-service";
import { generateArretePDF } from "@/utils/generateArretePDF";
import { NotificationHistoryPanel } from "@/components/dashboard/maire/NotificationHistoryPanel";

const typeLabels: Record<ArreteType, string> = {
    'MUNICIPAL': 'Arrêté Municipal',
    'INDIVIDUEL': 'Arrêté Individuel',
    'REGLEMENTAIRE': 'Arrêté Réglementaire',
    'TEMPORAIRE': 'Arrêté Temporaire'
};

const typeColors: Record<ArreteType, string> = {
    'MUNICIPAL': 'bg-blue-500/10 text-blue-600',
    'INDIVIDUEL': 'bg-purple-500/10 text-purple-600',
    'REGLEMENTAIRE': 'bg-green-500/10 text-green-600',
    'TEMPORAIRE': 'bg-orange-500/10 text-orange-600'
};

const statusConfig: Record<ArreteStatus, { label: string; color: string; icon: React.ElementType }> = {
    'DRAFT': { label: 'Projet', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
    'SIGNED': { label: 'Signé', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: FileSignature },
    'PUBLISHED': { label: 'Publié', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Globe },
    'ABROGATED': { label: 'Abrogé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: XCircle }
};

interface ArreteForm {
    numero: string;
    type: ArreteType;
    title: string;
    content: string;
    signataire: string;
    dateEffet: string;
    dateFin: string;
}

const defaultForm: ArreteForm = {
    numero: '',
    type: 'MUNICIPAL',
    title: '',
    content: '',
    signataire: '',
    dateEffet: '',
    dateFin: ''
};

export default function MaireArretesPage() {
    const [arretes, setArretes] = useState<Arrete[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('tous');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArrete, setEditingArrete] = useState<Arrete | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedArrete, setSelectedArrete] = useState<Arrete | null>(null);
    const [formData, setFormData] = useState<ArreteForm>(defaultForm);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);

    useEffect(() => {
        loadArretes();
    }, []);

    const loadArretes = async () => {
        setLoading(true);
        const data = await arreteService.getAll();
        setArretes(data);
        setLoading(false);
    };

    const generateNumero = () => {
        const year = new Date().getFullYear();
        const num = String(arretes.length + 1).padStart(4, '0');
        return `ARR-${year}-${num}`;
    };

    const resetForm = () => {
        setFormData({
            ...defaultForm,
            numero: generateNumero()
        });
        setEditingArrete(null);
    };

    const handleOpenDialog = (arrete?: Arrete) => {
        if (arrete) {
            setEditingArrete(arrete);
            setFormData({
                numero: arrete.numero,
                type: arrete.type,
                title: arrete.title,
                content: arrete.content || '',
                signataire: arrete.signataire || '',
                dateEffet: arrete.dateEffet || '',
                dateFin: arrete.dateFin || ''
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.type) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSubmitting(true);
        try {
            if (editingArrete) {
                await arreteService.update(editingArrete.id, {
                    title: formData.title,
                    content: formData.content,
                    type: formData.type,
                    signataire: formData.signataire,
                    dateEffet: formData.dateEffet || undefined,
                    dateFin: formData.dateFin || undefined
                });
                toast.success("Arrêté mis à jour");
            } else {
                await arreteService.create({
                    numero: formData.numero || generateNumero(),
                    type: formData.type,
                    title: formData.title,
                    content: formData.content,
                    status: 'DRAFT',
                    signataire: formData.signataire,
                    dateEffet: formData.dateEffet || undefined,
                    dateFin: formData.dateFin || undefined,
                    documents: [],
                    metadata: {}
                });
                toast.success("Arrêté créé avec succès");
            }
            setIsDialogOpen(false);
            resetForm();
            loadArretes();
        } catch (err) {
            toast.error("Erreur lors de l'opération");
        }
        setSubmitting(false);
    };

    const handleSign = async (arrete: Arrete) => {
        const signataire = prompt("Nom du signataire:", arrete.signataire || "Le Maire");
        if (!signataire) return;

        try {
            await arreteService.sign(arrete.id, signataire);
            toast.success("Arrêté signé avec succès");
            loadArretes();
        } catch (err) {
            toast.error("Erreur lors de la signature");
        }
    };

    const handlePublish = async (arrete: Arrete) => {
        try {
            await arreteService.publish(arrete.id);
            toast.success("Arrêté publié avec succès");
            loadArretes();
        } catch (err) {
            toast.error("Erreur lors de la publication");
        }
    };

    const handleAbrogate = async (arrete: Arrete) => {
        if (!confirm("Êtes-vous sûr de vouloir abroger cet arrêté ?")) return;

        try {
            await arreteService.abrogate(arrete.id);
            toast.success("Arrêté abrogé");
            loadArretes();
        } catch (err) {
            toast.error("Erreur lors de l'abrogation");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet arrêté ?")) return;

        try {
            await arreteService.delete(id);
            toast.success("Arrêté supprimé");
            loadArretes();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleDownloadPDF = async (arrete: Arrete) => {
        setDownloadingPDF(true);
        try {
            const { url, filename } = await generateArretePDF(arrete);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("PDF téléchargé avec succès");
        } catch (err) {
            console.error('Error generating PDF:', err);
            toast.error("Erreur lors de la génération du PDF");
        }
        setDownloadingPDF(false);
    };

    const handleSendNotification = async (arrete: Arrete) => {
        if (!confirm("Envoyer une notification par email à tous les citoyens inscrits ?")) return;
        
        setSendingNotification(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-arrete-notification', {
                body: {
                    arreteId: arrete.id,
                    arreteNumero: arrete.numero,
                    arreteTitle: arrete.title,
                    arreteType: arrete.type,
                    datePublication: arrete.datePublication || new Date().toISOString(),
                    signataire: arrete.signataire,
                    notifyAllCitizens: true
                }
            });
            
            if (error) throw error;
            
            toast.success(data?.message || "Notifications envoyées avec succès");
        } catch (err) {
            console.error('Error sending notification:', err);
            toast.error("Erreur lors de l'envoi des notifications");
        }
        setSendingNotification(false);
    };

    const filteredArretes = arretes.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.numero.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'tous' || a.status === activeTab;
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: arretes.length,
        projets: arretes.filter(a => a.status === 'DRAFT').length,
        signes: arretes.filter(a => a.status === 'SIGNED').length,
        publies: arretes.filter(a => a.status === 'PUBLISHED').length
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
                        Arrêtés Municipaux
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gestion des arrêtés du Maire
                    </p>
                </div>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
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
                                <Globe className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.publies}</p>
                                <p className="text-sm text-muted-foreground">Publiés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Notification History */}
            <NotificationHistoryPanel />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList>
                        <TabsTrigger value="tous">Tous</TabsTrigger>
                        <TabsTrigger value="DRAFT">Projets</TabsTrigger>
                        <TabsTrigger value="SIGNED">Signés</TabsTrigger>
                        <TabsTrigger value="PUBLISHED">Publiés</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un arrêté..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Arrêtés List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Liste des arrêtés</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        {filteredArretes.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Gavel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun arrêté trouvé</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredArretes.map((arrete) => {
                                    const StatusIcon = statusConfig[arrete.status]?.icon || Clock;
                                    return (
                                        <div
                                            key={arrete.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={typeColors[arrete.type]}>
                                                            {typeLabels[arrete.type]}
                                                        </Badge>
                                                        <Badge variant="outline" className={statusConfig[arrete.status]?.color}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig[arrete.status]?.label}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold">{arrete.title}</h3>
                                                    <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                            {arrete.numero}
                                                        </span>
                                                        {arrete.dateSignature && (
                                                            <span className="flex items-center gap-1">
                                                                <FileSignature className="h-3 w-3" />
                                                                Signé le {new Date(arrete.dateSignature).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                        {arrete.signataire && (
                                                            <span>par {arrete.signataire}</span>
                                                        )}
                                                        {arrete.datePublication && (
                                                            <span className="flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                Publié le {new Date(arrete.datePublication).toLocaleDateString('fr-FR')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    <div className="flex gap-1">
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            onClick={() => setSelectedArrete(arrete)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="ghost"
                                                            onClick={() => handleOpenDialog(arrete)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        {arrete.status === 'DRAFT' && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost"
                                                                className="text-destructive"
                                                                onClick={() => handleDelete(arrete.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {/* Workflow buttons */}
                                                    {arrete.status === 'DRAFT' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => handleSign(arrete)}
                                                        >
                                                            <FileSignature className="h-3 w-3 mr-1" />
                                                            Signer
                                                        </Button>
                                                    )}
                                                    {arrete.status === 'SIGNED' && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => handlePublish(arrete)}
                                                        >
                                                            <Globe className="h-3 w-3 mr-1" />
                                                            Publier
                                                        </Button>
                                                    )}
                                                    {arrete.status === 'PUBLISHED' && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="text-xs"
                                                                onClick={() => handleSendNotification(arrete)}
                                                                disabled={sendingNotification}
                                                            >
                                                                {sendingNotification ? (
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <Mail className="h-3 w-3 mr-1" />
                                                                )}
                                                                Notifier
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline"
                                                                className="text-xs text-destructive"
                                                                onClick={() => handleAbrogate(arrete)}
                                                            >
                                                                <XCircle className="h-3 w-3 mr-1" />
                                                                Abroger
                                                            </Button>
                                                        </>
                                                    )}
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

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingArrete ? "Modifier l'arrêté" : "Créer un nouvel arrêté"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Numéro</Label>
                                <Input
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                    placeholder="ARR-2024-0001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Type *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(v) => setFormData({ ...formData, type: v as ArreteType })}
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
                        </div>
                        <div className="space-y-2">
                            <Label>Objet de l'arrêté *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Réglementation de la circulation..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contenu de l'arrêté</Label>
                            <MarkdownEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="# Article 1

Rédigez le contenu de l'arrêté...

## Considérant

- Point 1
- Point 2

## Arrête

**Article 1** : ...

**Article 2** : ..."
                                minHeight="350px"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Signataire</Label>
                                <Input
                                    value={formData.signataire}
                                    onChange={(e) => setFormData({ ...formData, signataire: e.target.value })}
                                    placeholder="Le Maire"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date d'effet</Label>
                                <Input
                                    type="date"
                                    value={formData.dateEffet}
                                    onChange={(e) => setFormData({ ...formData, dateEffet: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Date de fin (optionnel)</Label>
                                <Input
                                    type="date"
                                    value={formData.dateFin}
                                    onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingArrete ? "Mettre à jour" : "Créer l'arrêté"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!selectedArrete} onOpenChange={(open) => !open && setSelectedArrete(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedArrete && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Badge className={typeColors[selectedArrete.type]}>
                                        {typeLabels[selectedArrete.type]}
                                    </Badge>
                                    <Badge variant="outline" className={statusConfig[selectedArrete.status]?.color}>
                                        {statusConfig[selectedArrete.status]?.label}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="text-center border-b pb-4">
                                    <p className="text-sm text-muted-foreground font-mono">{selectedArrete.numero}</p>
                                    <h2 className="text-xl font-bold mt-2">{selectedArrete.title}</h2>
                                </div>
                                
                                {selectedArrete.content && (
                                    <div 
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ 
                                            __html: selectedArrete.content
                                                .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                                                .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                                                .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                                                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                                                .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
                                                .replace(/\n\n/g, '</p><p class="my-2">')
                                                .replace(/\n/g, '<br/>')
                                        }}
                                    />
                                )}

                                <div className="border-t pt-4 mt-6">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        {selectedArrete.signataire && (
                                            <div>
                                                <Label className="text-muted-foreground">Signataire</Label>
                                                <p className="font-medium">{selectedArrete.signataire}</p>
                                            </div>
                                        )}
                                        {selectedArrete.dateSignature && (
                                            <div>
                                                <Label className="text-muted-foreground">Date de signature</Label>
                                                <p className="font-medium">
                                                    {new Date(selectedArrete.dateSignature).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        )}
                                        {selectedArrete.datePublication && (
                                            <div>
                                                <Label className="text-muted-foreground">Date de publication</Label>
                                                <p className="font-medium">
                                                    {new Date(selectedArrete.datePublication).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        )}
                                        {selectedArrete.dateEffet && (
                                            <div>
                                                <Label className="text-muted-foreground">Date d'effet</Label>
                                                <p className="font-medium">
                                                    {new Date(selectedArrete.dateEffet).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedArrete(null)}>
                                    Fermer
                                </Button>
                                <Button 
                                    className="gap-2"
                                    onClick={() => handleDownloadPDF(selectedArrete)}
                                    disabled={downloadingPDF}
                                >
                                    {downloadingPDF ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Download className="h-4 w-4" />
                                    )}
                                    Télécharger PDF
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
