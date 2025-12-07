/**
 * File System Access Hook
 * Provides access to local file system via File System Access API
 * with fallback to standard file input for unsupported browsers
 */

import { useState, useCallback, useRef } from 'react';
import { DocumentCategory } from '@/services/documentVaultService';

export interface SelectedFile {
    file: File;
    preview?: string;
    suggestedCategory?: DocumentCategory;
}

interface UseFileSystemAccessOptions {
    accept?: string;
    multiple?: boolean;
    maxSizeBytes?: number;
}

interface UseFileSystemAccessReturn {
    pickFiles: () => Promise<SelectedFile[]>;
    pickFile: () => Promise<SelectedFile | null>;
    isSupported: boolean;
    isLoading: boolean;
    error: string | null;
    clearError: () => void;
}

// Detect category from file name
function detectCategoryFromFileName(fileName: string): DocumentCategory | undefined {
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes('photo') || lowerName.includes('identite') || lowerName.includes('identity')) {
        return 'photo_identity';
    }
    if (lowerName.includes('passeport') || lowerName.includes('passport')) {
        return 'passport';
    }
    if (lowerName.includes('naissance') || lowerName.includes('birth')) {
        return 'birth_certificate';
    }
    if (lowerName.includes('domicile') || lowerName.includes('residence') || lowerName.includes('facture') || lowerName.includes('edf') || lowerName.includes('quittance')) {
        return 'residence_proof';
    }
    if (lowerName.includes('mariage') || lowerName.includes('marriage')) {
        return 'marriage_certificate';
    }
    if (lowerName.includes('livret') || lowerName.includes('famille') || lowerName.includes('family')) {
        return 'family_record';
    }
    if (lowerName.includes('diplome') || lowerName.includes('diploma') || lowerName.includes('certificat')) {
        return 'diploma';
    }
    if (lowerName.includes('cv') || lowerName.includes('curriculum')) {
        return 'cv';
    }

    return undefined;
}

// Create preview URL for images
function createPreview(file: File): string | undefined {
    if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
    }
    return undefined;
}

export function useFileSystemAccess(options: UseFileSystemAccessOptions = {}): UseFileSystemAccessReturn {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const {
        accept = 'image/*,.pdf,.doc,.docx',
        multiple = false,
        maxSizeBytes = 10 * 1024 * 1024 // 10MB default
    } = options;

    // Check if File System Access API is supported
    const isSupported = typeof window !== 'undefined' && 'showOpenFilePicker' in window;

    const clearError = useCallback(() => setError(null), []);

    // Process files and add metadata
    const processFiles = useCallback((files: File[]): SelectedFile[] => {
        return files.map(file => {
            // Check file size
            if (file.size > maxSizeBytes) {
                throw new Error(`Le fichier "${file.name}" dépasse la taille maximale autorisée (${Math.round(maxSizeBytes / 1024 / 1024)}MB)`);
            }

            return {
                file,
                preview: createPreview(file),
                suggestedCategory: detectCategoryFromFileName(file.name)
            };
        });
    }, [maxSizeBytes]);

    // Modern File System Access API method
    const pickFilesModern = useCallback(async (): Promise<SelectedFile[]> => {
        try {
            // Parse accept types for the API
            const types = accept.split(',').map(type => {
                const trimmed = type.trim();
                if (trimmed.startsWith('.')) {
                    return { accept: { 'application/octet-stream': [trimmed] } };
                }
                return { accept: { [trimmed]: [] } };
            });

            const handles = await (window as any).showOpenFilePicker({
                multiple,
                types,
                excludeAcceptAllOption: false
            });

            const files = await Promise.all(
                handles.map((handle: any) => handle.getFile())
            );

            return processFiles(files);
        } catch (err: any) {
            if (err.name === 'AbortError') {
                // User cancelled - not an error
                return [];
            }
            throw err;
        }
    }, [accept, multiple, processFiles]);

    // Fallback method using input element
    const pickFilesFallback = useCallback((): Promise<SelectedFile[]> => {
        return new Promise((resolve, reject) => {
            // Create hidden input if not exists
            if (!inputRef.current) {
                inputRef.current = document.createElement('input');
                inputRef.current.type = 'file';
                inputRef.current.style.display = 'none';
                document.body.appendChild(inputRef.current);
            }

            const input = inputRef.current;
            input.accept = accept;
            input.multiple = multiple;

            const handleChange = () => {
                const files = Array.from(input.files || []);
                input.value = ''; // Reset for next use

                try {
                    resolve(processFiles(files));
                } catch (err) {
                    reject(err);
                }
            };

            const handleCancel = () => {
                // Detect cancel by checking if no files selected after a delay
                setTimeout(() => {
                    if (!input.files?.length) {
                        resolve([]);
                    }
                }, 500);
            };

            input.onchange = handleChange;
            input.oncancel = handleCancel;
            input.click();
        });
    }, [accept, multiple, processFiles]);

    // Main pick files function
    const pickFiles = useCallback(async (): Promise<SelectedFile[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const files = isSupported
                ? await pickFilesModern()
                : await pickFilesFallback();

            return files;
        } catch (err: any) {
            const errorMessage = err.message || 'Erreur lors de la sélection des fichiers';
            setError(errorMessage);
            console.error('[FileSystemAccess] Error:', err);
            return [];
        } finally {
            setIsLoading(false);
        }
    }, [isSupported, pickFilesModern, pickFilesFallback]);

    // Pick single file convenience method
    const pickFile = useCallback(async (): Promise<SelectedFile | null> => {
        const files = await pickFiles();
        return files.length > 0 ? files[0] : null;
    }, [pickFiles]);

    return {
        pickFiles,
        pickFile,
        isSupported,
        isLoading,
        error,
        clearError
    };
}

/**
 * Hook for drag and drop file handling
 */
export function useFileDrop(onFilesDropped: (files: SelectedFile[]) => void) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        const processedFiles: SelectedFile[] = files.map(file => ({
            file,
            preview: createPreview(file),
            suggestedCategory: detectCategoryFromFileName(file.name)
        }));

        onFilesDropped(processedFiles);
    }, [onFilesDropped]);

    return {
        isDragging,
        dragHandlers: {
            onDragEnter: handleDragEnter,
            onDragLeave: handleDragLeave,
            onDragOver: handleDragOver,
            onDrop: handleDrop
        }
    };
}
