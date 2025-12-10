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
import MarkdownEditor from "@/components/editor/MarkdownEditor";
import { toast } from "sonner";
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
    ThumbsUp
} from "lucide-react";
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

export default function SuperAdminKnowledgeBase() {
    const [articles, setArticles] = useState<KBArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<KBArticle | null>(null);
    const [submitting, setSubmitting] = useState(false);

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
    }, []);

    const loadArticles = async () => {
        setLoading(true);
        const data = await knowledgeBaseService.getAll();
        setArticles(data);
        setLoading(false);
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
        const matchesTab = activeTab === 'all' || a.status === activeTab || a.category === activeTab;
        return matchesSearch && matchesTab;
    });

    const stats = {
        total: articles.length,
        published: articles.filter(a => a.status === 'PUBLISHED').length,
        drafts: articles.filter(a => a.status === 'DRAFT').length,
        totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)
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
                <Button className="gap-2" onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4" />
                    Nouvel article
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <TabsList>
                        <TabsTrigger value="all">Tous</TabsTrigger>
                        <TabsTrigger value="PUBLISHED">Publiés</TabsTrigger>
                        <TabsTrigger value="DRAFT">Brouillons</TabsTrigger>
                        <TabsTrigger value="procedures">Procédures</TabsTrigger>
                        <TabsTrigger value="faq">FAQ</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

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
