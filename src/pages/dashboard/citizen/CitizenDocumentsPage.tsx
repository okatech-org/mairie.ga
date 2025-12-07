import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, DocumentType } from '@/types/document';
import { documentService } from '@/services/document-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Trash2, Eye, Loader2, FileIcon, Pencil, X, Check, Calendar as CalendarIcon, AlertTriangle, Clock, Share2, EyeOff, Link, Copy, Shield } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { dossierService } from '@/services/dossier-service';
import { supabase } from '@/integrations/supabase/client';
import { useDocumentOCRAnalysis } from '@/hooks/useDocumentOCRAnalysis';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

interface UploadingFile {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
}

interface DocumentGroup {
    id: string;
    title: string;
    type: DocumentType;
    folder: string;
    front?: Document;
    back?: Document;
    singles: Document[];
    isPair: boolean;
}

const groupDocuments = (docs: Document[]): DocumentGroup[] => {
    const groups: DocumentGroup[] = [];
    const processedids = new Set<string>();

    // 1. Try to find pairs for specific types
    const typesToPair: DocumentType[] = ['ID_CARD', 'RESIDENCE_PERMIT', 'PASSPORT'];

    // Helper to get type label only needed inside here if not available globally, 
    // but we can duplicate the label logic or move it out.
    const getSimpleTypeLabel = (type: DocumentType) => {
        switch (type) {
            case 'ID_CARD': return 'Carte d\'Identité';
            case 'PASSPORT': return 'Passeport';
            case 'BIRTH_CERTIFICATE': return 'Acte de Naissance';
            case 'RESIDENCE_PERMIT': return 'Carte de Séjour';
            case 'PHOTO': return 'Photo d\'identité';
            default: return 'Autre Document';
        }
    };

    typesToPair.forEach(type => {
        const typeDocs = docs.filter(d => d.type === type && !processedids.has(d.id));
        const fronts = typeDocs.filter(d => d.side === 'front');
        const backs = typeDocs.filter(d => d.side === 'back');
        const others = typeDocs.filter(d => !d.side);

        // Simple greedy pairing strategy
        let i = 0;
        while (i < fronts.length || i < backs.length) {
            const f = fronts[i];
            const b = backs[i];

            if (f && b) {
                groups.push({
                    id: f.id,
                    title: getSimpleTypeLabel(type),
                    type: type,
                    folder: f.folder || 'AUTRE',
                    front: f,
                    back: b,
                    singles: [],
                    isPair: true
                });
                processedids.add(f.id);
                processedids.add(b.id);
            } else if (f) {
                groups.push({
                    id: f.id,
                    title: f.title,
                    type: type,
                    folder: f.folder || 'AUTRE',
                    front: f,
                    singles: [],
                    isPair: false
                });
                processedids.add(f.id);
            } else if (b) {
                groups.push({
                    id: b.id,
                    title: b.title,
                    type: type,
                    folder: b.folder || 'AUTRE',
                    front: b,
                    singles: [],
                    isPair: false
                });
                processedids.add(b.id);
            }
            i++;
        }

        others.forEach(d => {
            groups.push({
                id: d.id,
                title: d.title,
                type: type,
                folder: d.folder || 'AUTRE',
                front: d,
                singles: [],
                isPair: false
            });
            processedids.add(d.id);
        });
    });

    // 2. Add remaining documents as singles
    docs.filter(d => !processedids.has(d.id)).forEach(d => {
        groups.push({
            id: d.id,
            title: d.title,
            type: d.type,
            folder: d.folder || 'AUTRE',
            front: d,
            singles: [],
            isPair: false
        });
    });

    return groups;
};

// --- Auto-Rotate Image Component ---
// --- Auto-Rotate Image Component ---
const AutoRotateImage = ({ src, alt, className, onError, docType }: { src: string, alt: string, className?: string, onError?: () => void, docType?: DocumentType }) => {
    const [rotation, setRotation] = useState(0);
    const [isLoaded, setIsLoaded] = useState(false);

    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const img = e.currentTarget;
        // Only apply rotation logic for ID cards and Residence Permits which are landscape
        // Passports are naturally portrait, so we shouldn't rotate them if they appear portrait
        const shouldCheckRotation = docType === 'ID_CARD' || docType === 'RESIDENCE_PERMIT';

        if (shouldCheckRotation && img.naturalHeight > img.naturalWidth * 1.2) {
            setRotation(90);
        }
        setIsLoaded(true);
    };

    return (
        <img
            src={src}
            alt={alt}
            className={`${className} transition-transform duration-300`}
            style={{
                transform: `rotate(${rotation}deg)`,
                maxWidth: rotation === 90 ? '100%' : undefined,
                maxHeight: rotation === 90 ? '100%' : undefined,
                opacity: isLoaded ? 1 : 0
            }}
            onLoad={handleLoad}
        />
    );
};

const ExpirationBadge = ({ date, docType }: { date?: string, docType?: DocumentType }) => {
    // Documents that NEVER expire
    const neverExpires = docType && ['BIRTH_CERTIFICATE', 'OTHER'].includes(docType);

    // Documents that REQUIRE an expiration date
    const requiresExpiration = docType && ['ID_CARD', 'PASSPORT', 'RESIDENCE_PERMIT', 'RESIDENCE_PROOF'].includes(docType);

    // Documents without expiration concept (Photo is just an image, no date needed)
    if (docType === 'PHOTO') {
        return null; // Photos don't expire
    }

    // Birth certificates and similar never expire
    if (neverExpires) {
        return (
            <Badge variant="outline" className="flex items-center gap-1 border-green-500 text-green-600 bg-green-50">
                <Check size={10} />
                Illimité
            </Badge>
        );
    }

    // No date set but should have one
    if (!date && requiresExpiration) {
        return (
            <Badge variant="outline" className="flex items-center gap-1 border-muted-foreground/50 text-muted-foreground">
                <Clock size={10} />
                Date non définie
            </Badge>
        );
    }

    if (!date) return null;

    const days = differenceInDays(new Date(date), new Date());

    // Expired
    if (days < 0) {
        return (
            <Badge variant="destructive" className="flex items-center gap-1">
                <AlertTriangle size={10} />
                Expiré
            </Badge>
        );
    }

    // Less than 30 days - URGENT (orange)
    if (days < 30) {
        return (
            <Badge variant="outline" className="flex items-center gap-1 border-orange-500 text-orange-600 bg-orange-50">
                <AlertTriangle size={10} />
                {days}j restants
            </Badge>
        );
    }

    // Less than 90 days (3 months) - WARNING (yellow/amber)
    if (days < 90) {
        const months = Math.ceil(days / 30);
        return (
            <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-700 bg-yellow-50">
                <Clock size={10} />
                {months} mois restant{months > 1 ? 's' : ''}
            </Badge>
        );
    }

    // Valid for more than 90 days (blue)
    return (
        <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-600 bg-blue-50">
            <Check size={10} />
            Valide ({format(new Date(date), 'dd/MM/yyyy')})
        </Badge>
    );
};

export default function CitizenDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [selectedType, setSelectedType] = useState<DocumentType>('OTHER');
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const [renameTarget, setRenameTarget] = useState<Document | null>(null);
    const [newName, setNewName] = useState('');
    const [currentFolder, setCurrentFolder] = useState<string | null>(null);
    const [expirationTarget, setExpirationTarget] = useState<Document | null>(null);
    const [expirationDate, setExpirationDate] = useState('');
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isBlurMode, setIsBlurMode] = useState(false);
    const [shareTarget, setShareTarget] = useState<Document | null>(null);
    const [shareUrl, setShareUrl] = useState('');
    const [shareDuration, setShareDuration] = useState('3600'); // 1 hour default

    // Pre-Upload State
    const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
    const [uploadDate, setUploadDate] = useState('');
    const [uploadType, setUploadType] = useState<DocumentType>('OTHER');
    const [ocrLoading, setOcrLoading] = useState(false);
    const [ocrConfidence, setOcrConfidence] = useState<number | null>(null);

    // OCR Analysis hook - listens for iAsted events
    const { isAnalyzing: isOCRAnalyzing, results: ocrResults, consolidatedData } = useDocumentOCRAnalysis();

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const data = await documentService.getMyDocuments();
            setDocuments(data);
        } catch (error) {
            console.error('Fetch error:', error);
            toast.error("Impossible de charger les documents");
        } finally {
            setIsLoading(false);
        }
    };

    const updateFileProgress = (id: string, progress: number, status?: UploadingFile['status']) => {
        setUploadingFiles(prev => prev.map(f =>
            f.id === id ? { ...f, progress, status: status || f.status } : f
        ));
    };

    const handleUpload = async (files: File[]) => {
        const validFiles = files.filter(file => {
            if (file.size > 5 * 1024 * 1024) {
                toast.error(`${file.name} est trop volumineux (max 5MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        // Initialize upload tracking
        const newUploadingFiles: UploadingFile[] = validFiles.map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            progress: 0,
            status: 'uploading' as const
        }));

        setUploadingFiles(prev => [...newUploadingFiles, ...prev]);

        // Upload files with simulated progress
        const uploadPromises = validFiles.map(async (file, index) => {
            const uploadId = newUploadingFiles[index].id;

            try {
                // Simulate progress updates
                const progressInterval = setInterval(() => {
                    setUploadingFiles(prev => {
                        const current = prev.find(f => f.id === uploadId);
                        if (current && current.progress < 90 && current.status === 'uploading') {
                            return prev.map(f =>
                                f.id === uploadId ? { ...f, progress: Math.min(f.progress + 15, 90) } : f
                            );
                        }
                        return prev;
                    });
                }, 200);

                const newDoc = await documentService.uploadDocument(file, selectedType);

                clearInterval(progressInterval);
                updateFileProgress(uploadId, 100, 'success');

                // Remove from uploading list after delay
                setTimeout(() => {
                    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
                }, 1500);

                return newDoc;
            } catch (error) {
                updateFileProgress(uploadId, 100, 'error');
                setTimeout(() => {
                    setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
                }, 3000);
                throw error;
            }
        });

        const results = await Promise.allSettled(uploadPromises);

        const successful = results
            .filter((r): r is PromiseFulfilledResult<Document> => r.status === 'fulfilled')
            .map(r => r.value);

        if (successful.length > 0) {
            setDocuments(prev => [...successful, ...prev]);
            toast.success(`${successful.length} document${successful.length > 1 ? 's' : ''} ajouté${successful.length > 1 ? 's' : ''}`);
        }

        const failedCount = results.filter(r => r.status === 'rejected').length;
        if (failedCount > 0) {
            toast.error(`${failedCount} document${failedCount > 1 ? 's' : ''} n'ont pas pu être envoyés`);
        }
    };

    // --- Upload Handlers ---

    const handleUploadConfirm = async () => {
        if (!pendingUploadFile) return;

        const fileToUpload = pendingUploadFile;
        setPendingUploadFile(null); // Close dialog

        // Process single file
        const uploadId = Math.random().toString(36).substr(2, 9);
        setUploadingFiles(prev => [...prev, {
            id: uploadId,
            name: fileToUpload.name,
            progress: 0,
            status: 'uploading'
        }]);

        try {
            const updateFileProgress = (id: string, progress: number, status: 'uploading' | 'success' | 'error') => {
                setUploadingFiles(prev => prev.map(f =>
                    f.id === id ? { ...f, progress, status } : f
                ));
            };

            // Simulate progress
            updateFileProgress(uploadId, 30, 'uploading');

            // Actual upload with date
            const newDoc = await documentService.uploadDocument(fileToUpload, uploadType, uploadDate || undefined);

            updateFileProgress(uploadId, 100, 'success');

            // Cleanup list after success
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
            }, 1500);

            setDocuments(prev => [newDoc, ...prev]);
            toast.success("Document ajouté avec succès");
        } catch (error) {
            setUploadingFiles(prev => prev.map(f =>
                f.id === uploadId ? { ...f, progress: 100, status: 'error' } : f
            ));
            setTimeout(() => {
                setUploadingFiles(prev => prev.filter(f => f.id !== uploadId));
            }, 3000);
            toast.error("Échec de l'envoi");
        } finally {
            setUploadDate('');
            setUploadType('OTHER');
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            const file = acceptedFiles[0];
            setPendingUploadFile(file);
            setOcrLoading(true);
            setOcrConfidence(null);

            // Try to auto-detect type from filename first
            const lowerName = file.name.toLowerCase();
            let detectedType: DocumentType = selectedType;

            if (selectedType === 'OTHER') {
                if (lowerName.includes('passeport') || lowerName.includes('passport')) detectedType = 'PASSPORT';
                else if (lowerName.includes('cni') || lowerName.includes('carte identite')) detectedType = 'ID_CARD';
                else if (lowerName.includes('acte') && lowerName.includes('naissance')) detectedType = 'BIRTH_CERTIFICATE';
                else if (lowerName.includes('sejour') || lowerName.includes('residence permit')) detectedType = 'RESIDENCE_PERMIT';
                else if (lowerName.includes('facture') || lowerName.includes('edf') || lowerName.includes('eau') ||
                    lowerName.includes('justif') || lowerName.includes('domicile') || lowerName.includes('electricite') ||
                    lowerName.includes('quittance') || lowerName.includes('loyer')) {
                    detectedType = 'RESIDENCE_PROOF';
                }
            }

            setUploadType(detectedType);

            // Default expiration logic
            if (detectedType === 'BIRTH_CERTIFICATE') {
                setUploadDate('');
            } else if (detectedType === 'RESIDENCE_PROOF') {
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 90);
                setUploadDate(futureDate.toISOString().split('T')[0]);
            } else {
                setUploadDate('');
            }

            // Try OCR to extract expiration date from image
            if (file.type.startsWith('image/')) {
                try {
                    const reader = new FileReader();
                    reader.onload = async () => {
                        try {
                            const base64 = (reader.result as string).split(',')[1];

                            const { data, error } = await supabase.functions.invoke('document-ocr', {
                                body: {
                                    imageBase64: base64,
                                    mimeType: file.type,
                                    documentType: detectedType === 'PASSPORT' ? 'passport' :
                                        detectedType === 'ID_CARD' ? 'cni' :
                                            detectedType === 'BIRTH_CERTIFICATE' ? 'birth_certificate' :
                                                detectedType === 'RESIDENCE_PROOF' ? 'residence_proof' : 'other'
                                }
                            });

                            if (!error && data) {
                                console.log('[OCR] Result:', data);
                                setOcrConfidence(data.confidence || 0);

                                // Auto-detect document type from OCR
                                if (data.documentType && selectedType === 'OTHER') {
                                    const typeMap: Record<string, DocumentType> = {
                                        'passport': 'PASSPORT',
                                        'cni': 'ID_CARD',
                                        'birth_certificate': 'BIRTH_CERTIFICATE',
                                        'residence_proof': 'RESIDENCE_PROOF',
                                    };
                                    if (typeMap[data.documentType]) {
                                        setUploadType(typeMap[data.documentType]);
                                    }
                                }

                                // Extract expiration date
                                if (data.extractedData?.expiryDate) {
                                    setUploadDate(data.extractedData.expiryDate);
                                    toast.success(`Date d'expiration détectée: ${data.extractedData.expiryDate}`);
                                }
                            }
                        } catch (ocrError) {
                            console.error('[OCR] Error:', ocrError);
                        } finally {
                            setOcrLoading(false);
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (e) {
                    console.error('[OCR] Failed to read file:', e);
                    setOcrLoading(false);
                }
            } else {
                setOcrLoading(false);
            }
        }
    }, [selectedType]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp']
        },
        disabled: uploadingFiles.length > 0
    });

    const confirmDelete = async () => {
        if (!deleteTarget) return;

        try {
            await documentService.deleteDocument(deleteTarget.id);
            toast.success("Document supprimé");
            setDocuments(prev => prev.filter(d => d.id !== deleteTarget.id));
        } catch (error) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setDeleteTarget(null);
        }
    };

    const openRenameDialog = (doc: Document) => {
        setRenameTarget(doc);
        setNewName(doc.title);
    };

    const confirmRename = async () => {
        if (!renameTarget || !newName.trim()) return;

        try {
            await documentService.renameDocument(renameTarget.id, newName.trim());
            setDocuments(prev => prev.map(d =>
                d.id === renameTarget.id ? { ...d, title: newName.trim() } : d
            ));
            toast.success("Document renommé");
        } catch (error) {
            toast.error("Erreur lors du renommage");
        } finally {
            setRenameTarget(null);
            setNewName('');
        }
    };

    const openExpirationDialog = (doc: Document) => {
        setExpirationTarget(doc);
        setExpirationDate(doc.expirationDate || '');
    };

    const confirmExpirationUpdate = async () => {
        if (!expirationTarget) return;
        try {
            await documentService.updateDocumentExpiration(expirationTarget.id, expirationDate || null);
            setDocuments(prev => prev.map(d =>
                d.id === expirationTarget.id ? { ...d, expirationDate: expirationDate || undefined } : d
            ));
            toast.success("Date d'expiration mise à jour");
        } catch (error) {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setExpirationTarget(null);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleGenerateDossier = async () => {
        if (selectedIds.size === 0) return;

        const selectedGroups = groupedDocuments.filter(g => selectedIds.has(g.id));
        const docsToInclude: Document[] = [];
        selectedGroups.forEach(g => {
            if (g.front) docsToInclude.push(g.front);
            if (g.back) docsToInclude.push(g.back);
            docsToInclude.push(...g.singles);
        });

        if (docsToInclude.length === 0) return;

        toast.promise(
            async () => {
                const pdfData = await dossierService.generateDossier(docsToInclude, `Dossier (${selectedIds.size} documents)`);
                dossierService.downloadPdf(pdfData, `Dossier_${new Date().toISOString().split('T')[0]}.pdf`);
                setSelectionMode(false);
                setSelectedIds(new Set());
            },
            {
                loading: 'Génération du dossier PDF...',
                success: 'Dossier téléchargé !',
                error: 'Erreur lors de la génération'
            }
        );
    };

    const handleShare = async () => {
        if (!shareTarget) return;
        try {
            // Need to fetch doc to get file path if we only have URL? 
            // documentService.getTemporaryUrl expects filePath.
            // The document object from DB (which we have) usually has file_path if we typed it correctly?
            // Wait, Document type doesn't expose file_path explicitly in frontend type usually?
            // Let's check type. It doesn't.
            // But we need it. 
            // FIX: We need to use ID, and let service fetch path? 
            // No, service.getTemporaryUrl takes path.
            // I'll update service to take ID? Or expose file_path?
            // For now, I'll assume I can't easily change service signature widely.
            // BUT documentService.deleteDocument fetches path by ID.
            // I'll implement `shareDocument(id, duration)` in service?
            // Let's rely on `deleteDocument` pattern.
            // ... For this turn, I will assume I can pass the ID to a new service method `createShareLink`.
            // I'll add `createShareLink` to service in a moment if needed.
            // Wait, I didn't add `createShareLink` taking ID. I added `getTemporaryUrl` taking path.
            // Since I don't have path in frontend Document, I'm stuck unless I expose it.
            // Workaround: Use existing public URL? No, secure share needs signed.
            // I'll assume for this prototype we show the `url` we have if it's signed (it expires).
            // But we want a CUSTOM duration.
            // I will update Document interface to include `filePath`? useful.
            // OR simpler: `documentService.generateShareLink(docId, duration)`.
            // I'll add that to service first?
            // No, I'll do it in this step. I'll assume I can add it to service.

            const url = await documentService.generateShareLink(shareTarget.id, parseInt(shareDuration));
            setShareUrl(url || '');
        } catch (e) {
            toast.error("Erreur lors de la création du lien");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(shareUrl);
        toast.success("Lien copié !");
    };

    // --- Helpers & Visuals ---

    const getStatusBadge = (status: Document['status']) => {
        switch (status) {
            case 'VERIFIED':
                return <Badge className="bg-green-500 hover:bg-green-600">Vérifié</Badge>;
            case 'PENDING':
                return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">En attente</Badge>;
            case 'REJECTED':
                return <Badge variant="destructive">Rejeté</Badge>;
            default:
                return <Badge variant="outline">Inconnu</Badge>;
        }
    };

    const getTypeLabel = (type: Document['type']) => {
        switch (type) {
            case 'ID_CARD': return 'Carte d\'Identité';
            case 'PASSPORT': return 'Passeport';
            case 'BIRTH_CERTIFICATE': return 'Acte de Naissance';
            case 'RESIDENCE_PERMIT': return 'Carte de Séjour';
            case 'PHOTO': return 'Photo d\'identité';
            default: return 'Autre Document';
        }
    };

    const isImageFile = (doc: Document) => {
        return doc.fileType?.startsWith('image/') ||
            doc.url?.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    };

    const DocumentThumbnail = ({ doc }: { doc: Document }) => {
        const [imageError, setImageError] = useState(false);

        if (isImageFile(doc) && doc.thumbnailUrl && !imageError) {
            return (
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-muted">
                    <AutoRotateImage
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        className={`w-full h-full object-cover ${isBlurMode ? 'blur-sm hover:blur-none transition-all duration-300' : ''}`}
                        onError={() => setImageError(true)}
                        docType={doc.type}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </div>
            );
        }

        return (
            <div className="w-full h-32 rounded-lg bg-muted/50 flex items-center justify-center">
                {doc.fileType?.includes('pdf') ? (
                    <FileText className="w-12 h-12 text-red-500/70" />
                ) : (
                    <FileIcon className="w-12 h-12 text-muted-foreground/50" />
                )}
            </div>
        );
    };

    // --- Folder Logic ---
    const folderStats = {
        'IDENTITE': documents.filter(d => d.folder === 'IDENTITE').length,
        'ETAT_CIVIL': documents.filter(d => d.folder === 'ETAT_CIVIL').length,
        'RESIDENCE': documents.filter(d => d.folder === 'RESIDENCE').length,
        'AUTRE': documents.filter(d => (!d.folder || d.folder === 'AUTRE')).length,
    };

    const displayedDocuments = currentFolder
        ? documents.filter(d => d.folder === currentFolder || (!d.folder && currentFolder === 'AUTRE'))
        : documents;



    // --- Flip Card Component ---
    const DocumentFlipCard = ({ group, onDelete, onRename, onSetExpiration, selectionMode, isSelected, onToggleSelect }: {
        group: DocumentGroup,
        onDelete: (d: Document) => void,
        onRename: (d: Document) => void,
        onSetExpiration: (d: Document) => void,
        selectionMode: boolean,
        isSelected: boolean,
        onToggleSelect: (id: string) => void
    }) => {
        const [isFlipped, setIsFlipped] = useState(false);

        const handleCardClick = (e: React.MouseEvent) => {
            if (selectionMode) {
                e.stopPropagation();
                onToggleSelect(group.id);
            } else if (group.isPair) {
                setIsFlipped(!isFlipped);
            }
        };

        if (!group.isPair && group.front) {
            return (
                <div onClick={handleCardClick} className={`neu-card p-4 rounded-xl space-y-3 flex flex-col group hover:border-primary/50 transition-all hover:shadow-lg relative cursor-pointer ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                    {selectionMode && (
                        <div className="absolute top-2 left-2 z-20">
                            <Checkbox checked={isSelected} onCheckedChange={() => onToggleSelect(group.id)} />
                        </div>
                    )}
                    {group.front.side && (
                        <Badge className="absolute top-2 right-2 z-10 opacity-90 shadow-sm" variant="secondary">
                            {group.front.side === 'front' ? 'Recto' : 'Verso'}
                        </Badge>
                    )}
                    <DocumentThumbnail doc={group.front} />
                    <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                            <h3 className="font-semibold text-sm line-clamp-2" title={group.front.title}>
                                {group.front.title}
                            </h3>
                            {getStatusBadge(group.front.status)}
                        </div>
                        <p className="text-xs text-muted-foreground">{getTypeLabel(group.type)}</p>
                        <ExpirationBadge date={group.front.expirationDate} docType={group.type} />
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{group.front.uploadDate}</span>
                        </div>
                    </div>
                    <div className="flex gap-1 pt-2 border-t">
                        <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => window.open(group.front?.url, '_blank')}>
                            <Eye className="w-3.5 h-3.5" /> Voir
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => onDelete(group.front!)}>
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => onSetExpiration(group.front!)}>
                            <Clock className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground hover:text-primary" onClick={() => setShareTarget(group.front!)}>
                            <Share2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            );
        }

        return (
            <div className="perspective-1000 w-full h-[320px] cursor-pointer group" onClick={handleCardClick}>
                <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                    style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

                    {/* Selection Overlay for 3D card */}
                    {selectionMode && (
                        <div className="absolute top-3 left-3 z-[100]">
                            <Checkbox checked={isSelected} onCheckedChange={(c) => { onToggleSelect(group.id) }} className="bg-background/80 backdrop-blur-sm" />
                        </div>
                    )}

                    {/* FRONT FACE */}
                    <div className="absolute inset-0 backface-hidden neu-card rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 bg-background" style={{ backfaceVisibility: 'hidden' }}>
                        <div className="h-full flex flex-col p-4 relative">
                            <Badge className="absolute top-3 left-3 z-10 bg-primary text-primary-foreground shadow-md">Recto</Badge>
                            <div className="absolute top-3 right-3 text-xs text-muted-foreground flex items-center gap-1 animate-pulse">
                                <FileText className="w-3 h-3" /> Retourner
                            </div>
                            <div className="flex-1 relative rounded-lg overflow-hidden border border-muted-foreground/10 bg-muted/20 flex items-center justify-center">
                                {group.front && group.front.thumbnailUrl ? (
                                    <AutoRotateImage src={group.front.thumbnailUrl} className={`w-full h-full object-contain p-2 ${isBlurMode ? 'blur-md' : ''}`} alt="Recto" docType={group.type} />
                                ) : (
                                    <FileIcon className="w-12 h-12 text-muted-foreground/30" />
                                )}
                            </div>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-bold text-lg">{group.title}</h3>
                                <p className="text-xs text-muted-foreground">Document Officiel • Recto</p>
                                <ExpirationBadge date={group.front?.expirationDate} docType={group.type} />
                            </div>
                        </div>
                    </div>

                    {/* BACK FACE */}
                    <div className="absolute inset-0 backface-hidden neu-card rounded-xl overflow-hidden shadow-lg border-2 border-primary/20 bg-background rotate-y-180"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <div className="h-full flex flex-col p-4 relative">
                            <Badge className="absolute top-3 left-3 z-10 bg-secondary text-secondary-foreground shadow-md">Verso</Badge>
                            <div className="flex-1 relative rounded-lg overflow-hidden border border-muted-foreground/10 bg-muted/20 flex items-center justify-center">
                                {group.back && group.back.thumbnailUrl ? (
                                    <AutoRotateImage src={group.back.thumbnailUrl} className="w-full h-full object-contain p-2" alt="Verso" docType={group.type} />
                                ) : (
                                    <div className="text-center p-4">
                                        <p className="text-sm text-muted-foreground">Aucun verso disponible</p>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); window.open(group.back?.url, '_blank'); }}>
                                    <Eye className="w-4 h-4 mr-2" /> Verso
                                </Button>
                                <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); window.open(group.front?.url, '_blank'); }}>
                                    <Eye className="w-4 h-4 mr-2" /> Recto
                                </Button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        );
    };

    const groupedDocuments = groupDocuments(displayedDocuments);

    if (isLoading) {
        return (
            <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Upload Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        {currentFolder && (
                            <Button variant="ghost" className="p-0 h-auto mr-2" onClick={() => setCurrentFolder(null)}>
                                <span className="text-muted-foreground hover:text-primary">Documents</span>
                            </Button>
                        )}
                        {currentFolder ? (
                            <>
                                <span className="text-muted-foreground">/</span>
                                {currentFolder === 'IDENTITE' ? 'Identité' :
                                    currentFolder === 'ETAT_CIVIL' ? 'État Civil' :
                                        currentFolder === 'RESIDENCE' ? 'Résidence' : 'Autres'}
                            </>
                        ) : 'Mes Documents'}
                    </h1>
                    <p className="text-muted-foreground">
                        {currentFolder ? "Gérez les documents de ce dossier." : "Votre coffre-fort numérique intelligent."}
                    </p>
                </div>

                <div className='flex items-center gap-2'>
                    {/* Blur Toggle */}
                    <Button variant="ghost" size="icon" onClick={() => setIsBlurMode(!isBlurMode)} className={isBlurMode ? "text-primary bg-primary/10" : "text-muted-foreground"}>
                        <EyeOff className="w-5 h-5" />
                    </Button>

                    {/* Selection Controls */}
                    {selectionMode ? (
                        <>
                            <Button variant="outline" size="sm" onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }}>
                                Annuler
                            </Button>
                            <Button size="sm" onClick={handleGenerateDossier} disabled={selectedIds.size === 0}>
                                Générer ({selectedIds.size})
                            </Button>
                        </>
                    ) : (
                        <Button variant="outline" size="sm" onClick={() => setSelectionMode(true)}>
                            Sélectionner
                        </Button>
                    )}

                    {/* Document Type Selector */}
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Type de document" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OTHER">Autre (Auto-détection)</SelectItem>
                            <SelectItem value="PHOTO">Photo d'identité</SelectItem>
                            <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
                            <SelectItem value="PASSPORT">Passeport</SelectItem>
                            <SelectItem value="BIRTH_CERTIFICATE">Acte de Naissance</SelectItem>
                            <SelectItem value="RESIDENCE_PERMIT">Carte de Séjour</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Smart Folders View (Root) */}
            {!currentFolder && !uploadingFiles.length && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="neu-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" onClick={() => setCurrentFolder('IDENTITE')}>
                        <div className="mb-3 bg-blue-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Identité</h3>
                        <p className="text-sm text-muted-foreground">{folderStats.IDENTITE} documents</p>
                    </div>
                    <div className="neu-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" onClick={() => setCurrentFolder('ETAT_CIVIL')}>
                        <div className="mb-3 bg-pink-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-pink-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">État Civil</h3>
                        <p className="text-sm text-muted-foreground">{folderStats.ETAT_CIVIL} documents</p>
                    </div>
                    <div className="neu-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" onClick={() => setCurrentFolder('RESIDENCE')}>
                        <div className="mb-3 bg-indigo-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Résidence</h3>
                        <p className="text-sm text-muted-foreground">{folderStats.RESIDENCE} documents</p>
                    </div>
                    <div className="neu-card p-6 rounded-xl cursor-pointer hover:border-primary/50 transition-all group" onClick={() => setCurrentFolder('AUTRE')}>
                        <div className="mb-3 bg-gray-500/10 w-12 h-12 rounded-lg flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform">
                            <FileText className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-lg">Autres</h3>
                        <p className="text-sm text-muted-foreground">{folderStats.AUTRE} documents</p>
                    </div>
                </div>
            )}

            {/* Drag & Drop Zone (Always visible to allow quick add) */}
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragActive
                        ? 'border-primary bg-primary/5 scale-[1.02]'
                        : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30'
                    }
                    ${uploadingFiles.length > 0 ? 'pointer-events-none' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                        <p className="font-semibold">
                            {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez pour classement automatique"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            L'IA détectera le type de document (ex: 'passeport.pdf', 'cni-recto.jpg').
                        </p>
                    </div>
                </div>
            </div>

            {/* Upload Progress List */}
            {uploadingFiles.length > 0 && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl">
                    <p className="text-sm font-medium text-muted-foreground">Envoi en cours...</p>
                    {uploadingFiles.map(file => (
                        <div key={file.id} className="flex items-center gap-3 bg-background p-3 rounded-lg">
                            <div className={`p-2 rounded-lg ${file.status === 'success' ? 'bg-green-500/10 text-green-500' :
                                file.status === 'error' ? 'bg-destructive/10 text-destructive' :
                                    'bg-primary/10 text-primary'
                                }`}>
                                {file.status === 'success' ? (
                                    <Check className="w-4 h-4" />
                                ) : file.status === 'error' ? (
                                    <X className="w-4 h-4" />
                                ) : (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <Progress value={file.progress} className="h-1.5 mt-1" />
                            </div>
                            <span className="text-xs text-muted-foreground w-10 text-right">
                                {file.progress}%
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Document List (Filtered or All) */}
            {documents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Aucun document</h3>
                    <p className="text-muted-foreground mt-1">Commencez par ajouter votre premier document</p>
                </div>
            ) : (
                <>
                    {!currentFolder && <h2 className="text-xl font-semibold mb-4">Tous les documents</h2>}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {groupedDocuments.map((group) => (
                            <DocumentFlipCard
                                key={group.id}
                                group={group}
                                onDelete={setDeleteTarget}
                                onRename={openRenameDialog}
                                onSetExpiration={openExpirationDialog}
                                selectionMode={selectionMode}
                                isSelected={selectedIds.has(group.id)}
                                onToggleSelect={toggleSelection}
                            />
                        ))}
                    </div>
                </>
            )}

            {/* Delete Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer "{deleteTarget?.title}" ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            <Dialog open={!!renameTarget} onOpenChange={(open) => !open && setRenameTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Renommer le document</DialogTitle>
                        <DialogDescription>
                            Entrez le nouveau nom pour ce document.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                        <Label htmlFor="doc-name">Nom du document</Label>
                        <Input
                            id="doc-name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nom du document"
                            onKeyDown={(e) => e.key === 'Enter' && confirmRename()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameTarget(null)}>
                            Annuler
                        </Button>
                        <Button onClick={confirmRename} disabled={!newName.trim()}>
                            Renommer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Expiration Dialog */}
            <Dialog open={!!expirationTarget} onOpenChange={(open) => !open && setExpirationTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Date d'expiration</DialogTitle>
                        <DialogDescription>
                            Définissez la date d'expiration pour "{expirationTarget?.title}".
                            Vous recevrez une alerte avant l'échéance.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="doc-date">Date d'expiration</Label>
                            <div className="flex gap-2">
                                <Input
                                    id="doc-date"
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="flex-1"
                                />
                                {expirationDate && (
                                    <Button variant="ghost" size="icon" onClick={() => setExpirationDate('')} title="Effacer">
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        {expirationDate && (
                            <div className="p-3 bg-muted rounded-lg text-sm">
                                <div className="font-medium mb-1">État prévu :</div>
                                <ExpirationBadge date={expirationDate} docType={uploadType} />
                                {!differenceInDays(new Date(expirationDate), new Date()) &&
                                    <span className="text-muted-foreground ml-2">Valide (plus de 3 mois)</span>
                                }
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExpirationTarget(null)}>
                            Annuler
                        </Button>
                        <Button onClick={confirmExpirationUpdate}>
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Dialog */}
            <Dialog open={!!shareTarget} onOpenChange={(open) => { if (!open) { setShareTarget(null); setShareUrl(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Partager le document de façon sécurisée</DialogTitle>
                        <DialogDescription>
                            Générez un lien temporaire pour "{shareTarget?.title}".
                        </DialogDescription>
                    </DialogHeader>
                    {!shareUrl ? (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Durée de validité</Label>
                                <Select value={shareDuration} onValueChange={setShareDuration}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir une durée" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3600">1 Heure</SelectItem>
                                        <SelectItem value="86400">24 Heures</SelectItem>
                                        <SelectItem value="604800">7 Jours</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full gap-2" onClick={handleShare}>
                                <Link className="w-4 h-4" /> Générer le lien
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4 animate-in fade-in">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg break-all text-xs font-mono">
                                {shareUrl}
                            </div>
                            <Button className="w-full gap-2" variant="secondary" onClick={copyToClipboard}>
                                <Copy className="w-4 h-4" /> Copier le lien
                            </Button>
                            <div className="flex items-center gap-2 text-xs text-green-600 justify-center">
                                <Shield className="w-3 h-3" /> Lien sécurisé généré
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Pre-Upload Review Dialog */}
            <Dialog open={!!pendingUploadFile} onOpenChange={(open) => !open && setPendingUploadFile(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nouveau Document</DialogTitle>
                        <DialogDescription>
                            Vérifiez les informations avant l'enregistrement.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/20">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <FileText className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate">{pendingUploadFile?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                    {pendingUploadFile && (pendingUploadFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                            </div>
                            {ocrLoading && (
                                <div className="flex items-center gap-2 text-sm text-primary">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Analyse IA...
                                </div>
                            )}
                            {!ocrLoading && ocrConfidence !== null && (
                                <Badge variant="outline" className={ocrConfidence > 0.7 ? "border-green-500 text-green-600" : "border-yellow-500 text-yellow-600"}>
                                    IA: {Math.round(ocrConfidence * 100)}%
                                </Badge>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Type de document</Label>
                            <Select value={uploadType} onValueChange={(v) => {
                                const newType = v as DocumentType;
                                setUploadType(newType);
                                // Auto-set expiration based on type
                                if (newType === 'BIRTH_CERTIFICATE') {
                                    setUploadDate(''); // No expiration
                                } else if (newType === 'RESIDENCE_PROOF') {
                                    // Auto-calculate J+90
                                    const futureDate = new Date();
                                    futureDate.setDate(futureDate.getDate() + 90);
                                    setUploadDate(futureDate.toISOString().split('T')[0]);
                                }
                            }}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                    <SelectItem value="PHOTO">Photo d'identité</SelectItem>
                                    <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
                                    <SelectItem value="PASSPORT">Passeport</SelectItem>
                                    <SelectItem value="BIRTH_CERTIFICATE">Acte de Naissance</SelectItem>
                                    <SelectItem value="RESIDENCE_PERMIT">Carte de Séjour</SelectItem>
                                    <SelectItem value="RESIDENCE_PROOF">Justificatif de Domicile</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Date d'expiration</Label>
                            {uploadType === 'BIRTH_CERTIFICATE' ? (
                                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
                                    <Check className="w-4 h-4" />
                                    <span className="text-sm font-medium">Validité illimitée</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={uploadDate}
                                            onChange={(e) => setUploadDate(e.target.value)}
                                        />
                                        {uploadDate && (
                                            <Button variant="ghost" size="icon" onClick={() => setUploadDate('')}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-[0.8rem] text-muted-foreground">
                                        {uploadType === 'RESIDENCE_PROOF'
                                            ? "Date calculée automatiquement (J+90 jours)."
                                            : "Inscrivez la date figurant sur le document."}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setPendingUploadFile(null)}>
                            Annuler
                        </Button>
                        <Button onClick={handleUploadConfirm}>
                            <Upload className="w-4 h-4 mr-2" />
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
