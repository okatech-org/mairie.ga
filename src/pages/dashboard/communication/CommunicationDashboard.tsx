import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Newspaper,
    Calendar,
    Megaphone,
    Plus,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Send,
    Save,
    BarChart2,
    Image as ImageIcon,
    Clock,
    CheckCircle2,
    AlertTriangle,
    FileText
} from 'lucide-react';
import { toast } from 'sonner';

// Types pour les données de communication
interface NewsArticle {
    id: string;
    title: string;
    excerpt: string;
    content: string;
    category: string;
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
    is_urgent: boolean;
    cover_image_url?: string;
    views_count: number;
    published_at?: string;
    created_at: string;
}

interface LocalEvent {
    id: string;
    title: string;
    description: string;
    start_date: string;
    end_date?: string;
    location_name: string;
    location_address?: string;
    category: string;
    status: 'draft' | 'published' | 'cancelled';
    requires_registration: boolean;
    max_participants?: number;
    current_registrations: number;
}

interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'danger' | 'success';
    show_on_homepage: boolean;
    show_as_banner: boolean;
    starts_at: string;
    expires_at?: string;
}

// Mock data (en attendant les tables Supabase)
const mockNews: NewsArticle[] = [
    {
        id: '1',
        title: 'Ouverture du nouveau guichet unique',
        excerpt: 'Un nouveau guichet pour simplifier vos démarches',
        content: 'La mairie est heureuse de vous annoncer...',
        category: 'services',
        status: 'published',
        is_featured: true,
        is_urgent: false,
        views_count: 245,
        published_at: '2024-12-10',
        created_at: '2024-12-08'
    },
    {
        id: '2',
        title: 'Horaires spéciaux pour les fêtes',
        excerpt: 'Modification des horaires d\'ouverture',
        content: 'Durant la période des fêtes...',
        category: 'services',
        status: 'draft',
        is_featured: false,
        is_urgent: false,
        views_count: 0,
        created_at: '2024-12-05'
    },
];

const mockEvents: LocalEvent[] = [
    {
        id: '1',
        title: 'Journée portes ouvertes',
        description: 'Venez découvrir les coulisses de votre mairie',
        start_date: '2025-01-18T09:00:00',
        end_date: '2025-01-18T17:00:00',
        location_name: 'Mairie centrale',
        category: 'reunion_publique',
        status: 'published',
        requires_registration: true,
        max_participants: 200,
        current_registrations: 87
    },
];

const mockAnnouncements: Announcement[] = [
    {
        id: '1',
        title: 'Fermeture exceptionnelle',
        message: 'La mairie sera fermée le 25 décembre',
        type: 'info',
        show_on_homepage: true,
        show_as_banner: false,
        starts_at: '2024-12-20',
        expires_at: '2024-12-26'
    },
];

const NEWS_CATEGORIES = [
    { value: 'services', label: 'Services municipaux' },
    { value: 'evenements', label: 'Événements' },
    { value: 'travaux', label: 'Travaux' },
    { value: 'social', label: 'Social' },
    { value: 'culture', label: 'Culture' },
    { value: 'sport', label: 'Sport' },
    { value: 'environnement', label: 'Environnement' },
    { value: 'economie', label: 'Économie' },
    { value: 'urgence', label: 'Urgence' },
];

const EVENT_CATEGORIES = [
    { value: 'reunion_publique', label: 'Réunion publique' },
    { value: 'ceremonie', label: 'Cérémonie' },
    { value: 'sport', label: 'Sport' },
    { value: 'culture', label: 'Culture' },
    { value: 'formation', label: 'Formation' },
    { value: 'sensibilisation', label: 'Sensibilisation' },
    { value: 'marche', label: 'Marché' },
    { value: 'autre', label: 'Autre' },
];

export default function CommunicationDashboard() {
    const [activeTab, setActiveTab] = useState('actualites');
    const [news, setNews] = useState<NewsArticle[]>(mockNews);
    const [events, setEvents] = useState<LocalEvent[]>(mockEvents);
    const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);

    // Modal states
    const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Form states
    const [newsForm, setNewsForm] = useState({
        title: '',
        excerpt: '',
        content: '',
        category: 'services',
        is_featured: false,
        is_urgent: false,
    });

    const handleSaveNews = () => {
        if (!newsForm.title || !newsForm.content) {
            toast.error('Titre et contenu requis');
            return;
        }

        const newArticle: NewsArticle = {
            id: Date.now().toString(),
            ...newsForm,
            status: 'draft',
            views_count: 0,
            created_at: new Date().toISOString(),
        };

        setNews([newArticle, ...news]);
        setIsNewsModalOpen(false);
        setNewsForm({ title: '', excerpt: '', content: '', category: 'services', is_featured: false, is_urgent: false });
        toast.success('Actualité créée (brouillon)');
    };

    const handlePublishNews = (id: string) => {
        setNews(news.map(n =>
            n.id === id
                ? { ...n, status: 'published' as const, published_at: new Date().toISOString() }
                : n
        ));
        toast.success('Actualité publiée !');
    };

    const handleUnpublishNews = (id: string) => {
        setNews(news.map(n =>
            n.id === id ? { ...n, status: 'draft' as const } : n
        ));
        toast.info('Actualité dépubliée');
    };

    const handleDeleteNews = (id: string) => {
        setNews(news.filter(n => n.id !== id));
        toast.success('Actualité supprimée');
    };

    // Stats
    const stats = {
        publishedNews: news.filter(n => n.status === 'published').length,
        draftNews: news.filter(n => n.status === 'draft').length,
        totalViews: news.reduce((sum, n) => sum + n.views_count, 0),
        upcomingEvents: events.filter(e => new Date(e.start_date) > new Date()).length,
        activeAnnouncements: announcements.filter(a => !a.expires_at || new Date(a.expires_at) > new Date()).length,
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Megaphone className="h-6 w-6 text-primary" />
                    Communication
                </h1>
                <p className="text-muted-foreground">
                    Gérez les actualités, événements et annonces de votre mairie
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.publishedNews}</div>
                        <p className="text-xs text-muted-foreground">Publiées</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{stats.draftNews}</div>
                        <p className="text-xs text-muted-foreground">Brouillons</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalViews}</div>
                        <p className="text-xs text-muted-foreground">Vues totales</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.upcomingEvents}</div>
                        <p className="text-xs text-muted-foreground">Événements</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-amber-600">{stats.activeAnnouncements}</div>
                        <p className="text-xs text-muted-foreground">Annonces</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                    <TabsList>
                        <TabsTrigger value="actualites" className="gap-2">
                            <Newspaper className="h-4 w-4" />
                            Actualités
                        </TabsTrigger>
                        <TabsTrigger value="evenements" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Événements
                        </TabsTrigger>
                        <TabsTrigger value="annonces" className="gap-2">
                            <Megaphone className="h-4 w-4" />
                            Annonces
                        </TabsTrigger>
                        <TabsTrigger value="stats" className="gap-2">
                            <BarChart2 className="h-4 w-4" />
                            Statistiques
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === 'actualites' && (
                        <Dialog open={isNewsModalOpen} onOpenChange={setIsNewsModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Nouvelle actualité
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Créer une actualité</DialogTitle>
                                    <DialogDescription>
                                        Rédigez une nouvelle actualité pour votre commune
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label htmlFor="title">Titre *</Label>
                                        <Input
                                            id="title"
                                            value={newsForm.title}
                                            onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                                            placeholder="Titre de l'actualité"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="category">Catégorie</Label>
                                        <Select
                                            value={newsForm.category}
                                            onValueChange={(v) => setNewsForm({ ...newsForm, category: v })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {NEWS_CATEGORIES.map(cat => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="excerpt">Résumé</Label>
                                        <Textarea
                                            id="excerpt"
                                            value={newsForm.excerpt}
                                            onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })}
                                            placeholder="Résumé court pour les listes"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="content">Contenu *</Label>
                                        <Textarea
                                            id="content"
                                            value={newsForm.content}
                                            onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })}
                                            placeholder="Contenu complet de l'actualité..."
                                            rows={8}
                                        />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newsForm.is_featured}
                                                onChange={(e) => setNewsForm({ ...newsForm, is_featured: e.target.checked })}
                                            />
                                            <span className="text-sm">À la une</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={newsForm.is_urgent}
                                                onChange={(e) => setNewsForm({ ...newsForm, is_urgent: e.target.checked })}
                                            />
                                            <span className="text-sm">Urgent</span>
                                        </label>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsNewsModalOpen(false)}>
                                        Annuler
                                    </Button>
                                    <Button onClick={handleSaveNews} className="gap-2">
                                        <Save className="h-4 w-4" />
                                        Enregistrer (brouillon)
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Actualités Tab */}
                <TabsContent value="actualites" className="space-y-4">
                    {news.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-semibold mb-2">Aucune actualité</h3>
                                <p className="text-muted-foreground mb-4">
                                    Créez votre première actualité pour informer vos citoyens
                                </p>
                                <Button onClick={() => setIsNewsModalOpen(true)} className="gap-2">
                                    <Plus className="h-4 w-4" />
                                    Créer une actualité
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {news.map((article) => (
                                <Card key={article.id} className="hover:border-primary/30 transition-colors">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold truncate">{article.title}</h3>
                                                    {article.is_featured && (
                                                        <Badge variant="default" className="text-xs">À la une</Badge>
                                                    )}
                                                    {article.is_urgent && (
                                                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                                                    {article.excerpt || article.content.substring(0, 100)}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <FileText className="h-3 w-3" />
                                                        {NEWS_CATEGORIES.find(c => c.value === article.category)?.label}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {article.views_count} vues
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {new Date(article.created_at).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                                    {article.status === 'published' ? 'Publiée' : 'Brouillon'}
                                                </Badge>
                                                {article.status === 'draft' ? (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePublishNews(article.id)}
                                                        className="gap-1"
                                                    >
                                                        <Send className="h-3 w-3" />
                                                        Publier
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleUnpublishNews(article.id)}
                                                    >
                                                        <EyeOff className="h-3 w-3" />
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteNews(article.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Événements Tab */}
                <TabsContent value="evenements" className="space-y-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold mb-2">Gestion des événements</h3>
                            <p className="text-muted-foreground mb-4">
                                {events.length} événement(s) planifié(s)
                            </p>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Créer un événement
                            </Button>
                        </CardContent>
                    </Card>

                    {events.map(event => (
                        <Card key={event.id}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{event.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(event.start_date).toLocaleDateString('fr-FR', {
                                                dateStyle: 'long'
                                            })} • {event.location_name}
                                        </p>
                                        {event.requires_registration && (
                                            <p className="text-sm text-primary">
                                                {event.current_registrations}/{event.max_participants} inscrits
                                            </p>
                                        )}
                                    </div>
                                    <Badge>{event.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Annonces Tab */}
                <TabsContent value="annonces" className="space-y-4">
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="font-semibold mb-2">Annonces & Alertes</h3>
                            <p className="text-muted-foreground mb-4">
                                {announcements.length} annonce(s) active(s)
                            </p>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                Créer une annonce
                            </Button>
                        </CardContent>
                    </Card>

                    {announcements.map(announcement => (
                        <Card key={announcement.id} className={`border-l-4 ${announcement.type === 'danger' ? 'border-l-red-500' :
                                announcement.type === 'warning' ? 'border-l-amber-500' :
                                    announcement.type === 'success' ? 'border-l-green-500' :
                                        'border-l-blue-500'
                            }`}>
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold">{announcement.title}</h3>
                                        <p className="text-sm text-muted-foreground">{announcement.message}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {announcement.show_as_banner && (
                                            <Badge variant="outline">Bannière</Badge>
                                        )}
                                        <Badge>{announcement.type}</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats">
                    <Card>
                        <CardHeader>
                            <CardTitle>Statistiques de communication</CardTitle>
                            <CardDescription>
                                Aperçu de l'engagement avec vos publications
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="text-center p-6 bg-muted/50 rounded-lg">
                                    <div className="text-4xl font-bold text-primary mb-2">{stats.totalViews}</div>
                                    <p className="text-muted-foreground">Vues totales</p>
                                </div>
                                <div className="text-center p-6 bg-muted/50 rounded-lg">
                                    <div className="text-4xl font-bold text-green-600 mb-2">{stats.publishedNews}</div>
                                    <p className="text-muted-foreground">Actualités publiées</p>
                                </div>
                                <div className="text-center p-6 bg-muted/50 rounded-lg">
                                    <div className="text-4xl font-bold text-purple-600 mb-2">{stats.upcomingEvents}</div>
                                    <p className="text-muted-foreground">Événements à venir</p>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-medium text-amber-800 dark:text-amber-200">
                                            Statistiques en temps réel disponibles après la Phase 1
                                        </p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300">
                                            Les tables Supabase permettront de suivre les vues, l'engagement et les inscriptions en temps réel.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
