import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import {
    FileText,
    Download,
    Eye,
    Search,
    Plus,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Pencil,
    Trash2,
    Mail
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    deliberationService,
    Deliberation,
    DeliberationResult
} from "@/services/deliberation-service";
import { generateDeliberationPDF } from "@/utils/generateDeliberationPDF";

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

const resultatConfig: Record<DeliberationResult | 'PENDING', { label: string; color: string; icon: React.ElementType }> = {
    'ADOPTED': { label: 'Adopté', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
    'REJECTED': { label: 'Rejeté', color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
    'POSTPONED': { label: 'Reporté', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Calendar },
    'WITHDRAWN': { label: 'Retiré', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: XCircle },
    'PENDING': { label: 'En cours', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Clock }
};

interface DeliberationForm {
    numero: string;
    title: string;
    content: string;
    sessionDate: string;
    resultat: DeliberationResult | '';
    votesPour: number;
    votesContre: number;
    abstentions: number;
    rapporteur: string;
    categorie: string;
}

const defaultForm: DeliberationForm = {
    numero: '',
    title: '',
    content: '',
    sessionDate: '',
    resultat: '',
    votesPour: 0,
    votesContre: 0,
    abstentions: 0,
    rapporteur: '',
    categorie: 'divers'
};

export default function MaireDeliberationsPage() {
    const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDelib, setEditingDelib] = useState<Deliberation | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [selectedDelib, setSelectedDelib] = useState<Deliberation | null>(null);
    const [formData, setFormData] = useState<DeliberationForm>(defaultForm);
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    const [sendingNotification, setSendingNotification] = useState(false);

    useEffect(() => {
        loadDeliberations();
    }, []);

    const loadDeliberations = async () => {
        setLoading(true);
        const data = await deliberationService.getAll();
        setDeliberations(data);
        setLoading(false);
    };

    const generateNumero = () => {
        const year = new Date().getFullYear();
        const num = String(deliberations.length + 1).padStart(4, '0');
        return `DEL-${year}-${num}`;
    };

    const resetForm = () => {
        setFormData({
            ...defaultForm,
            numero: generateNumero(),
            sessionDate: new Date().toISOString().split('T')[0]
        });
        setEditingDelib(null);
    };

    const handleOpenDialog = (delib?: Deliberation) => {
        if (delib) {
            setEditingDelib(delib);
            setFormData({
                numero: delib.numero,
                title: delib.title,
                content: delib.content || '',
                sessionDate: delib.sessionDate,
                resultat: delib.resultat || '',
                votesPour: delib.votesPour || 0,
                votesContre: delib.votesContre || 0,
                abstentions: delib.abstentions || 0,
                rapporteur: delib.rapporteur || '',
                categorie: (delib.metadata?.categorie as string) || 'divers'
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.sessionDate) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSubmitting(true);
        try {
            if (editingDelib) {
                await deliberationService.update(editingDelib.id, {
                    title: formData.title,
                    content: formData.content,
                    sessionDate: formData.sessionDate,
                    resultat: formData.resultat as DeliberationResult || undefined,
                    votesPour: formData.votesPour,
                    votesContre: formData.votesContre,
                    abstentions: formData.abstentions,
                    rapporteur: formData.rapporteur || undefined
                });
                toast.success("Délibération mise à jour");
            } else {
                await deliberationService.create({
                    numero: formData.numero || generateNumero(),
                    title: formData.title,
                    content: formData.content,
                    sessionDate: formData.sessionDate,
                    resultat: formData.resultat as DeliberationResult || undefined,
                    votesPour: formData.votesPour,
                    votesContre: formData.votesContre,
                    abstentions: formData.abstentions,
                    rapporteur: formData.rapporteur || undefined,
                    documents: [],
                    metadata: { categorie: formData.categorie }
                });
                toast.success("Délibération créée avec succès");
            }
            setIsDialogOpen(false);
            resetForm();
            loadDeliberations();
        } catch (err) {
            toast.error("Erreur lors de l'opération");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cette délibération ?")) return;

        try {
            await deliberationService.delete(id);
            toast.success("Délibération supprimée");
            loadDeliberations();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handleDownloadPDF = async (delib: Deliberation) => {
        setDownloadingPDF(true);
        try {
            const { url, filename } = await generateDeliberationPDF(delib);
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

    const handleSendNotification = async (delib: Deliberation) => {
        if (!confirm("Envoyer une notification par email à tous les citoyens inscrits ?")) return;

        setSendingNotification(true);
        try {
            const { data, error } = await supabase.functions.invoke('send-deliberation-notification', {
                body: {
                    deliberationId: delib.id,
                    deliberationNumero: delib.numero,
                    deliberationTitle: delib.title,
                    sessionDate: delib.sessionDate,
                    resultat: delib.resultat,
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

    const filteredDelibs = deliberations.filter(d =>
        d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.numero.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: deliberations.length,
        adoptees: deliberations.filter(d => d.resultat === 'ADOPTED').length,
        enCours: deliberations.filter(d => !d.resultat).length,
        prochainConseil: '15 décembre 2024'
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
                        Délibérations
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Décisions du Conseil Municipal
                    </p>
                </div>
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
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
                    <ScrollArea className="h-[500px]">
                        {filteredDelibs.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucune délibération trouvée</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredDelibs.map((delib) => {
                                    const status = delib.resultat || 'PENDING';
                                    const ResultIcon = resultatConfig[status]?.icon || Clock;
                                    const categorie = (delib.metadata?.categorie as string) || 'divers';
                                    return (
                                        <div
                                            key={delib.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={categorieColors[categorie] || categorieColors.divers}>
                                                            {categorieLabels[categorie] || 'Divers'}
                                                        </Badge>
                                                        <Badge variant="outline" className={resultatConfig[status]?.color}>
                                                            <ResultIcon className="h-3 w-3 mr-1" />
                                                            {resultatConfig[status]?.label}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="font-semibold">{delib.title}</h3>
                                                    <div className="flex items-center flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                                        <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                                                            {delib.numero}
                                                        </span>
                                                        <span>Séance du {new Date(delib.sessionDate).toLocaleDateString('fr-FR')}</span>
                                                        {delib.resultat && (
                                                            <span className="text-green-600">
                                                                Pour: {delib.votesPour} | Contre: {delib.votesContre} | Abst: {delib.abstentions}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-2 ml-4">
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => setSelectedDelib(delib)}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleOpenDialog(delib)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        {!delib.resultat && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-destructive"
                                                                onClick={() => handleDelete(delib.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {delib.resultat === 'ADOPTED' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs"
                                                            onClick={() => handleSendNotification(delib)}
                                                            disabled={sendingNotification}
                                                        >
                                                            {sendingNotification ? (
                                                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <Mail className="h-3 w-3 mr-1" />
                                                            )}
                                                            Notifier
                                                        </Button>
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
                            {editingDelib ? "Modifier la délibération" : "Créer une nouvelle délibération"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Numéro</Label>
                                <Input
                                    value={formData.numero}
                                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                                    placeholder="DEL-2024-0001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <Select
                                    value={formData.categorie}
                                    onValueChange={(v) => setFormData({ ...formData, categorie: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categorieLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Objet de la délibération *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Adoption du budget primitif 2025..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Date de séance *</Label>
                            <Input
                                type="date"
                                value={formData.sessionDate}
                                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contenu de la délibération</Label>
                            <MarkdownEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="# Exposé des motifs

Rédigez le contenu de la délibération...

## Vu

- La loi n° ...
- Le décret n° ...

## Considérant

- Que ...

## Décide

**Article 1** : ...

**Article 2** : ..."
                                minHeight="300px"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Rapporteur</Label>
                                <Input
                                    value={formData.rapporteur}
                                    onChange={(e) => setFormData({ ...formData, rapporteur: e.target.value })}
                                    placeholder="M. Dupont"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Résultat du vote</Label>
                                <Select
                                    value={formData.resultat}
                                    onValueChange={(v) => setFormData({ ...formData, resultat: v as DeliberationResult })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="En attente de vote" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADOPTED">Adopté</SelectItem>
                                        <SelectItem value="REJECTED">Rejeté</SelectItem>
                                        <SelectItem value="POSTPONED">Reporté</SelectItem>
                                        <SelectItem value="WITHDRAWN">Retiré</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {formData.resultat && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Votes Pour</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.votesPour}
                                        onChange={(e) => setFormData({ ...formData, votesPour: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Votes Contre</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.votesContre}
                                        onChange={(e) => setFormData({ ...formData, votesContre: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Abstentions</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        value={formData.abstentions}
                                        onChange={(e) => setFormData({ ...formData, abstentions: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingDelib ? "Mettre à jour" : "Créer la délibération"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* View Dialog */}
            <Dialog open={!!selectedDelib} onOpenChange={(open) => !open && setSelectedDelib(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedDelib && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                    <Badge className={categorieColors[(selectedDelib.metadata?.categorie as string) || 'divers']}>
                                        {categorieLabels[(selectedDelib.metadata?.categorie as string) || 'divers']}
                                    </Badge>
                                    <Badge variant="outline" className={resultatConfig[selectedDelib.resultat || 'PENDING']?.color}>
                                        {resultatConfig[selectedDelib.resultat || 'PENDING']?.label}
                                    </Badge>
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="text-center border-b pb-4">
                                    <p className="text-sm text-muted-foreground font-mono">{selectedDelib.numero}</p>
                                    <h2 className="text-xl font-bold mt-2">{selectedDelib.title}</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Séance du {new Date(selectedDelib.sessionDate).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                {selectedDelib.content && (
                                    <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html: selectedDelib.content
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

                                {selectedDelib.resultat && (
                                    <div className="border-t pt-4 mt-6">
                                        <h4 className="font-semibold mb-3">Résultat du vote</h4>
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div className="p-3 bg-green-500/10 rounded-lg">
                                                <p className="text-2xl font-bold text-green-600">{selectedDelib.votesPour}</p>
                                                <p className="text-sm text-muted-foreground">Pour</p>
                                            </div>
                                            <div className="p-3 bg-red-500/10 rounded-lg">
                                                <p className="text-2xl font-bold text-red-600">{selectedDelib.votesContre}</p>
                                                <p className="text-sm text-muted-foreground">Contre</p>
                                            </div>
                                            <div className="p-3 bg-gray-500/10 rounded-lg">
                                                <p className="text-2xl font-bold text-gray-600">{selectedDelib.abstentions}</p>
                                                <p className="text-sm text-muted-foreground">Abstentions</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedDelib.rapporteur && (
                                    <div className="text-sm">
                                        <Label className="text-muted-foreground">Rapporteur</Label>
                                        <p className="font-medium">{selectedDelib.rapporteur}</p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedDelib(null)}>
                                    Fermer
                                </Button>
                                <Button
                                    className="gap-2"
                                    onClick={() => handleDownloadPDF(selectedDelib)}
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
