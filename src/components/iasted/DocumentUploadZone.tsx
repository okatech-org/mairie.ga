import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image, File, X, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    analyzeDocument,
    DocumentAnalysis,
    DocumentType,
    detectDocumentType
} from '@/services/documentOCRService';

interface UploadedFile {
    id: string;
    file: File;
    status: 'uploading' | 'analyzing' | 'completed' | 'error';
    progress: number;
    analysis?: DocumentAnalysis;
    error?: string;
    suggestedType?: DocumentType;
}

interface DocumentUploadZoneProps {
    onDocumentAnalyzed?: (documentId: string, analysis: DocumentAnalysis) => void;
    onFileSelect?: (file: File) => Promise<void>;
    onFilesAdded?: (files: UploadedFile[]) => void;
    isProcessing?: boolean;
    label?: string;
    mode?: 'standard' | 'assisted'; // 'assisted' uses direct OCR
}

export const DocumentUploadZone: React.FC<DocumentUploadZoneProps> = ({
    onDocumentAnalyzed,
    onFilesAdded,
    mode = 'assisted' // Default to new assisted mode with direct OCR
}) => {
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const { toast } = useToast();

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        // Validation des fichiers
        const validFiles = acceptedFiles.filter(file => {
            const maxSize = 10 * 1024 * 1024; // 10MB
            const validTypes = [
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/msword',
            ];

            if (file.size > maxSize) {
                toast({
                    title: 'Fichier trop volumineux',
                    description: `${file.name} dépasse la limite de 10MB`,
                    variant: 'destructive',
                });
                return false;
            }

            if (!validTypes.includes(file.type)) {
                toast({
                    title: 'Type de fichier non supporté',
                    description: `${file.name} n'est pas un PDF, image ou document Word`,
                    variant: 'destructive',
                });
                return false;
            }

            return true;
        });

        // Ajouter les fichiers à la liste avec statut 'uploading'
        const newFiles: UploadedFile[] = validFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'uploading',
            progress: 0,
            suggestedType: detectDocumentType(file.name)
        }));

        setFiles(prev => [...prev, ...newFiles]);

        // Notify parent of new files
        if (onFilesAdded) {
            onFilesAdded(newFiles);
        }

        // Process files based on mode
        for (const uploadedFile of newFiles) {
            if (mode === 'assisted') {
                await analyzeFileDirectly(uploadedFile);
            } else {
                await uploadAndAnalyzeFile(uploadedFile);
            }
        }
    }, [toast, onFilesAdded, mode]);

    /**
     * Analyze file directly using documentOCRService (no upload required)
     * With enhanced progress indication
     */
    const analyzeFileDirectly = async (uploadedFile: UploadedFile) => {
        try {
            // Step 1: Uploading animation
            updateFileStatus(uploadedFile.id, 'uploading', 15);
            await new Promise(r => setTimeout(r, 300));
            
            // Step 2: Scanning
            updateFileStatus(uploadedFile.id, 'analyzing', 35);
            await new Promise(r => setTimeout(r, 200));

            // Step 3: Extracting - actual OCR call
            updateFileStatus(uploadedFile.id, 'analyzing', 55);
            
            const analysis = await analyzeDocument(
                uploadedFile.file,
                uploadedFile.suggestedType
            );

            // Step 4: Validating
            updateFileStatus(uploadedFile.id, 'analyzing', 85);
            await new Promise(r => setTimeout(r, 200));

            if (analysis.error) {
                throw new Error(analysis.error);
            }

            // Step 5: Complete
            updateFileStatus(uploadedFile.id, 'completed', 100, analysis);

            const extractedCount = analysis.extractedData 
                ? Object.keys(analysis.extractedData).length 
                : 0;

            toast({
                title: '✅ Document analysé avec succès',
                description: `${uploadedFile.file.name} - ${extractedCount} champs extraits`,
            });

            // Callback with results
            if (onDocumentAnalyzed) {
                onDocumentAnalyzed(uploadedFile.id, analysis);
            }

        } catch (error: any) {
            console.error('Error analyzing file:', error);
            updateFileStatus(uploadedFile.id, 'error', 0, undefined, error.message);

            toast({
                title: 'Erreur d\'analyse',
                description: `Impossible d'analyser ${uploadedFile.file.name}`,
                variant: 'destructive',
            });
        }
    };

    /**
     * Upload and analyze via Edge Function (legacy mode)
     */
    const uploadAndAnalyzeFile = async (uploadedFile: UploadedFile) => {
        try {
            updateFileStatus(uploadedFile.id, 'uploading', 25);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const filePath = `${user.id}/${Date.now()}_${uploadedFile.file.name}`;

            const { error: uploadError } = await supabase.storage
                .from('documents-presidentiels')
                .upload(filePath, uploadedFile.file);

            if (uploadError) throw uploadError;

            updateFileStatus(uploadedFile.id, 'uploading', 50);

            const { data: document, error: docError } = await supabase
                .from('documents')
                .insert({
                    user_id: user.id,
                    name: uploadedFile.file.name,
                    file_path: filePath,
                    file_type: uploadedFile.file.type,
                    file_size: uploadedFile.file.size,
                } as any)
                .select()
                .single();

            if (docError || !document) throw docError || new Error('Failed to create document record');

            updateFileStatus(uploadedFile.id, 'analyzing', 75);

            const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
                'document-ocr',
                { body: { documentId: document.id } }
            );

            if (analysisError) throw analysisError;

            updateFileStatus(uploadedFile.id, 'completed', 100, analysisResult.analysis);

            toast({
                title: '✅ Document analysé',
                description: `${uploadedFile.file.name} a été traité avec succès`,
            });

            if (onDocumentAnalyzed) {
                onDocumentAnalyzed(document.id, analysisResult.analysis);
            }

        } catch (error: any) {
            console.error('Error uploading/analyzing file:', error);
            updateFileStatus(uploadedFile.id, 'error', 0, undefined, error.message);

            toast({
                title: 'Erreur',
                description: `Impossible de traiter ${uploadedFile.file.name}`,
                variant: 'destructive',
            });
        }
    };

    const updateFileStatus = (
        fileId: string,
        status: UploadedFile['status'],
        progress: number,
        analysis?: any,
        error?: string
    ) => {
        setFiles(prev =>
            prev.map(f =>
                f.id === fileId
                    ? { ...f, status, progress, analysis, error }
                    : f
            )
        );
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        multiple: true,
    });

    const getFileIcon = (file: File) => {
        if (file.type === 'application/pdf') return <FileText className="w-8 h-8" />;
        if (file.type.startsWith('image/')) return <Image className="w-8 h-8" />;
        return <File className="w-8 h-8" />;
    };

    const getStatusColor = (status: UploadedFile['status']) => {
        switch (status) {
            case 'uploading': return 'text-blue-500';
            case 'analyzing': return 'text-yellow-500';
            case 'completed': return 'text-green-500';
            case 'error': return 'text-red-500';
        }
    };

    const getStatusLabel = (status: UploadedFile['status']) => {
        switch (status) {
            case 'uploading': return 'Upload en cours...';
            case 'analyzing': return 'Analyse IA...';
            case 'completed': return 'Terminé';
            case 'error': return 'Erreur';
        }
    };

    return (
        <div className="space-y-4">
            {/* Zone de drop */}
            <Card
                {...getRootProps()}
                className={`p-8 border-2 border-dashed cursor-pointer transition-all ${isDragActive
                    ? 'border-primary bg-primary/5 shadow-lg scale-105'
                    : 'border-border hover:border-primary/50 hover:bg-muted/30'
                    }`}
            >
                <input {...getInputProps()} />
                <CardContent className="flex flex-col items-center justify-center text-center space-y-4 p-0">
                    <Upload className={`w-12 h-12 ${isDragActive ? 'text-primary animate-bounce' : 'text-muted-foreground'}`} />
                    <div>
                        <p className="text-lg font-semibold">
                            {isDragActive ? 'Déposez les fichiers ici' : 'Glissez-déposez des documents'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            PDF, Images (JPG, PNG) ou Documents Word • Max 10MB
                        </p>
                    </div>
                    <Button variant="outline" size="sm" type="button">
                        Ou cliquez pour parcourir
                    </Button>
                </CardContent>
            </Card>

            {/* Liste des fichiers uploadés */}
            <AnimatePresence>
                {files.map(uploadedFile => (
                    <motion.div
                        key={uploadedFile.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Card>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icône avec animation améliorée */}
                                    <div className={`flex-shrink-0 ${getStatusColor(uploadedFile.status)}`}>
                                        {uploadedFile.status === 'completed' ? (
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                            >
                                                <CheckCircle className="w-8 h-8" />
                                            </motion.div>
                                        ) : uploadedFile.status === 'uploading' || uploadedFile.status === 'analyzing' ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            >
                                                <Loader2 className="w-8 h-8" />
                                            </motion.div>
                                        ) : (
                                            getFileIcon(uploadedFile.file)
                                        )}
                                    </div>

                                    {/* Informations */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{uploadedFile.file.name}</p>
                                        <p className={`text-xs mt-1 ${getStatusColor(uploadedFile.status)}`}>
                                            {getStatusLabel(uploadedFile.status)}
                                            {uploadedFile.status === 'analyzing' && (
                                                <span className="ml-1 inline-flex">
                                                    <motion.span
                                                        animate={{ opacity: [0, 1, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                                                    >.</motion.span>
                                                    <motion.span
                                                        animate={{ opacity: [0, 1, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                                                    >.</motion.span>
                                                    <motion.span
                                                        animate={{ opacity: [0, 1, 0] }}
                                                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                                                    >.</motion.span>
                                                </span>
                                            )}
                                        </p>

                                        {/* Progress bar améliorée avec effet shimmer */}
                                        {uploadedFile.status !== 'completed' && uploadedFile.status !== 'error' && (
                                            <div className="relative mt-2">
                                                <Progress value={uploadedFile.progress} className="h-1.5" />
                                                <motion.div
                                                    className="absolute inset-0 h-1.5 rounded-full overflow-hidden"
                                                    style={{
                                                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                                        backgroundSize: '200% 100%'
                                                    }}
                                                    animate={{
                                                        backgroundPosition: ['100% 0%', '-100% 0%']
                                                    }}
                                                    transition={{
                                                        duration: 1.5,
                                                        repeat: Infinity,
                                                        ease: 'linear'
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Résumé de l'analyse */}
                                        {uploadedFile.status === 'completed' && uploadedFile.analysis && (
                                            <div className="mt-2 p-2 bg-muted rounded text-xs space-y-1">
                                                <p><strong>Type:</strong> {uploadedFile.analysis.documentType}</p>
                                                <p><strong>Confiance:</strong> {Math.round(uploadedFile.analysis.confidence * 100)}%</p>
                                                {uploadedFile.analysis.uncertainFields && uploadedFile.analysis.uncertainFields.length > 0 && (
                                                    <p><strong>Champs incertains:</strong> {uploadedFile.analysis.uncertainFields.length}</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Message d'erreur */}
                                        {uploadedFile.status === 'error' && uploadedFile.error && (
                                            <p className="mt-2 text-xs text-red-500">{uploadedFile.error}</p>
                                        )}
                                    </div>

                                    {/* Bouton supprimer */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(uploadedFile.id)}
                                        className="flex-shrink-0"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
