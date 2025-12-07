/**
 * Document Vault Service
 * Manages secure storage and retrieval of user documents
 * NOTE: Uses the existing 'documents' table until 'document_vault' table is created
 */

import { supabase } from '@/integrations/supabase/client';

// Document categories
export type DocumentCategory =
    | 'photo_identity'
    | 'passport'
    | 'birth_certificate'
    | 'residence_proof'
    | 'marriage_certificate'
    | 'family_record'
    | 'diploma'
    | 'cv'
    | 'other';

// Document source
export type DocumentSource =
    | 'upload'
    | 'camera'
    | 'google_drive'
    | 'onedrive'
    | 'dropbox'
    | 'icloud';

// Vault document type
export interface VaultDocument {
    id: string;
    user_id: string;
    name: string;
    original_name: string | null;
    category: DocumentCategory;
    file_path: string;
    file_type: string | null;
    file_size: number | null;
    thumbnail_path: string | null;
    metadata: Record<string, any>;
    is_verified: boolean;
    verification_date: string | null;
    source: DocumentSource;
    last_used_at: string | null;
    created_at: string;
    updated_at: string;
    // Computed property for UI
    public_url?: string;
    thumbnail_url?: string;
}

// Category labels in French
export const CATEGORY_LABELS: Record<DocumentCategory, string> = {
    photo_identity: "Photo d'identité",
    passport: "Passeport",
    birth_certificate: "Acte de naissance",
    residence_proof: "Justificatif de domicile",
    marriage_certificate: "Acte de mariage",
    family_record: "Livret de famille",
    diploma: "Diplôme",
    cv: "CV",
    other: "Autre document"
};

// Category icons (Lucide icon names)
export const CATEGORY_ICONS: Record<DocumentCategory, string> = {
    photo_identity: "User",
    passport: "CreditCard",
    birth_certificate: "Baby",
    residence_proof: "Home",
    marriage_certificate: "Heart",
    family_record: "Users",
    diploma: "GraduationCap",
    cv: "FileText",
    other: "File"
};

const STORAGE_BUCKET = 'documents-presidentiels';

/**
 * Upload a document to the vault
 * Uses the existing 'documents' table
 */
export async function uploadToVault(
    file: File,
    category: DocumentCategory,
    options?: {
        name?: string;
        source?: DocumentSource;
        metadata?: Record<string, any>;
    }
): Promise<{ data: VaultDocument | null; error: Error | null }> {
    try {
        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            throw new Error('Utilisateur non authentifié');
        }

        // Generate unique file path
        const fileExt = file.name.split('.').pop() || 'bin';
        const timestamp = Date.now();
        const filePath = `${user.id}/${category}/${timestamp}.${fileExt}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            throw new Error(`Erreur d'upload: ${uploadError.message}`);
        }

        // Create database record using existing 'documents' table
        const documentData = {
            user_id: user.id,
            name: options?.name || file.name.replace(/\.[^/.]+$/, ''),
            file_path: filePath,
            file_type: file.type,
            file_size: file.size,
            category: category
        };

        const { data, error: insertError } = await supabase
            .from('documents')
            .insert(documentData)
            .select()
            .single();

        if (insertError) {
            // Cleanup uploaded file if DB insert fails
            await supabase.storage.from(STORAGE_BUCKET).remove([filePath]);
            throw new Error(`Erreur de sauvegarde: ${insertError.message}`);
        }

        // Add public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        // Map the 'documents' table record to VaultDocument interface
        const vaultDoc: VaultDocument = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            original_name: file.name,
            category: (data.category || 'other') as DocumentCategory,
            file_path: data.file_path,
            file_type: data.file_type,
            file_size: data.file_size,
            thumbnail_path: null,
            metadata: options?.metadata || {},
            is_verified: false,
            verification_date: null,
            source: options?.source || 'upload',
            last_used_at: null,
            created_at: data.created_at,
            updated_at: data.updated_at,
            public_url: urlData.publicUrl
        };

        return {
            data: vaultDoc,
            error: null
        };

    } catch (error) {
        console.error('[DocumentVault] Upload error:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Get all documents in the vault
 */
export async function getVaultDocuments(
    options?: {
        category?: DocumentCategory;
        limit?: number;
        orderBy?: 'created_at' | 'last_used_at' | 'name';
    }
): Promise<{ data: VaultDocument[]; error: Error | null }> {
    try {
        let query = supabase
            .from('documents')
            .select('*')
            .order(options?.orderBy === 'last_used_at' ? 'updated_at' : (options?.orderBy || 'created_at'), { ascending: false });

        if (options?.category) {
            query = query.eq('category', options.category);
        }

        if (options?.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(error.message);
        }

        // Map to VaultDocument with public URLs
        const documentsWithUrls = (data || []).map(doc => {
            const { data: urlData } = supabase.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(doc.file_path);

            const vaultDoc: VaultDocument = {
                id: doc.id,
                user_id: doc.user_id,
                name: doc.name,
                original_name: doc.name,
                category: (doc.category || 'other') as DocumentCategory,
                file_path: doc.file_path,
                file_type: doc.file_type,
                file_size: doc.file_size,
                thumbnail_path: null,
                metadata: {},
                is_verified: false,
                verification_date: null,
                source: 'upload',
                last_used_at: doc.updated_at,
                created_at: doc.created_at,
                updated_at: doc.updated_at,
                public_url: urlData.publicUrl
            };
            return vaultDoc;
        });

        return { data: documentsWithUrls, error: null };

    } catch (error) {
        console.error('[DocumentVault] Get documents error:', error);
        return { data: [], error: error as Error };
    }
}

/**
 * Get a single document by ID
 */
export async function getVaultDocument(id: string): Promise<{ data: VaultDocument | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            throw new Error(error.message);
        }

        // Add public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.file_path);

        const vaultDoc: VaultDocument = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            original_name: data.name,
            category: (data.category || 'other') as DocumentCategory,
            file_path: data.file_path,
            file_type: data.file_type,
            file_size: data.file_size,
            thumbnail_path: null,
            metadata: {},
            is_verified: false,
            verification_date: null,
            source: 'upload',
            last_used_at: data.updated_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            public_url: urlData.publicUrl
        };

        return {
            data: vaultDoc,
            error: null
        };

    } catch (error) {
        console.error('[DocumentVault] Get document error:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Delete a document from the vault
 */
export async function deleteVaultDocument(id: string): Promise<{ success: boolean; error: Error | null }> {
    try {
        // Get document to find file path
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', id)
            .single();

        if (fetchError) {
            throw new Error(fetchError.message);
        }

        // Delete from storage
        const { error: storageError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([doc.file_path]);

        if (storageError) {
            console.warn('[DocumentVault] Storage delete warning:', storageError);
        }

        // Delete database record
        const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

        if (deleteError) {
            throw new Error(deleteError.message);
        }

        return { success: true, error: null };

    } catch (error) {
        console.error('[DocumentVault] Delete error:', error);
        return { success: false, error: error as Error };
    }
}

/**
 * Mark a document as recently used
 */
export async function markDocumentUsed(id: string): Promise<void> {
    await supabase
        .from('documents')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id);
}

/**
 * Get recently used documents
 */
export async function getRecentDocuments(limit: number = 5): Promise<{ data: VaultDocument[]; error: Error | null }> {
    return getVaultDocuments({
        orderBy: 'created_at',
        limit
    });
}

/**
 * Update document metadata
 */
export async function updateVaultDocument(
    id: string,
    updates: Partial<Pick<VaultDocument, 'name' | 'category'>>
): Promise<{ data: VaultDocument | null; error: Error | null }> {
    try {
        const { data, error } = await supabase
            .from('documents')
            .update({
                name: updates.name,
                category: updates.category
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(error.message);
        }

        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.file_path);

        const vaultDoc: VaultDocument = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            original_name: data.name,
            category: (data.category || 'other') as DocumentCategory,
            file_path: data.file_path,
            file_type: data.file_type,
            file_size: data.file_size,
            thumbnail_path: null,
            metadata: {},
            is_verified: false,
            verification_date: null,
            source: 'upload',
            last_used_at: data.updated_at,
            created_at: data.created_at,
            updated_at: data.updated_at,
            public_url: urlData.publicUrl
        };

        return { data: vaultDoc, error: null };

    } catch (error) {
        console.error('[DocumentVault] Update error:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Download document as blob
 */
export async function downloadVaultDocument(id: string): Promise<{ data: Blob | null; error: Error | null }> {
    try {
        const { data: doc, error: fetchError } = await getVaultDocument(id);

        if (fetchError || !doc) {
            throw fetchError || new Error('Document not found');
        }

        const { data, error: downloadError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .download(doc.file_path);

        if (downloadError) {
            throw new Error(downloadError.message);
        }

        // Mark as used
        await markDocumentUsed(id);

        return { data, error: null };

    } catch (error) {
        console.error('[DocumentVault] Download error:', error);
        return { data: null, error: error as Error };
    }
}

/**
 * Check if a category has documents
 */
export async function hasCategoryDocuments(category: DocumentCategory): Promise<boolean> {
    const { data } = await supabase
        .from('documents')
        .select('id')
        .eq('category', category)
        .limit(1);

    return (data?.length || 0) > 0;
}

/**
 * Get document count by category
 */
export async function getDocumentCounts(): Promise<Record<DocumentCategory, number>> {
    const counts: Record<DocumentCategory, number> = {
        photo_identity: 0,
        passport: 0,
        birth_certificate: 0,
        residence_proof: 0,
        marriage_certificate: 0,
        family_record: 0,
        diploma: 0,
        cv: 0,
        other: 0
    };

    const { data } = await supabase
        .from('documents')
        .select('category');

    (data || []).forEach(doc => {
        const cat = doc.category as DocumentCategory;
        if (cat && cat in counts) {
            counts[cat]++;
        }
    });

    return counts;
}