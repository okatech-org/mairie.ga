import { useEffect, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Document, DocumentType } from '@/types/document';
import { documentService } from '@/services/document-service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, Trash2, Eye, Loader2, FileIcon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function CitizenDocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedType, setSelectedType] = useState<DocumentType>('OTHER');

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

    const handleUpload = async (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Le fichier est trop volumineux (max 5MB)");
            return;
        }

        setIsUploading(true);
        try {
            const newDoc = await documentService.uploadDocument(file, selectedType);
            setDocuments(prev => [newDoc, ...prev]);
            toast.success("Document ajouté avec succès");
        } catch (error: any) {
            console.error("Upload failed", error);
            toast.error(error.message || "Erreur lors de l'envoi du document");
        } finally {
            setIsUploading(false);
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            handleUpload(acceptedFiles[0]);
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
        maxFiles: 1,
        disabled: isUploading
    });

    const handleDelete = async (id: string) => {
        try {
            await documentService.deleteDocument(id);
            toast.success("Document supprimé");
            setDocuments(prev => prev.filter(d => d.id !== id));
        } catch (error) {
            toast.error("Erreur lors de la suppression");
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
                    ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-3">
                    {isUploading ? (
                        <div className="p-4 bg-primary/10 rounded-full">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <div className={`p-4 rounded-full transition-colors ${isDragActive ? 'bg-primary/20' : 'bg-muted'}`}>
                            <Upload className={`w-8 h-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                    )}
                    <div>
                        <p className="font-semibold">
                            {isUploading 
                                ? "Envoi en cours..." 
                                : isDragActive 
                                    ? "Déposez le fichier ici" 
                                    : "Glissez-déposez un document ici"
                            }
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {!isUploading && "ou cliquez pour sélectionner • PDF, JPG, PNG (max 5MB)"}
                        </p>
                    </div>
                </div>
            </div>

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

                            <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex-1 gap-2 text-xs" 
                                    onClick={() => window.open(doc.url, '_blank')}
                                >
                                    <Eye className="w-3.5 h-3.5" /> Voir
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="gap-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10" 
                                    onClick={() => handleDelete(doc.id)}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
