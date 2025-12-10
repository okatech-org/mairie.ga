import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Helmet } from "react-helmet";
import {
    FileCheck,
    Eye,
    Search,
    Calendar,
    Loader2,
    Filter,
    FileText,
    Users,
    ThumbsUp,
    ThumbsDown,
    MinusCircle,
    Download
} from "lucide-react";
import { toast } from 'sonner';
import { 
    deliberationService, 
    Deliberation, 
    DeliberationResult
} from "@/services/deliberation-service";
import { generateDeliberationPDF } from "@/utils/generateDeliberationPDF";

const resultLabels: Record<DeliberationResult, string> = {
    'ADOPTED': 'Adoptée',
    'REJECTED': 'Rejetée',
    'POSTPONED': 'Reportée',
    'WITHDRAWN': 'Retirée'
};

const resultColors: Record<DeliberationResult, string> = {
    'ADOPTED': 'bg-green-500/10 text-green-600 border-green-500/20',
    'REJECTED': 'bg-red-500/10 text-red-600 border-red-500/20',
    'POSTPONED': 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    'WITHDRAWN': 'bg-gray-500/10 text-gray-600 border-gray-500/20'
};

export default function DeliberationsPubliquesPage() {
    const [deliberations, setDeliberations] = useState<Deliberation[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [resultFilter, setResultFilter] = useState<string>('all');
    const [yearFilter, setYearFilter] = useState<string>('all');
    const [selectedDeliberation, setSelectedDeliberation] = useState<Deliberation | null>(null);

    useEffect(() => {
        loadDeliberations();
    }, []);

    const loadDeliberations = async () => {
        setLoading(true);
        try {
            const data = await deliberationService.getAll();
            setDeliberations(data);
        } catch (err) {
            console.error('Error loading deliberations:', err);
        }
        setLoading(false);
    };

    // Get unique years
    const years = [...new Set(deliberations.map(d => new Date(d.sessionDate).getFullYear()))].sort((a, b) => b - a);

    const filteredDeliberations = deliberations.filter(d => {
        const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.numero.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesResult = resultFilter === 'all' || d.resultat === resultFilter;
        const matchesYear = yearFilter === 'all' || new Date(d.sessionDate).getFullYear().toString() === yearFilter;
        return matchesSearch && matchesResult && matchesYear;
    });

    const stats = {
        total: deliberations.length,
        adopted: deliberations.filter(d => d.resultat === 'ADOPTED').length,
        rejected: deliberations.filter(d => d.resultat === 'REJECTED').length
    };

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
                <title>Délibérations Municipales | Mairie de Libreville</title>
                <meta name="description" content="Consultez les délibérations du conseil municipal de Libreville. Accès public aux décisions municipales." />
            </Helmet>

            <div className="container mx-auto py-8 px-4 space-y-8 animate-fade-in">
                {/* Header */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 rounded-full bg-primary/10 mb-4">
                        <FileCheck className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Délibérations Municipales
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Consultez les délibérations adoptées par le conseil municipal de Libreville.
                        Transparence et accès public aux décisions municipales.
                    </p>
                </div>

                {/* Stats Card */}
                <Card className="border-none shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-center gap-8 flex-wrap">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total délibérations</p>
                            </div>
                            <div className="h-12 w-px bg-border hidden md:block" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{stats.adopted}</p>
                                <p className="text-sm text-muted-foreground">Adoptées</p>
                            </div>
                            <div className="h-12 w-px bg-border hidden md:block" />
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                                <p className="text-sm text-muted-foreground">Rejetées</p>
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
                                <Select value={resultFilter} onValueChange={setResultFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <Filter className="h-4 w-4 mr-2" />
                                        <SelectValue placeholder="Résultat" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous les résultats</SelectItem>
                                        {Object.entries(resultLabels).map(([key, label]) => (
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

                {/* Deliberations List */}
                <div className="grid gap-4">
                    {filteredDeliberations.length === 0 ? (
                        <Card className="border-none shadow-sm">
                            <CardContent className="py-16 text-center">
                                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                                <h3 className="text-xl font-semibold mb-2">Aucune délibération trouvée</h3>
                                <p className="text-muted-foreground">
                                    {searchQuery || resultFilter !== 'all' || yearFilter !== 'all'
                                        ? "Modifiez vos critères de recherche"
                                        : "Aucune délibération n'a encore été enregistrée"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        filteredDeliberations.map((delib) => (
                            <Card key={delib.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {delib.resultat && (
                                                    <Badge className={resultColors[delib.resultat]}>
                                                        {resultLabels[delib.resultat]}
                                                    </Badge>
                                                )}
                                                <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                                    {delib.numero}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg">{delib.title}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    Session du {new Date(delib.sessionDate).toLocaleDateString('fr-FR')}
                                                </span>
                                                {delib.rapporteur && (
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5" />
                                                        Rapporteur: {delib.rapporteur}
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <ThumbsUp className="h-3.5 w-3.5" />
                                                        {delib.votesPour}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <ThumbsDown className="h-3.5 w-3.5" />
                                                        {delib.votesContre}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-muted-foreground">
                                                        <MinusCircle className="h-3.5 w-3.5" />
                                                        {delib.abstentions}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => setSelectedDeliberation(delib)}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Consulter
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                {/* View Dialog */}
                <Dialog open={!!selectedDeliberation} onOpenChange={(open) => !open && setSelectedDeliberation(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        {selectedDeliberation && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        {selectedDeliberation.resultat && (
                                            <Badge className={resultColors[selectedDeliberation.resultat]}>
                                                {resultLabels[selectedDeliberation.resultat]}
                                            </Badge>
                                        )}
                                    </DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="text-center border-b pb-4">
                                        <p className="text-sm text-muted-foreground font-mono">{selectedDeliberation.numero}</p>
                                        <h2 className="text-xl font-bold mt-2">{selectedDeliberation.title}</h2>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Session du {new Date(selectedDeliberation.sessionDate).toLocaleDateString('fr-FR', {
                                                weekday: 'long',
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {/* Votes summary */}
                                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-green-600 font-bold text-xl">
                                                <ThumbsUp className="h-5 w-5" />
                                                {selectedDeliberation.votesPour}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Pour</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-red-600 font-bold text-xl">
                                                <ThumbsDown className="h-5 w-5" />
                                                {selectedDeliberation.votesContre}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Contre</p>
                                        </div>
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-2 text-muted-foreground font-bold text-xl">
                                                <MinusCircle className="h-5 w-5" />
                                                {selectedDeliberation.abstentions}
                                            </div>
                                            <p className="text-sm text-muted-foreground">Abstentions</p>
                                        </div>
                                    </div>
                                    
                                    {selectedDeliberation.content && (
                                        <div 
                                            className="prose prose-sm dark:prose-invert max-w-none"
                                            dangerouslySetInnerHTML={{ 
                                                __html: selectedDeliberation.content
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

                                    {selectedDeliberation.rapporteur && (
                                        <div className="border-t pt-4">
                                            <Label className="text-muted-foreground">Rapporteur</Label>
                                            <p className="font-medium">{selectedDeliberation.rapporteur}</p>
                                        </div>
                                    )}
                                </div>
                                <DialogFooter className="flex-col sm:flex-row gap-2">
                                    <Button 
                                        variant="outline" 
                                        onClick={async () => {
                                            try {
                                                const { url, filename } = await generateDeliberationPDF(selectedDeliberation);
                                                const link = document.createElement('a');
                                                link.href = url;
                                                link.download = filename;
                                                link.click();
                                                URL.revokeObjectURL(url);
                                                toast.success('PDF généré avec succès');
                                            } catch (error) {
                                                console.error('Error generating PDF:', error);
                                                toast.error('Erreur lors de la génération du PDF');
                                            }
                                        }}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Télécharger PDF
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedDeliberation(null)}>
                                        Fermer
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
