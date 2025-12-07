import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/DashboardLayout';
import { MailSidebar } from '@/components/mail/MailSidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    FolderOpen, FolderClosed, FileText, ArrowLeft, Search, Plus,
    Clock, Paperclip, Building2, MessageSquare, Download, Eye,
    MoreVertical, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Types
interface CorrespondanceDocument {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'other';
    size: string;
    date: string;
}

interface CorrespondanceFolder {
    id: string;
    name: string;
    sender: {
        name: string;
        organization: string;
    };
    date: string;
    comment: string;
    documents: CorrespondanceDocument[];
    isUrgent?: boolean;
    isRead: boolean;
}

// Mock data
const MOCK_FOLDERS: CorrespondanceFolder[] = [
    {
        id: 'folder-1',
        name: 'Permis de construire - Zone Industrielle',
        sender: { name: 'M. Ndong', organization: 'Mairie de Port-Gentil' },
        date: '2024-12-07',
        comment: 'Suite à notre entretien téléphonique, veuillez trouver ci-joint le dossier complet pour le permis de construire du lot 234.',
        isUrgent: true,
        isRead: false,
        documents: [
            { id: 'd1', name: 'Demande_Permis.pdf', type: 'pdf', size: '2.4 MB', date: '2024-12-07' },
            { id: 'd2', name: 'Plan_Masse.pdf', type: 'pdf', size: '5.1 MB', date: '2024-12-07' },
            { id: 'd3', name: 'Notice_Descriptive.doc', type: 'doc', size: '890 KB', date: '2024-12-07' },
            { id: 'd4', name: 'Photo_Terrain.jpg', type: 'image', size: '1.2 MB', date: '2024-12-07' },
        ],
    },
    {
        id: 'folder-2',
        name: 'Délibération n°2024-456 - Budget Annexe',
        sender: { name: 'Secrétariat Général', organization: 'Préfecture de l\'Estuaire' },
        date: '2024-12-06',
        comment: 'Pour validation et signature avant le conseil municipal du 15 décembre. Merci de retourner le document signé.',
        isRead: false,
        documents: [
            { id: 'd5', name: 'Deliberation_2024-456.pdf', type: 'pdf', size: '1.8 MB', date: '2024-12-06' },
            { id: 'd6', name: 'Annexe_Budget.pdf', type: 'pdf', size: '3.2 MB', date: '2024-12-06' },
            { id: 'd7', name: 'PV_Commission.pdf', type: 'pdf', size: '980 KB', date: '2024-12-06' },
        ],
    },
    {
        id: 'folder-3',
        name: 'Rapport Trimestriel État Civil Q4',
        sender: { name: 'Chef de Service', organization: 'État Civil - Libreville' },
        date: '2024-12-05',
        comment: 'Rapport trimestriel des activités du service état civil pour le quatrième trimestre 2024.',
        isRead: true,
        documents: [
            { id: 'd8', name: 'Rapport_Q4_2024.pdf', type: 'pdf', size: '4.5 MB', date: '2024-12-05' },
            { id: 'd9', name: 'Statistiques.pdf', type: 'pdf', size: '1.1 MB', date: '2024-12-05' },
        ],
    },
    {
        id: 'folder-4',
        name: 'Convention Intercommunale Transport',
        sender: { name: 'Direction Générale', organization: 'Communauté Urbaine' },
        date: '2024-12-04',
        comment: 'Projet de convention pour le réseau de transport intercommunal.',
        isRead: true,
        documents: [
            { id: 'd10', name: 'Convention_Transport.pdf', type: 'pdf', size: '2.8 MB', date: '2024-12-04' },
        ],
    },
];

const DOC_TYPE_ICON: Record<string, { color: string; label: string }> = {
    pdf: { color: 'text-red-500', label: 'PDF' },
    doc: { color: 'text-blue-500', label: 'DOC' },
    image: { color: 'text-green-500', label: 'IMG' },
    other: { color: 'text-gray-500', label: 'FILE' },
};

export default function CorrespondancePage() {
    const navigate = useNavigate();
    const [selectedFolder, setSelectedFolder] = useState<CorrespondanceFolder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredFolders = MOCK_FOLDERS.filter(folder =>
        folder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        folder.sender.organization.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const unreadCount = MOCK_FOLDERS.filter(f => !f.isRead).length;

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-6rem)] flex flex-col overflow-hidden rounded-2xl neu-card border-none shadow-inner bg-muted/30">
                {/* 3-Pane Layout Content - Matches MessagingPage */}
                <div className="flex-1 flex min-h-0">

                    {/* Pane 1: Sidebar (Folders) - DUPLICATED for consistency */}
                    <div className="hidden md:flex w-48 flex-col border-r bg-background/30 p-3 gap-3">
                        {/* Action Buttons */}
                        <div className="flex flex-col gap-2">
                            <Button className="w-full gap-2 neu-raised hover:translate-y-[-2px] transition-transform text-primary font-bold text-sm" onClick={() => navigate('/messaging')}>
                                <Plus className="w-4 h-4" /> <span className="truncate">Nouveau</span>
                            </Button>
                        </div>
                        <MailSidebar
                            currentFolder="" // No folder selection in sidebar for this page
                            onSelectFolder={(folder) => navigate(`/messaging?folder=${folder}`)}
                            unreadCount={2}
                        />
                    </div>

                    {/* Main Content Area (Correspondance Grid) */}
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
                                                {MOCK_FOLDERS.length} dossier{MOCK_FOLDERS.length > 1 ? 's' : ''} •
                                                {unreadCount > 0 && <span className="text-primary font-medium"> {unreadCount} non lu{unreadCount > 1 ? 's' : ''}</span>}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-9 w-48 bg-background/50"
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Filter className="w-4 h-4" />
                                    Filtrer
                                </Button>
                                <Button className="gap-2 neu-raised">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Nouveau Dossier</span>
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4">
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
                                                    {selectedFolder.isUrgent && (
                                                        <Badge variant="destructive">URGENT</Badge>
                                                    )}
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
                                                                            <Button size="icon" variant="secondary" className="w-8 h-8">
                                                                                <Eye className="w-4 h-4" />
                                                                            </Button>
                                                                            <Button size="icon" variant="secondary" className="w-8 h-8">
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
                                        {filteredFolders.map((folder, index) => (
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
                                                    onClick={() => setSelectedFolder(folder)}
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
                                                                <Button variant="ghost" size="icon" className="w-6 h-6 opacity-0 group-hover:opacity-100">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
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

                                        {filteredFolders.length === 0 && (
                                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground">
                                                <FolderClosed className="w-16 h-16 opacity-20 mb-4" />
                                                <p className="font-medium">Aucun dossier trouvé</p>
                                                <p className="text-sm">Essayez avec d'autres termes de recherche</p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
