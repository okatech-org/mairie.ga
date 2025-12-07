
import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, DocumentType } from '@/types/document';
import { documentService } from '@/services/document-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { FileText, Upload, Trash2, Eye, Loader2, FileIcon, Pencil, X, Check } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface UploadingFile {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
}

export default function CitizenDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [selectedType, setSelectedType] = useState<DocumentType>('OTHER');
    const [deleteTarget, setDeleteTarget] = useState<Document | null>(null);
    const [renameTarget, setRenameTarget] = useState<Document | null>(null);
    const [newName, setNewName] = useState('');

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

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleUpload(acceptedFiles);
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
                    <img
                        src={doc.thumbnailUrl}
                        alt={doc.title}
                        className="w-full h-full object-cover"
                        onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
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

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold">Mes Documents</h1>
                    <p className="text-muted-foreground">Gérez vos documents officiels et justificatifs.</p>
                </div>
                <div className='flex items-center gap-2'>
                    <Select value={selectedType} onValueChange={(v) => setSelectedType(v as DocumentType)}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Type de document" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="OTHER">Autre</SelectItem>
                            <SelectItem value="PHOTO">Photo d'identité</SelectItem>
                            <SelectItem value="ID_CARD">Carte d'identité</SelectItem>
                            <SelectItem value="PASSPORT">Passeport</SelectItem>
                            <SelectItem value="BIRTH_CERTIFICATE">Acte de Naissance</SelectItem>
                            <SelectItem value="RESIDENCE_PERMIT">Carte de Séjour</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Drag & Drop Zone */}
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
                            {isDragActive ? "Déposez les fichiers ici" : "Glissez-déposez vos documents ici"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            ou cliquez pour sélectionner • Plusieurs fichiers acceptés • PDF, JPG, PNG (max 5MB)
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

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : documents.length === 0 ? (
                <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Aucun document</h3>
                    <p className="text-muted-foreground mt-1">Commencez par ajouter votre premier document</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {documents.map((doc) => (
                        <div key={doc.id} className="neu-card p-4 rounded-xl space-y-3 flex flex-col group hover:border-primary/50 transition-all hover:shadow-lg">
                            <DocumentThumbnail doc={doc} />

                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between items-start gap-2">
                                    <h3 className="font-semibold text-sm line-clamp-2" title={doc.title}>
                                        {doc.title}
                                    </h3>
                                    {getStatusBadge(doc.status)}
                                </div>

                                <p className="text-xs text-muted-foreground">{getTypeLabel(doc.type)}</p>

                                <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{doc.uploadDate}</span>
                                    {doc.size && (
                                        <>
                                            <span>•</span>
                                            <span>{doc.size}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-1 pt-2 border-t">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="flex-1 gap-1.5 text-xs"
                                    onClick={() => window.open(doc.url, '_blank')}
                                >
                                    <Eye className="w-3.5 h-3.5" /> Voir
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-xs"
                                    onClick={() => openRenameDialog(doc)}
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteTarget(doc)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
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
        </div>
    );
}
