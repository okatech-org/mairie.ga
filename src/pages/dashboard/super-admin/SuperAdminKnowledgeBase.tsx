import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
    BookOpen,
    Search,
    Plus,
    Eye,
    Pencil,
    Trash2,
    FileText,
    Globe,
    Archive,
    Loader2,
    Tags,
    BarChart3,
    ThumbsUp,
    Sparkles,
    Database,
    XCircle,
    History,
    CheckCircle,
    AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
    knowledgeBaseService,
    KBArticle,
    KBStatus
} from "@/services/knowledge-base-service";

const categoryLabels: Record<string, string> = {
    'procedures': 'Procédures',
    'faq': 'FAQ',
    'legal': 'Juridique',
    'technical': 'Technique',
    'services': 'Services',
    'general': 'Général'
};

const categoryColors: Record<string, string> = {
    'procedures': 'bg-blue-500/10 text-blue-600',
    'faq': 'bg-purple-500/10 text-purple-600',
    'legal': 'bg-amber-500/10 text-amber-600',
    'technical': 'bg-cyan-500/10 text-cyan-600',
    'services': 'bg-green-500/10 text-green-600',
    'general': 'bg-gray-500/10 text-gray-600'
};

const statusConfig: Record<KBStatus, { label: string; color: string; icon: React.ElementType }> = {
    'DRAFT': { label: 'Brouillon', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: FileText },
    'PUBLISHED': { label: 'Publié', color: 'bg-green-500/10 text-green-600 border-green-500/20', icon: Globe },
    'ARCHIVED': { label: 'Archivé', color: 'bg-gray-500/10 text-gray-600 border-gray-500/20', icon: Archive }
};

interface ArticleForm {
    title: string;
    content: string;
    category: string;
    subcategory: string;
    tags: string[];
    status: KBStatus;
}

interface EmbeddingProgress {
    current: number;
    total: number;
    articleTitle?: string;
    status?: 'success' | 'failed';
    error?: string;
}

interface EmbeddingHistoryEntry {
    id: string;
    timestamp: Date;
    processed: number;
    failed: number;
    total: number;
    status: 'completed' | 'cancelled' | 'error';
}

export default function SuperAdminKnowledgeBase() {
    const [articles, setArticles] = useState<KBArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [generatingEmbeddings, setGeneratingEmbeddings] = useState(false);
    const [generatingArticleId, setGeneratingArticleId] = useState<string | null>(null);
    const [embeddingStats, setEmbeddingStats] = useState({ withEmbedding: 0, withoutEmbedding: 0 });
    
    // New states for progress tracking and cancellation
    const [embeddingProgress, setEmbeddingProgress] = useState<EmbeddingProgress | null>(null);
    const [embeddingHistory, setEmbeddingHistory] = useState<EmbeddingHistoryEntry[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [formData, setFormData] = useState<ArticleForm>({
        title: '',
        content: '',
        category: 'general',
        subcategory: '',
        tags: [],
        status: 'DRAFT'
    });

    useEffect(() => {
        loadArticles();
        loadEmbeddingStats();
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        const data = await knowledgeBaseService.getAll();
        setArticles(data);
        setLoading(false);
    };

    const loadEmbeddingStats = async () => {
        try {
            // Count articles with embeddings
            const { count: withCount, error: withError } = await supabase
                .from('knowledge_base')
                .select('*', { count: 'exact', head: true })
                .not('embedding', 'is', null);

            // Count articles without embeddings
            const { count: withoutCount, error: withoutError } = await supabase
                .from('knowledge_base')
                .select('*', { count: 'exact', head: true })
                .is('embedding', null);

            if (!withError && !withoutError) {
                setEmbeddingStats({
                    withEmbedding: withCount || 0,
                    withoutEmbedding: withoutCount || 0
                });
            }
        } catch (err) {
            console.error('Error loading embedding stats:', err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: '',
            content: '',
            category: 'general',
            subcategory: '',
            tags: [],
            status: 'DRAFT'
        });
        setEditingArticle(null);
    };

    const handleOpenDialog = (article?: KBArticle) => {
        if (article) {
            setEditingArticle(article);
            setFormData({
                title: article.title,
                content: article.content,
                category: article.category,
                subcategory: article.subcategory || '',
                tags: article.tags || [],
                status: article.status
            });
        } else {
            resetForm();
        }
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.content || !formData.category) {
            toast.error("Veuillez remplir tous les champs obligatoires");
            return;
        }

        setSubmitting(true);

        try {
            if (editingArticle) {
                await knowledgeBaseService.update(editingArticle.id, formData);
                toast.success("Article mis à jour");
            } else {
                await knowledgeBaseService.create({
                    ...formData,
                    metadata: {}
                });
                toast.success("Article créé avec succès");
            }
            setIsDialogOpen(false);
            resetForm();
            loadArticles();
        } catch (err) {
            toast.error("Erreur lors de l'opération");
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Êtes-vous sûr de vouloir supprimer cet article ?")) return;

        try {
            await knowledgeBaseService.delete(id);
            toast.success("Article supprimé");
            loadArticles();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        }
    };

    const handlePublish = async (article: KBArticle) => {
        const newStatus: KBStatus = article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
        try {
            await knowledgeBaseService.update(article.id, { status: newStatus });
            toast.success(newStatus === 'PUBLISHED' ? "Article publié" : "Article dépublié");
            loadArticles();
        } catch (err) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const filteredArticles = articles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTab = activeTab === 'all' || 
            a.status === activeTab || 
            a.category === activeTab ||
            (activeTab === 'no-embedding' && !a.hasEmbedding) ||
            (activeTab === 'with-embedding' && a.hasEmbedding);
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'PUBLISHED').length,
        drafts: articles.filter(a => a.status === 'DRAFT').length,
        totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0),
        withEmbeddings: 0 // Will be calculated from DB
    };

    const handleCancelGeneration = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            
            // Add cancelled entry to history
            if (embeddingProgress) {
                const historyEntry: EmbeddingHistoryEntry = {
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    processed: embeddingProgress.current,
                    failed: 0,
                    total: embeddingProgress.total,
                    status: 'cancelled'
                };
                setEmbeddingHistory(prev => [historyEntry, ...prev].slice(0, 10));
            }
            
            setGeneratingEmbeddings(false);
            setEmbeddingProgress(null);
            toast.info("Génération des embeddings annulée");
        }
    };

    const handleGenerateEmbeddings = async (regenerateAll = false) => {
        setGeneratingEmbeddings(true);
        setEmbeddingProgress({ current: 0, total: 0 });
        
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;
        
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
            
            const response = await fetch(`${supabaseUrl}/functions/v1/generate-kb-embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    regenerateAll,
                    onlyMissing: !regenerateAll,
                    stream: true
                }),
                signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('No response body');
            }

            let finalResult: { processed: number; failed: number; total: number } | null = null;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    try {
                        const data = JSON.parse(line.replace('data: ', ''));
                        
                        if (data.type === 'start') {
                            setEmbeddingProgress({ current: 0, total: data.total });
                        } else if (data.type === 'progress') {
                            setEmbeddingProgress({
                                current: data.current,
                                total: data.total,
                                articleTitle: data.articleTitle,
                                status: data.status,
                                error: data.error
                            });
                        } else if (data.type === 'complete') {
                            finalResult = {
                                processed: data.processed,
                                failed: data.failed,
                                total: data.total
                            };
                        }
                    } catch (e) {
                        console.error('Error parsing SSE data:', e);
                    }
                }
            }

            if (finalResult) {
                const historyEntry: EmbeddingHistoryEntry = {
                    id: crypto.randomUUID(),
                    timestamp: new Date(),
                    processed: finalResult.processed,
                    failed: finalResult.failed,
                    total: finalResult.total,
                    status: 'completed'
                };
                setEmbeddingHistory(prev => [historyEntry, ...prev].slice(0, 10));
                
                toast.success(`Embeddings générés: ${finalResult.processed} articles traités, ${finalResult.failed} échecs`);
                loadEmbeddingStats();
                loadArticles();
            }
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                // Cancellation handled in handleCancelGeneration
                return;
            }
            console.error('Error calling generate-kb-embeddings:', err);
            toast.error("Erreur lors de l'appel à la fonction");
            
            // Add error entry to history
            const historyEntry: EmbeddingHistoryEntry = {
                id: crypto.randomUUID(),
                timestamp: new Date(),
                processed: embeddingProgress?.current || 0,
                failed: 0,
                total: embeddingProgress?.total || 0,
                status: 'error'
            };
            setEmbeddingHistory(prev => [historyEntry, ...prev].slice(0, 10));
        } finally {
            setGeneratingEmbeddings(false);
            setEmbeddingProgress(null);
            abortControllerRef.current = null;
        }
    };

    const handleGenerateArticleEmbedding = async (articleId: string) => {
        setGeneratingArticleId(articleId);
        try {
            const { data, error } = await supabase.functions.invoke('generate-kb-embeddings', {
                body: { articleId }
            });

            if (error) {
                console.error('Error generating embedding:', error);
                toast.error("Erreur lors de la génération de l'embedding");
                return;
            }

            if (data?.success) {
                toast.success("Embedding généré avec succès");
                loadArticles();
                loadEmbeddingStats();
            } else {
                toast.error(data?.error || "Erreur inconnue");
            }
        } catch (err) {
            console.error('Error calling generate-kb-embeddings:', err);
            toast.error("Erreur lors de l'appel à la fonction");
        } finally {
            setGeneratingArticleId(null);
        }
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
                        Base de Connaissances
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Gérez les articles et la documentation pour iAsted
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        className="gap-2" 
                        onClick={() => setShowHistory(!showHistory)}
                    >
                        <History className="h-4 w-4" />
                        Historique
                    </Button>
                    <Button 
                        variant="outline" 
                        className="gap-2" 
                        onClick={() => handleGenerateEmbeddings(false)}
                        disabled={generatingEmbeddings}
                    >
                        {generatingEmbeddings ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Générer embeddings
                    </Button>
                    <Button className="gap-2" onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4" />
                        Nouvel article
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary/10">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.total}</p>
                                <p className="text-sm text-muted-foreground">Total articles</p>
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
                                <p className="text-2xl font-bold">{stats.published}</p>
                                <p className="text-sm text-muted-foreground">Publiés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-yellow-500/10">
                                <FileText className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.drafts}</p>
                                <p className="text-sm text-muted-foreground">Brouillons</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-blue-500/10">
                                <BarChart3 className="h-6 w-6 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{stats.totalViews}</p>
                                <p className="text-sm text-muted-foreground">Vues totales</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-emerald-500/10">
                                <Sparkles className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{embeddingStats.withEmbedding}</p>
                                <p className="text-sm text-muted-foreground">Avec embedding</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="neu-card border-none">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-orange-500/10">
                                <Database className="h-6 w-6 text-orange-500" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{embeddingStats.withoutEmbedding}</p>
                                <p className="text-sm text-muted-foreground">Sans embedding</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher un article..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="flex-wrap">
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="PUBLISHED">Publiés</TabsTrigger>
                        <TabsTrigger value="DRAFT">Brouillons</TabsTrigger>
                        <TabsTrigger value="no-embedding" className="text-orange-600">
                            Sans embedding
                        </TabsTrigger>
                        <TabsTrigger value="with-embedding" className="text-emerald-600">
                            Avec embedding
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* Progress bar for bulk embedding generation */}
            {generatingEmbeddings && embeddingProgress && (
                <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4 pb-4">
                        <div className="flex items-center gap-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary flex-shrink-0" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-medium">
                                        Génération des embeddings en cours...
                                        <span className="ml-2 text-primary font-bold">
                                            {embeddingProgress.current} / {embeddingProgress.total}
                                        </span>
                                    </p>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={handleCancelGeneration}
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Annuler
                                    </Button>
                                </div>
                                <Progress 
                                    value={embeddingProgress.total > 0 ? (embeddingProgress.current / embeddingProgress.total) * 100 : 0} 
                                    className="h-2" 
                                />
                                {embeddingProgress.articleTitle && (
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        {embeddingProgress.status === 'success' ? (
                                            <CheckCircle className="h-3 w-3 text-emerald-500" />
                                        ) : embeddingProgress.status === 'failed' ? (
                                            <AlertCircle className="h-3 w-3 text-destructive" />
                                        ) : null}
                                        {embeddingProgress.articleTitle}
                                        {embeddingProgress.error && (
                                            <span className="text-destructive ml-1">- {embeddingProgress.error}</span>
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Embedding History */}
            {showHistory && embeddingHistory.length > 0 && (
                <Card className="border-muted">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <History className="h-4 w-4" />
                            Historique des générations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {embeddingHistory.map((entry) => (
                                <div 
                                    key={entry.id} 
                                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm"
                                >
                                    <div className="flex items-center gap-3">
                                        {entry.status === 'completed' ? (
                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        ) : entry.status === 'cancelled' ? (
                                            <XCircle className="h-4 w-4 text-amber-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-destructive" />
                                        )}
                                        <span className="text-muted-foreground">
                                            {format(entry.timestamp, "d MMM yyyy 'à' HH:mm", { locale: fr })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant="outline" className={
                                            entry.status === 'completed' 
                                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                : entry.status === 'cancelled'
                                                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                    : "bg-destructive/10 text-destructive border-destructive/20"
                                        }>
                                            {entry.status === 'completed' ? 'Terminé' : entry.status === 'cancelled' ? 'Annulé' : 'Erreur'}
                                        </Badge>
                                        <span className="text-muted-foreground">
                                            {entry.processed}/{entry.total} traités
                                        </span>
                                        {entry.failed > 0 && (
                                            <span className="text-destructive">
                                                {entry.failed} échecs
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {showHistory && embeddingHistory.length === 0 && (
                <Card className="border-muted">
                    <CardContent className="pt-6 pb-6 text-center text-muted-foreground">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Aucun historique de génération</p>
                    </CardContent>
                </Card>
            )}

            {/* Articles List */}
            <Card className="neu-card border-none">
                <CardHeader>
                    <CardTitle className="text-lg">Articles</CardTitle>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-[500px]">
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Aucun article trouvé</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredArticles.map((article) => {
                                    const StatusIcon = statusConfig[article.status]?.icon || FileText;
                                    return (
                                        <div
                                            key={article.id}
                                            className="p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={categoryColors[article.category] || categoryColors.general}>
                                                            {categoryLabels[article.category] || article.category}
                                                        </Badge>
                                                        <Badge variant="outline" className={statusConfig[article.status]?.color}>
                                                            <StatusIcon className="h-3 w-3 mr-1" />
                                                            {statusConfig[article.status]?.label}
                                                        </Badge>
                                                        {article.hasEmbedding ? (
                                                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                                <Sparkles className="h-3 w-3 mr-1" />
                                                                Indexé
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/20">
                                                                <Database className="h-3 w-3 mr-1" />
                                                                Non indexé
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="font-semibold">{article.title}</h3>
                                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                        {article.content}
                                                    </p>
                                                    <div className="flex items-center flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="h-3 w-3" />
                                                            {article.viewCount || 0} vues
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ThumbsUp className="h-3 w-3" />
                                                            {article.helpfulCount || 0} utile
                                                        </span>
                                                        {article.tags && article.tags.length > 0 && (
                                                            <span className="flex items-center gap-1">
                                                                <Tags className="h-3 w-3" />
                                                                {article.tags.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="ghost"
                                                                    onClick={() => handleGenerateArticleEmbedding(article.id)}
                                                                    disabled={generatingArticleId === article.id}
                                                                    className={article.hasEmbedding ? "text-emerald-600 hover:text-emerald-700" : "text-orange-600 hover:text-orange-700"}
                                                                >
                                                                    {generatingArticleId === article.id ? (
                                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                                    ) : (
                                                                        <Sparkles className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {article.hasEmbedding ? (
                                                                    <p>Article indexé - Cliquer pour régénérer l'embedding</p>
                                                                ) : (
                                                                    <p>Article non indexé - Cliquer pour générer l'embedding</p>
                                                                )}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => handlePublish(article)}
                                                    >
                                                        {article.status === 'PUBLISHED' ? 'Dépublier' : 'Publier'}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost"
                                                        onClick={() => handleOpenDialog(article)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost"
                                                        className="text-destructive"
                                                        onClick={() => handleDelete(article.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
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
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingArticle ? 'Modifier l\'article' : 'Créer un nouvel article'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Catégorie *</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(v) => setFormData({ ...formData, category: v })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categoryLabels).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>{label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Sous-catégorie</Label>
                                <Input
                                    value={formData.subcategory}
                                    onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                    placeholder="Ex: Passeport, Visa..."
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Titre *</Label>
                            <Input
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Titre de l'article..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Contenu *</Label>
                            <MarkdownEditor
                                value={formData.content}
                                onChange={(content) => setFormData({ ...formData, content })}
                                placeholder="# Guide

Rédigez le contenu de l'article en Markdown...

## Section 1

Description de la procédure...

## Section 2

- Point 1
- Point 2"
                                minHeight="300px"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Tags (séparés par des virgules)</Label>
                            <Input
                                value={formData.tags.join(', ')}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                                })}
                                placeholder="passeport, renouvellement, documents..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(v) => setFormData({ ...formData, status: v as KBStatus })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DRAFT">Brouillon</SelectItem>
                                    <SelectItem value="PUBLISHED">Publié</SelectItem>
                                    <SelectItem value="ARCHIVED">Archivé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={submitting}>
                            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {editingArticle ? 'Mettre à jour' : 'Créer l\'article'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
