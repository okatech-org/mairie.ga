import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
    FolderOpen, FolderClosed, FileText, ArrowLeft, Search, Plus,
    Clock, Paperclip, Building2, MessageSquare, Download, Eye,
    MoreVertical, Filter, X, Send, CheckCircle, AlertCircle,
    Loader2, Upload, Trash2, Edit, Archive, SortAsc, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { getCorrespondanceFolders, generateDocumentPDF, type MockFolder, type MockDocument } from '@/services/mockDocumentService';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import {
    CORRESPONDANCE_TYPES,
    ORGANIZATIONS,
    getOrganizationContacts,
    searchCorrespondanceTypes,
    searchOrganizations,
} from '@/data/correspondanceData';

// Types (aliased from service)
type CorrespondanceDocument = MockDocument;
type CorrespondanceFolder = MockFolder;

type FilterType = 'all' | 'unread' | 'urgent' | 'pending' | 'archived';
type SortType = 'date_desc' | 'date_asc' | 'name' | 'sender';

const DOC_TYPE_ICON: Record<string, { color: string; label: string }> = {
    pdf: { color: 'text-red-500', label: 'PDF' },
    doc: { color: 'text-blue-500', label: 'DOC' },
    image: { color: 'text-green-500', label: 'IMG' },
    other: { color: 'text-gray-500', label: 'FILE' },
};

// Skeleton component for loading state
const FolderSkeleton = () => (
    <div className="animate-pulse">
        <Card className="neu-card border-none">
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="w-14 h-12 rounded-lg bg-muted"></div>
                    <div className="w-16 h-5 rounded bg-muted"></div>
                </div>
                <div className="h-4 w-3/4 bg-muted rounded mb-2"></div>
                <div className="h-3 w-1/2 bg-muted rounded mb-3"></div>
                <div className="flex justify-between pt-2 border-t">
                    <div className="h-3 w-16 bg-muted rounded"></div>
                    <div className="h-3 w-16 bg-muted rounded"></div>
                </div>
            </CardContent>
        </Card>
    </div>
);

export default function CorrespondancePage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // State
    const [folders, setFolders] = useState<CorrespondanceFolder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<CorrespondanceFolder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [sortBy, setSortBy] = useState<SortType>('date_desc');
    const [isLoading, setIsLoading] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Modal states
    const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewDocument, setPreviewDocument] = useState<CorrespondanceDocument | null>(null);

    // New folder form
    const [newFolderData, setNewFolderData] = useState({
        name: '',
        recipientOrg: '',
        recipientName: '',
        comment: '',
        isUrgent: false,
    });
    const [newFolderDocs, setNewFolderDocs] = useState<CorrespondanceDocument[]>([]);
    const [selectedOrgId, setSelectedOrgId] = useState<string>('');

    // Computed options for comboboxes
    const correspondanceTypeOptions: ComboboxOption[] = CORRESPONDANCE_TYPES.map(type => ({
        value: type.name,
        label: type.name,
        category: type.category,
    }));

    const organizationOptions: ComboboxOption[] = ORGANIZATIONS.map(org => ({
        value: org.id,
        label: org.name,
        category: org.category,
        description: org.address,
    }));

    const contactOptions: ComboboxOption[] = useMemo(() => {
        if (!selectedOrgId) return [];
        const contacts = getOrganizationContacts(selectedOrgId);
        return contacts.map(contact => ({
            value: contact.name,
            label: contact.name,
            description: contact.role,
        }));
    }, [selectedOrgId]);

    // Handler for organization selection
    const handleOrganizationChange = (orgId: string) => {
        setSelectedOrgId(orgId);
        const org = ORGANIZATIONS.find(o => o.id === orgId);
        if (org) {
            setNewFolderData(prev => ({
                ...prev,
                recipientOrg: org.name,
                recipientName: '', // Reset contact when org changes
            }));
        } else {
            setNewFolderData(prev => ({
                ...prev,
                recipientOrg: orgId, // Custom value
                recipientName: '',
            }));
        }
    };

    // Handle document from iAsted navigation
    useEffect(() => {
        const state = location.state as { newCorrespondance?: boolean; document?: any } | null;

        if (state?.newCorrespondance && state?.document) {
            console.log('📨 [CorrespondancePage] Document reçu depuis iAsted:', state.document);

            setIsNewFolderOpen(true);
            setNewFolderData(prev => ({
                ...prev,
                name: `Envoi: ${state.document.name}`,
            }));
            setNewFolderDocs([{
                id: `doc-${Date.now()}`,
                name: state.document.name,
                type: state.document.type?.includes('pdf') ? 'pdf' :
                    state.document.type?.includes('doc') ? 'doc' : 'other',
                size: state.document.size || 'N/A',
                date: new Date().toISOString().split('T')[0],
                url: state.document.url,
            }]);

            window.history.replaceState({}, document.title);

            toast({
                title: "📎 Document attaché",
                description: `${state.document.name} est prêt à être envoyé`,
            });
        }
    }, [location.state, toast]);

    // Charger les documents (sans génération PDF - instantané)
    useEffect(() => {
        const loadDocuments = async () => {
            setIsInitialLoading(true);
            setError(null);

            try {
                console.log('📂 [CorrespondancePage] Chargement des métadonnées...');
                const realFolders = await getCorrespondanceFolders();
                setFolders(realFolders);
                console.log('✅ [CorrespondancePage] Métadonnées chargées:', realFolders.length, 'dossiers');
            } catch (err: any) {
                console.error('❌ [CorrespondancePage] Erreur chargement:', err);
                setError('Erreur lors du chargement des documents');
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les documents",
                    variant: "destructive",
                });
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadDocuments();
    }, [toast]);

    // Computed values avec tri
    const filteredAndSortedFolders = folders
        .filter(folder => {
            const matchesSearch = folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                folder.sender.organization.toLowerCase().includes(searchTerm.toLowerCase());

            switch (filter) {
                case 'unread': return matchesSearch && !folder.isRead;
                case 'urgent': return matchesSearch && folder.isUrgent;
                case 'pending': return matchesSearch && folder.status === 'pending';
                case 'archived': return matchesSearch && folder.status === 'archived';
                default: return matchesSearch;
            }
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'date_asc': return new Date(a.date).getTime() - new Date(b.date).getTime();
                case 'date_desc': return new Date(b.date).getTime() - new Date(a.date).getTime();
                case 'name': return a.name.localeCompare(b.name);
                case 'sender': return a.sender.organization.localeCompare(b.sender.organization);
                default: return 0;
            }
        });

    const unreadCount = folders.filter(f => !f.isRead).length;
    const urgentCount = folders.filter(f => f.isUrgent && !f.isRead).length;

    // Handlers
    const handleSelectFolder = async (folder: CorrespondanceFolder) => {
        setIsLoading(true);
        setError(null);

        try {
            // Marquer comme lu
            if (!folder.isRead) {
                setFolders(prev => prev.map(f =>
                    f.id === folder.id ? { ...f, isRead: true } : f
                ));
            }

            setSelectedFolder(folder);

        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement');
            toast({
                title: "Erreur",
                description: "Impossible de charger le dossier",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // LAZY PDF GENERATION - Génère le PDF uniquement quand on le consulte
    const handleViewDocument = async (doc: CorrespondanceDocument) => {
        setIsGeneratingPDF(true);

        try {
            // Générer le PDF à la demande si pas encore généré
            if (!doc.url && doc.generatorType) {
                console.log('📄 [CorrespondancePage] Génération PDF à la demande:', doc.name);
                const result = await generateDocumentPDF(doc);
                doc.url = result.url;
                doc.blob = result.blob;
            }

            setPreviewDocument(doc);
            setIsPreviewOpen(true);

            toast({
                title: "📄 Prévisualisation",
                description: `${doc.name} prêt`,
            });
        } catch (err: any) {
            console.error('❌ Erreur génération PDF:', err);
            toast({
                title: "Erreur",
                description: "Impossible de générer le document",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleDownloadDocument = async (doc: CorrespondanceDocument) => {
        setIsGeneratingPDF(true);

        try {
            // Générer le PDF à la demande si pas encore généré
            if (!doc.url && doc.generatorType) {
                console.log('📄 [CorrespondancePage] Génération PDF pour téléchargement:', doc.name);
                const result = await generateDocumentPDF(doc);
                doc.url = result.url;
                doc.blob = result.blob;
            }

            if (doc.url) {
                const response = await fetch(doc.url);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.name;
                a.click();
                URL.revokeObjectURL(url);
            }

            toast({
                title: "✅ Téléchargement",
                description: `${doc.name} téléchargé`,
            });
        } catch (err: any) {
            toast({
                title: "Erreur",
                description: "Échec du téléchargement",
                variant: "destructive",
            });
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleCreateFolder = async () => {
        // Validation
        if (!newFolderData.name.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez saisir un nom pour le dossier",
                variant: "destructive",
            });
            return;
        }

        if (!newFolderData.recipientOrg.trim()) {
            toast({
                title: "Erreur",
                description: "Veuillez saisir le destinataire",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Create new folder
            const newFolder: CorrespondanceFolder = {
                id: `folder-${Date.now()}`,
                name: newFolderData.name,
                sender: {
                    name: newFolderData.recipientName || 'Non spécifié',
                    organization: newFolderData.recipientOrg,
                },
                date: new Date().toISOString().split('T')[0],
                comment: newFolderData.comment || 'Aucun commentaire',
                documents: newFolderDocs,
                isUrgent: newFolderData.isUrgent,
                isRead: true,
                status: 'draft',
            };

            setFolders(prev => [newFolder, ...prev]);

            // Reset form
            setNewFolderData({
                name: '',
                recipientOrg: '',
                recipientName: '',
                comment: '',
                isUrgent: false,
            });
            setNewFolderDocs([]);
            setIsNewFolderOpen(false);

            toast({
                title: "✅ Dossier créé",
                description: `${newFolder.name} ajouté avec succès`,
            });

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: err.message || "Impossible de créer le dossier",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendCorrespondance = async (folder: CorrespondanceFolder) => {
        setIsLoading(true);

        try {
            // Simulate sending
            await new Promise(resolve => setTimeout(resolve, 1000));

            setFolders(prev => prev.map(f =>
                f.id === folder.id ? { ...f, status: 'sent' } : f
            ));

            toast({
                title: "📨 Envoyé",
                description: `Correspondance envoyée à ${folder.sender.organization}`,
            });

            setSelectedFolder(null);

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: "Échec de l'envoi",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleArchiveFolder = async (folder: CorrespondanceFolder) => {
        setIsLoading(true);

        try {
            setFolders(prev => prev.map(f =>
                f.id === folder.id ? { ...f, status: 'archived' } : f
            ));

            toast({
                title: "📦 Archivé",
                description: `${folder.name} déplacé vers les archives`,
            });

            setSelectedFolder(null);

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: "Échec de l'archivage",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteFolder = async (folder: CorrespondanceFolder) => {
        if (!confirm(`Supprimer "${folder.name}" ?`)) return;

        setIsLoading(true);

        try {
            setFolders(prev => prev.filter(f => f.id !== folder.id));

            toast({
                title: "🗑️ Supprimé",
                description: `${folder.name} supprimé`,
            });

            setSelectedFolder(null);

        } catch (err: any) {
            toast({
                title: "Erreur",
                description: "Échec de la suppression",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newDocs: CorrespondanceDocument[] = Array.from(files).map(file => ({
            id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            type: file.type.includes('pdf') ? 'pdf' :
                file.type.includes('doc') ? 'doc' :
                    file.type.includes('image') ? 'image' : 'other',
            size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            date: new Date().toISOString().split('T')[0],
            url: URL.createObjectURL(file),
        }));

        setNewFolderDocs(prev => [...prev, ...newDocs]);
    };

    const removeDocument = (docId: string) => {
        setNewFolderDocs(prev => prev.filter(d => d.id !== docId));
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden rounded-2xl neu-card border-none shadow-inner bg-muted/30">
                {/* 3-Pane Layout Content */}
                <div className="flex-1 flex min-h-0">

                    {/* Pane 1: Sidebar */}
                    <div className="hidden md:flex w-48 flex-col border-r bg-background/30 p-3 gap-3">
                        <div className="flex flex-col gap-2">
                            <Button
                                className="w-full gap-2 neu-raised hover:translate-y-[-2px] transition-transform text-primary font-bold text-sm"
                                onClick={() => setIsNewFolderOpen(true)}
                            >
                                <Plus className="w-4 h-4" />
                                <span className="truncate">Nouveau</span>
                            </Button>
                        </div>
                        <MailSidebar
                            currentFolder=""
                            onSelectFolder={(folder) => navigate(`/messaging?folder=${folder}`)}
                            unreadCount={unreadCount}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col min-w-0">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b bg-background/50 backdrop-blur-sm shrink-0">
                            <div className="flex items-center gap-3">
                                {selectedFolder ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedFolder(null)}
                                        className="gap-2"
                                        disabled={isLoading}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour aux dossiers
                                    </Button>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 rounded-xl neu-raised flex items-center justify-center">
                                            <FolderOpen className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <h1 className="text-lg font-bold">Correspondance</h1>
                                            <p className="text-xs text-muted-foreground">
                                                {folders.length} dossier{folders.length > 1 ? 's' : ''} •
                                                {unreadCount > 0 && <span className="text-primary font-medium"> {unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
                                                {urgentCount > 0 && <span className="text-destructive font-medium ml-1">• {urgentCount} urgent{urgentCount > 1 ? 's' : ''}</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {/* Search */}
                                <div className="relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-9 w-48 bg-background/50"
                                    />
                                    {searchTerm && (
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <X className="w-3 h-3" />
                                        </Button>
                                    )}
                                </div>

                                {/* Filter Dropdown */}
                                <Select value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
                                    <SelectTrigger className="w-32 h-9">
                                        <Filter className="w-4 h-4 mr-2" />
                                        <SelectValue placeholder="Filtrer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous</SelectItem>
                                        <SelectItem value="unread">Non lus</SelectItem>
                                        <SelectItem value="urgent">Urgents</SelectItem>
                                        <SelectItem value="pending">En attente</SelectItem>
                                        <SelectItem value="archived">Archivés</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Button
                                    className="gap-2 neu-raised"
                                    onClick={() => setIsNewFolderOpen(true)}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Plus className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">Nouveau Dossier</span>
                                </Button>
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="mx-4 mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm">{error}</span>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="ml-auto"
                                    onClick={() => setError(null)}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
                            {/* Loading Overlay */}
                            {isLoading && !selectedFolder && (
                                <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            )}

                            <AnimatePresence mode="wait">
                                {selectedFolder ? (
                                    // Document View (inside folder)
                                    <motion.div
                                        key="documents"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-4"
                                    >
                                        {/* Folder Header */}
                                        <Card className="neu-card border-l-4 border-l-primary">
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h2 className="text-lg font-bold mb-1">{selectedFolder.name}</h2>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Building2 className="w-4 h-4" />
                                                            <span>{selectedFolder.sender.organization}</span>
                                                            <span>•</span>
                                                            <Clock className="w-4 h-4" />
                                                            <span>{new Date(selectedFolder.date).toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {selectedFolder.isUrgent && (
                                                            <Badge variant="destructive">URGENT</Badge>
                                                        )}
                                                        {selectedFolder.status && (
                                                            <Badge variant={
                                                                selectedFolder.status === 'sent' ? 'default' :
                                                                    selectedFolder.status === 'archived' ? 'secondary' :
                                                                        selectedFolder.status === 'pending' ? 'outline' : 'outline'
                                                            }>
                                                                {selectedFolder.status === 'sent' ? 'Envoyé' :
                                                                    selectedFolder.status === 'archived' ? 'Archivé' :
                                                                        selectedFolder.status === 'pending' ? 'En attente' : 'Brouillon'}
                                                            </Badge>
                                                        )}

                                                        {/* Actions Menu */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {selectedFolder.status !== 'sent' && (
                                                                    <DropdownMenuItem onClick={() => handleSendCorrespondance(selectedFolder)}>
                                                                        <Send className="w-4 h-4 mr-2" />
                                                                        Envoyer
                                                                    </DropdownMenuItem>
                                                                )}
                                                                <DropdownMenuItem onClick={() => handleArchiveFolder(selectedFolder)}>
                                                                    <Archive className="w-4 h-4 mr-2" />
                                                                    Archiver
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive"
                                                                    onClick={() => handleDeleteFolder(selectedFolder)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Supprimer
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>

                                                {/* Comment */}
                                                <div className="bg-muted/50 rounded-lg p-3 flex items-start gap-2">
                                                    <MessageSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                                                    <p className="text-sm italic">"{selectedFolder.comment}"</p>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Documents Grid */}
                                        <div>
                                            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                <Paperclip className="w-4 h-4" />
                                                {selectedFolder.documents.length} Document{selectedFolder.documents.length > 1 ? 's' : ''}
                                            </h3>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                                {selectedFolder.documents.map((doc, index) => {
                                                    const docType = DOC_TYPE_ICON[doc.type] || DOC_TYPE_ICON.other;

                                                    return (
                                                        <motion.div
                                                            key={doc.id}
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: index * 0.05 }}
                                                        >
                                                            <Card className="group cursor-pointer hover:shadow-lg transition-all hover:-translate-y-1 overflow-hidden">
                                                                <CardContent className="p-0">
                                                                    {/* A4 Preview */}
                                                                    <div className="aspect-[3/4] bg-gradient-to-br from-white to-gray-100 dark:from-gray-800 dark:to-gray-900 relative flex flex-col items-center justify-center border-b">
                                                                        {/* Simulated A4 lines */}
                                                                        <div className="absolute inset-4 space-y-1.5 opacity-20">
                                                                            {[...Array(8)].map((_, i) => (
                                                                                <div
                                                                                    key={i}
                                                                                    className="h-1 bg-current rounded"
                                                                                    style={{ width: `${60 + Math.random() * 30}%` }}
                                                                                />
                                                                            ))}
                                                                        </div>

                                                                        {/* Type badge */}
                                                                        <FileText className={cn("w-10 h-10", docType.color)} />
                                                                        <span className={cn("text-[10px] font-bold mt-1", docType.color)}>
                                                                            {docType.label}
                                                                        </span>

                                                                        {/* Hover overlay */}
                                                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                                            <Button
                                                                                size="icon"
                                                                                variant="secondary"
                                                                                className="w-8 h-8"
                                                                                onClick={() => handleViewDocument(doc)}
                                                                            >
                                                                                <Eye className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button
                                                                                size="icon"
                                                                                variant="secondary"
                                                                                className="w-8 h-8"
                                                                                onClick={() => handleDownloadDocument(doc)}
                                                                            >
                                                                                <Download className="w-4 h-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>

                                                                    {/* Document info */}
                                                                    <div className="p-2">
                                                                        <p className="text-xs font-medium truncate" title={doc.name}>
                                                                            {doc.name}
                                                                        </p>
                                                                        <p className="text-[10px] text-muted-foreground">
                                                                            {doc.size}
                                                                        </p>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        {selectedFolder.status !== 'sent' && selectedFolder.status !== 'archived' && (
                                            <div className="flex justify-end gap-3 pt-4 border-t">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => handleArchiveFolder(selectedFolder)}
                                                    disabled={isLoading}
                                                >
                                                    <Archive className="w-4 h-4 mr-2" />
                                                    Archiver
                                                </Button>
                                                <Button
                                                    onClick={() => handleSendCorrespondance(selectedFolder)}
                                                    disabled={isLoading}
                                                    className="gap-2"
                                                >
                                                    {isLoading ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Send className="w-4 h-4" />
                                                    )}
                                                    Envoyer la correspondance
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    // Folders Grid
                                    <motion.div
                                        key="folders"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                                    >
                                        {filteredAndSortedFolders.map((folder, index) => (
                                            <motion.div
                                                key={folder.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Card
                                                    className={cn(
                                                        "cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 group",
                                                        "neu-card border-none",
                                                        !folder.isRead && "ring-2 ring-primary/30"
                                                    )}
                                                    onClick={() => handleSelectFolder(folder)}
                                                >
                                                    <CardContent className="p-4">
                                                        {/* Folder Icon */}
                                                        <div className="flex items-start justify-between mb-3">
                                                            <div className="relative">
                                                                <div className={cn(
                                                                    "w-14 h-12 rounded-lg flex items-center justify-center transition-all",
                                                                    "bg-gradient-to-br from-amber-400 to-amber-600",
                                                                    "shadow-lg group-hover:shadow-amber-500/30",
                                                                    "group-hover:scale-110"
                                                                )}>
                                                                    <FolderOpen className="w-7 h-7 text-white" />
                                                                </div>
                                                                {!folder.isRead && (
                                                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {folder.isUrgent && (
                                                                    <Badge variant="destructive" className="text-[9px] px-1.5">
                                                                        URGENT
                                                                    </Badge>
                                                                )}
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="w-6 h-6 opacity-0 group-hover:opacity-100"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <MoreVertical className="w-4 h-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleSelectFolder(folder);
                                                                        }}>
                                                                            <Eye className="w-4 h-4 mr-2" />
                                                                            Ouvrir
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleArchiveFolder(folder);
                                                                        }}>
                                                                            <Archive className="w-4 h-4 mr-2" />
                                                                            Archiver
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuSeparator />
                                                                        <DropdownMenuItem
                                                                            className="text-destructive"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteFolder(folder);
                                                                            }}
                                                                        >
                                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                                            Supprimer
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </div>
                                                        </div>

                                                        {/* Folder Name */}
                                                        <h3 className={cn(
                                                            "text-sm line-clamp-2 mb-2 leading-tight",
                                                            !folder.isRead ? "font-bold" : "font-medium"
                                                        )}>
                                                            {folder.name}
                                                        </h3>

                                                        {/* Sender */}
                                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                                                            <Building2 className="w-3 h-3" />
                                                            <span className="truncate">{folder.sender.organization}</span>
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                                                            <span className="flex items-center gap-1">
                                                                <Paperclip className="w-3 h-3" />
                                                                {folder.documents.length} doc{folder.documents.length > 1 ? 's' : ''}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(folder.date).toLocaleDateString('fr-FR', {
                                                                    day: 'numeric',
                                                                    month: 'short'
                                                                })}
                                                            </span>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            </motion.div>
                                        ))}

                                        {filteredAndSortedFolders.length === 0 && (
                                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                                                <FolderClosed className="w-16 h-16 opacity-20 mb-4" />
                                                <p className="font-medium">Aucun dossier trouvé</p>
                                                <p className="text-sm">Essayez avec d'autres termes de recherche</p>
                                                <Button
                                                    variant="outline"
                                                    className="mt-4"
                                                    onClick={() => {
                                                        setSearchTerm('');
                                                        setFilter('all');
                                                    }}
                                                >
                                                    Réinitialiser les filtres
                                                </Button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Folder Dialog */}
            <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderOpen className="w-5 h-5 text-primary" />
                            Nouvelle Correspondance
                        </DialogTitle>
                        <DialogDescription>
                            Créez un nouveau dossier de correspondance
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Nom du dossier *</label>
                            <Combobox
                                options={correspondanceTypeOptions}
                                value={newFolderData.name}
                                onValueChange={(value) => setNewFolderData(prev => ({ ...prev, name: value }))}
                                placeholder="Ex: Demande de permis de construire"
                                searchPlaceholder="Rechercher un type de correspondance..."
                                emptyMessage="Aucun type trouvé. Vous pouvez saisir un nom personnalisé."
                                allowCustom
                                groupByCategory
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Sélectionnez un type prédéfini ou saisissez un nom personnalisé
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Organisation destinataire *</label>
                                <Combobox
                                    options={organizationOptions}
                                    value={selectedOrgId}
                                    onValueChange={handleOrganizationChange}
                                    placeholder="Sélectionner une organisation"
                                    searchPlaceholder="Rechercher..."
                                    emptyMessage="Organisation non trouvée"
                                    allowCustom
                                    groupByCategory
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Nom du contact</label>
                                <Combobox
                                    options={contactOptions}
                                    value={newFolderData.recipientName}
                                    onValueChange={(value) => setNewFolderData(prev => ({ ...prev, recipientName: value }))}
                                    placeholder={contactOptions.length > 0 ? "Sélectionner un contact" : "Sélectionnez d'abord une organisation"}
                                    searchPlaceholder="Rechercher un contact..."
                                    emptyMessage="Aucun contact trouvé"
                                    allowCustom
                                    disabled={!selectedOrgId && contactOptions.length === 0}
                                />
                                {contactOptions.length > 0 && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {contactOptions.length} contact(s) disponible(s)
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium mb-1 block">Commentaire / Message</label>
                            <Textarea
                                placeholder="Message d'accompagnement..."
                                value={newFolderData.comment}
                                onChange={(e) => setNewFolderData(prev => ({ ...prev, comment: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="urgent"
                                checked={newFolderData.isUrgent}
                                onChange={(e) => setNewFolderData(prev => ({ ...prev, isUrgent: e.target.checked }))}
                                className="rounded"
                            />
                            <label htmlFor="urgent" className="text-sm">Marquer comme urgent</label>
                        </div>

                        {/* Documents */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Documents</label>

                            {newFolderDocs.length > 0 && (
                                <div className="space-y-2 mb-3">
                                    {newFolderDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-2">
                                                <FileText className={cn("w-4 h-4", DOC_TYPE_ICON[doc.type]?.color)} />
                                                <span className="text-sm truncate">{doc.name}</span>
                                                <span className="text-xs text-muted-foreground">{doc.size}</span>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6"
                                                onClick={() => removeDocument(doc.id)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                                <span className="text-sm text-muted-foreground">Cliquez pour ajouter des documents</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewFolderOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCreateFolder}
                            disabled={isLoading || !newFolderData.name.trim() || !newFolderData.recipientOrg.trim()}
                        >
                            {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <CheckCircle className="w-4 h-4 mr-2" />
                            )}
                            Créer le dossier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Document Preview Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {previewDocument?.name}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
                        {previewDocument?.url ? (
                            previewDocument.type === 'pdf' ? (
                                <iframe
                                    src={previewDocument.url}
                                    className="w-full h-[500px] rounded-lg"
                                    title={previewDocument.name}
                                />
                            ) : previewDocument.type === 'image' ? (
                                <img
                                    src={previewDocument.url}
                                    alt={previewDocument.name}
                                    className="max-w-full max-h-[500px] object-contain"
                                />
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                    <p>Prévisualisation non disponible</p>
                                    <Button
                                        className="mt-4"
                                        onClick={() => previewDocument && handleDownloadDocument(previewDocument)}
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        Télécharger
                                    </Button>
                                </div>
                            )
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                                <p>Prévisualisation</p>
                                <p className="text-sm">(Document de démonstration)</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                            Fermer
                        </Button>
                        <Button onClick={() => previewDocument && handleDownloadDocument(previewDocument)}>
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </DashboardLayout >
    );
}
