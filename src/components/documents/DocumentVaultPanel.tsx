/**
 * Document Vault Panel
 * UI component for managing saved documents
 */

import React, { useEffect, useState } from 'react';
import {
    User, CreditCard, Baby, Home, Heart, Users, GraduationCap, FileText, File as FileIcon,
    Upload, Camera, Trash2, Eye, Download, X, Search, Filter, MoreVertical, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

import { useDocumentVault } from '@/stores/documentVaultStore';
import {
    VaultDocument,
    DocumentCategory,
    CATEGORY_LABELS,
    uploadToVault,
    deleteVaultDocument,
    downloadVaultDocument
} from '@/services/documentVaultService';
import { useFileSystemAccess, useFileDrop, SelectedFile } from '@/hooks/useFileSystemAccess';
import { CameraPreview } from '@/hooks/useCameraCapture';

// Category icons mapping
const CATEGORY_ICON_MAP: Record<DocumentCategory, React.ElementType> = {
    photo_identity: User,
    passport: CreditCard,
    birth_certificate: Baby,
    residence_proof: Home,
    marriage_certificate: Heart,
    family_record: Users,
    diploma: GraduationCap,
    cv: FileText,
    other: FileIcon
};

interface DocumentVaultPanelProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDocument?: (doc: VaultDocument) => void;
    selectionMode?: boolean;
    filterCategory?: DocumentCategory;
}

export function DocumentVaultPanel({
    isOpen,
    onClose,
    onSelectDocument,
    selectionMode = false,
    filterCategory
}: DocumentVaultPanelProps) {
    const vault = useDocumentVault();
    const filePicker = useFileSystemAccess({ multiple: true });
    const [showCamera, setShowCamera] = useState(false);
    const [previewDoc, setPreviewDoc] = useState<VaultDocument | null>(null);
    const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('other');
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [pendingFiles, setPendingFiles] = useState<SelectedFile[]>([]);

    // Fetch documents on mount
    useEffect(() => {
        if (isOpen) {
            vault.fetchDocuments();
        }
    }, [isOpen]);

    // Apply filter if provided
    useEffect(() => {
        if (filterCategory) {
            vault.setFilter('category', filterCategory);
        } else {
            vault.clearFilters();
        }
    }, [filterCategory]);

    // Drag and drop
    const { isDragging, dragHandlers } = useFileDrop((files) => {
        setPendingFiles(files);
        if (files.length > 0 && files[0].suggestedCategory) {
            setUploadCategory(files[0].suggestedCategory);
        }
        setShowUploadDialog(true);
    });

    // Handle file selection
    const handlePickFiles = async () => {
        const files = await filePicker.pickFiles();
        if (files.length > 0) {
            setPendingFiles(files);
            if (files[0].suggestedCategory) {
                setUploadCategory(files[0].suggestedCategory);
            }
            setShowUploadDialog(true);
        }
    };

    // Handle camera capture
    const handleCameraCapture = (photo: Blob) => {
        const file = new File([photo], `scan_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setPendingFiles([{ file, preview: URL.createObjectURL(photo) }]);
        setShowCamera(false);
        setShowUploadDialog(true);
    };

    // Upload pending files
    const handleUpload = async () => {
        for (const pf of pendingFiles) {
            const { data, error } = await uploadToVault(pf.file, uploadCategory);
            if (error) {
                toast.error(`Erreur: ${error.message}`);
            } else if (data) {
                vault.addDocument(data);
                toast.success(`${data.name} ajouté au coffre-fort`);
            }
        }
        setPendingFiles([]);
        setShowUploadDialog(false);
    };

    // Delete document
    const handleDelete = async (doc: VaultDocument) => {
        if (!confirm(`Supprimer "${doc.name}" ?`)) return;

        const { success, error } = await deleteVaultDocument(doc.id);
        if (success) {
            vault.removeDocument(doc.id);
            toast.success('Document supprimé');
        } else {
            toast.error(`Erreur: ${error?.message}`);
        }
    };

    // Download document
    const handleDownload = async (doc: VaultDocument) => {
        const { data, error } = await downloadVaultDocument(doc.id);
        if (error || !data) {
            toast.error('Erreur de téléchargement');
            return;
        }

        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.original_name || doc.name;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Select document for use
    const handleSelectDocument = (doc: VaultDocument) => {
        if (selectionMode && onSelectDocument) {
            onSelectDocument(doc);
            onClose();
        } else {
            setPreviewDoc(doc);
        }
    };

    // Format file size
    const formatSize = (bytes: number | null) => {
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const filteredDocs = vault.filteredDocuments;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            {selectionMode ? 'Sélectionner un document' : 'Coffre-fort de documents'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectionMode
                                ? 'Choisissez un document existant ou importez-en un nouveau'
                                : 'Gérez vos documents personnels en toute sécurité'}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Toolbar */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-9"
                                value={vault.filters.searchQuery}
                                onChange={(e) => vault.setFilter('searchQuery', e.target.value)}
                            />
                        </div>

                        {/* Category filter */}
                        <Select
                            value={vault.filters.category || 'all'}
                            onValueChange={(v) => vault.setFilter('category', v === 'all' ? null : v as DocumentCategory)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Catégorie" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes catégories</SelectItem>
                                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Upload buttons */}
                        <Button onClick={handlePickFiles} variant="outline" className="gap-2">
                            <Upload className="w-4 h-4" />
                            Importer
                        </Button>
                        <Button onClick={() => setShowCamera(true)} variant="outline" className="gap-2">
                            <Camera className="w-4 h-4" />
                            Scanner
                        </Button>
                    </div>

                    {/* Drop zone & document grid */}
                    <ScrollArea className="flex-1 -mx-6 px-6">
                        <div
                            {...dragHandlers}
                            className={`
                                min-h-[300px] rounded-lg border-2 border-dashed transition-colors p-4
                                ${isDragging ? 'border-primary bg-primary/5' : 'border-transparent'}
                            `}
                        >
                            {vault.isLoading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                                </div>
                            ) : filteredDocs.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                                    <FileText className="w-16 h-16 mb-4 opacity-20" />
                                    <p>Aucun document</p>
                                    <p className="text-sm">Glissez-déposez des fichiers ou utilisez les boutons ci-dessus</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {filteredDocs.map((doc) => {
                                        const Icon = CATEGORY_ICON_MAP[doc.category] || FileIcon;
                                        return (
                                            <div
                                                key={doc.id}
                                                onClick={() => handleSelectDocument(doc)}
                                                className={`
                                                    group relative p-4 rounded-lg border bg-card hover:border-primary 
                                                    cursor-pointer transition-all hover:shadow-md
                                                    ${selectionMode ? 'hover:ring-2 hover:ring-primary' : ''}
                                                `}
                                            >
                                                {/* Thumbnail or icon */}
                                                <div className="aspect-square rounded-md bg-muted flex items-center justify-center mb-3 overflow-hidden">
                                                    {doc.file_type?.startsWith('image/') && doc.public_url ? (
                                                        <img
                                                            src={doc.public_url}
                                                            alt={doc.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <Icon className="w-12 h-12 text-muted-foreground" />
                                                    )}
                                                </div>

                                                {/* Document info */}
                                                <h4 className="font-medium text-sm truncate" title={doc.name}>
                                                    {doc.name}
                                                </h4>
                                                <div className="flex items-center justify-between mt-1">
                                                    <Badge variant="secondary" className="text-xs">
                                                        {CATEGORY_LABELS[doc.category]}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatSize(doc.file_size)}
                                                    </span>
                                                </div>

                                                {/* Verified badge */}
                                                {doc.is_verified && (
                                                    <div className="absolute top-2 right-2">
                                                        <Badge variant="default" className="gap-1">
                                                            <Check className="w-3 h-3" />
                                                            Vérifié
                                                        </Badge>
                                                    </div>
                                                )}

                                                {/* Actions dropdown */}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem onClick={() => setPreviewDoc(doc)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            Aperçu
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleDownload(doc)}>
                                                            <Download className="w-4 h-4 mr-2" />
                                                            Télécharger
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(doc)}
                                                            className="text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Camera scanner dialog */}
            <Dialog open={showCamera} onOpenChange={setShowCamera}>
                <DialogContent className="max-w-lg p-0 overflow-hidden">
                    <CameraPreview
                        onCapture={handleCameraCapture}
                        onClose={() => setShowCamera(false)}
                        className="aspect-[4/3]"
                    />
                </DialogContent>
            </Dialog>

            {/* Upload confirmation dialog */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Importer dans le coffre-fort</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        {/* File previews */}
                        <div className="flex flex-wrap gap-2">
                            {pendingFiles.map((pf, i) => (
                                <div key={i} className="relative w-20 h-20 rounded-md overflow-hidden bg-muted">
                                    {pf.preview ? (
                                        <img src={pf.preview} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <FileIcon className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Category selection */}
                        <div>
                            <label className="text-sm font-medium mb-2 block">Catégorie</label>
                            <Select value={uploadCategory} onValueChange={(v) => setUploadCategory(v as DocumentCategory)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                                Annuler
                            </Button>
                            <Button onClick={handleUpload}>
                                <Upload className="w-4 h-4 mr-2" />
                                Importer {pendingFiles.length} fichier(s)
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Preview dialog */}
            <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{previewDoc?.name}</DialogTitle>
                    </DialogHeader>

                    {previewDoc && (
                        <div className="space-y-4">
                            {/* Preview content */}
                            <div className="aspect-video rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                {previewDoc.file_type?.startsWith('image/') && previewDoc.public_url ? (
                                    <img
                                        src={previewDoc.public_url}
                                        alt={previewDoc.name}
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : previewDoc.file_type === 'application/pdf' && previewDoc.public_url ? (
                                    <iframe
                                        src={previewDoc.public_url}
                                        className="w-full h-96"
                                        title={previewDoc.name}
                                    />
                                ) : (
                                    <FileIcon className="w-24 h-24 text-muted-foreground" />
                                )}
                            </div>

                            {/* Metadata */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground">Catégorie:</span>
                                    <span className="ml-2">{CATEGORY_LABELS[previewDoc.category]}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Taille:</span>
                                    <span className="ml-2">{formatSize(previewDoc.file_size)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Source:</span>
                                    <span className="ml-2 capitalize">{previewDoc.source}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground">Ajouté le:</span>
                                    <span className="ml-2">{new Date(previewDoc.created_at).toLocaleDateString('fr-FR')}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => handleDownload(previewDoc)}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Télécharger
                                </Button>
                                {selectionMode && onSelectDocument && (
                                    <Button onClick={() => { onSelectDocument(previewDoc); onClose(); setPreviewDoc(null); }}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Utiliser ce document
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
