import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet";
import {
    Gavel,
    Download,
    Eye,
    Search,
    Calendar,
    FileSignature,
    Loader2,
    Filter,
    FileText
} from "lucide-react";
import { 
    arreteService, 
    Arrete, 
    ArreteType
} from "@/services/arrete-service";
import { generateArretePDF } from "@/utils/generateArretePDF";
import { toast } from "sonner";

const typeLabels: Record<ArreteType, string> = {
    'MUNICIPAL': 'Arrêté Municipal',
    'INDIVIDUEL': 'Arrêté Individuel',
    'REGLEMENTAIRE': 'Arrêté Réglementaire',
    'TEMPORAIRE': 'Arrêté Temporaire'
};

const typeColors: Record<ArreteType, string> = {
    'MUNICIPAL': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'INDIVIDUEL': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    'REGLEMENTAIRE': 'bg-green-500/10 text-green-600 border-green-500/20',
    'TEMPORAIRE': 'bg-orange-500/10 text-orange-600 border-orange-500/20'
};

export default function ArretesPublicsPage() {
    const [arretes, setArretes] = useState<Arrete[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [selectedArrete, setSelectedArrete] = useState<Arrete | null>(null);
    const [downloadingPDF, setDownloadingPDF] = useState(false);

    useEffect(() => {
        loadArretes();
    }, []);

    const loadArretes = async () => {
        setLoading(true);
        try {
            const data = await arreteService.getPublished();
            setArretes(data);
        } catch (err) {
            console.error('Error loading arrêtés:', err);
        }
        setLoading(false);
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

    // Get unique years from arretes
    const years = [...new Set(arretes.map(a => new Date(a.createdAt).getFullYear()))].sort((a, b) => b - a);

    const filteredArretes = arretes.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.numero.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = typeFilter === 'all' || a.type === typeFilter;
        const matchesYear = yearFilter === 'all' || new Date(a.createdAt).getFullYear().toString() === yearFilter;
        return matchesSearch && matchesType && matchesYear;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <>
            <Helmet>
                <title>Arrêtés Municipaux | Mairie de Libreville</title>
                <meta name="description" content="Consultez les arrêtés municipaux publiés par la Mairie de Libreville. Accès public aux documents officiels." />
            </Helmet>

            <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
                        <Gavel className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Arrêtés Municipaux
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Consultez les arrêtés municipaux publiés par la Mairie de Libreville. 
                        Tous les documents sont accessibles au public conformément à la réglementation.
                    </p>
                </div>

                {/* Stats Card */}
                <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center gap-8 flex-wrap">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{arretes.length}</p>
                                <p className="text-sm text-muted-foreground">Arrêtés publiés</p>
                            </div>
                            <div className="h-12 w-px bg-border hidden md:block" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{years[0] || '-'}</p>
                                <p className="text-sm text-muted-foreground">Année en cours</p>
                            </div>
                            <div className="h-12 w-px bg-border hidden md:block" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{Object.keys(typeLabels).length}</p>
                                <p className="text-sm text-muted-foreground">Types d'arrêtés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Filters */}
                <Card className="border-none shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Rechercher par numéro ou objet..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={typeFilter} onValueChange={setTypeFilter}>
                                    <SelectTrigger className="w-[200px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les types</SelectItem>
                                        {Object.entries(typeLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select value={yearFilter} onValueChange={setYearFilter}>
                                    <SelectTrigger className="w-[140px]">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Année" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes</SelectItem>
                                        {years.map(year => (
                                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Arrêtés List */}
                <div className="grid gap-4">
                    {filteredArretes.length === 0 ? (
                        <Card className="border-none shadow-sm">
                            <CardContent className="py-16 text-center">
                                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-xl font-semibold mb-2">Aucun arrêté trouvé</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery || typeFilter !== 'all' || yearFilter !== 'all'
                                        ? "Modifiez vos critères de recherche"
                                        : "Aucun arrêté n'a encore été publié"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredArretes.map((arrete) => (
                            <Card key={arrete.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge className={typeColors[arrete.type]}>
                                                    {typeLabels[arrete.type]}
                                                </Badge>
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {arrete.numero}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg">{arrete.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {arrete.datePublication && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5" />
                                                        Publié le {new Date(arrete.datePublication).toLocaleDateString('fr-FR')}
                                                    </span>
                                                )}
                                                {arrete.signataire && (
                                                    <span className="flex items-center gap-1">
                                                        <FileSignature className="h-3.5 w-3.5" />
                                                        {arrete.signataire}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => setSelectedArrete(arrete)}
                                            >
                                                <Eye className="h-4 w-4 mr-2" />
                                                Consulter
                                            </Button>
                                            <Button 
                                                variant="default" 
                                                size="sm"
                                                onClick={() => handleDownloadPDF(arrete)}
                                                disabled={downloadingPDF}
                                            >
                                                {downloadingPDF ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Download className="h-4 w-4 mr-2" />
                                                )}
                                                PDF
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

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
        </>
    );
}
