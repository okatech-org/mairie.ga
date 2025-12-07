
import { supabase } from '@/integrations/supabase/client';
import { Document, DocumentType, DocumentStatus } from '@/types/document';

const BUCKET_NAME = 'documents';

// Map our DocumentType to category strings for the database (Matching authService uses)
const typeToCategory: Record<DocumentType, string> = {
    'ID_CARD': 'CNI',
    'PASSPORT': 'PASSEPORT',
    'BIRTH_CERTIFICATE': 'ACTE_NAISSANCE',
    'RESIDENCE_PERMIT': 'CARTE_SEJOUR',
    'PHOTO': 'PHOTO_IDENTITE',
    'OTHER': 'user_upload'
};

// Map category back to DocumentType
const categoryToType = (category: string): DocumentType => {
    switch (category) {
        case 'CNI': return 'ID_CARD';
        case 'PASSEPORT': return 'PASSPORT';
        case 'ACTE_NAISSANCE': return 'BIRTH_CERTIFICATE';
        case 'CARTE_SEJOUR': return 'RESIDENCE_PERMIT';
        case 'PHOTO_IDENTITE': return 'PHOTO';
        case 'identity': return 'ID_CARD'; // Backwards compatibility if needed
        default: return 'OTHER';
    }
};

// Transform database row to Document type
const transformToDocument = async (row: any): Promise<Document> => {
    let url = '#';

    // Get signed URL. For public bucket we could use getPublicUrl but signed adds security if bucket changes to private.
    // However, user specifically created 'documents' as public. Let's use getPublicUrl for speed/simplicity or signed if preferred.
    // Current code used getPublicUrl in local, signedUrl in remote.
    // We will use signedUrl to match the HEAD style, but handle public bucket gracefully.

    if (row.file_path) {
        const { data } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(row.file_path, 3600); // 1 hour expiry
        if (data?.signedUrl) {
            url = data.signedUrl;
        } else {
            // Fallback to public URL if signing fails or just as preferred for public bucket
            const { data: publicData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(row.file_path);
            url = publicData.publicUrl;
        }
    }

    return {
        id: row.id,
        title: row.name || row.original_name || 'Document',
        type: categoryToType(row.category),
        uploadDate: new Date(row.created_at).toISOString().split('T')[0],
        status: (row.is_verified ? 'VERIFIED' : 'PENDING') as DocumentStatus, // Assuming we want verification logic eventually
        url,
        size: row.file_size ? `${(row.file_size / (1024 * 1024)).toFixed(2)} MB` : undefined,
        thumbnailUrl: url, // Use same URL for thumbnail (works for images)
        fileType: row.file_type
    };
};

export const documentService = {
    getMyDocuments: async (): Promise<Document[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn('No authenticated user, returning empty documents');
            return [];
        }

        const { data, error } = await supabase
            .from('documents') // Correct table
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }

        // Transform all documents
        const documents = await Promise.all((data || []).map(transformToDocument));
        return documents;
    },

    uploadDocument: async (file: File, type: DocumentType): Promise<Document> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User must be authenticated to upload documents');
        }

        // Create unique file path
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${type}_${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Storage upload error:', uploadError);
            throw uploadError;
        }

        // Insert record in documents table
        const { data, error: dbError } = await supabase
            .from('documents')
            .insert({
                user_id: user.id,
                name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
                // original_name: file.name, // 'documents' table might not have original_name, check schema? Local didn't send it. Remote did. 'documents' table usually simpler.
                // Checking local previous use: insert({ name, file_path, file_type, file_size, category }). No original_name.
                // We'll skip original_name to be safe or check schema. Safe to skip if not in local interface.
                file_path: fileName,
                file_type: file.type,
                file_size: file.size,
                category: typeToCategory[type],
                // source: 'upload', // Not in local 'documents' schema
                // is_verified: false // Not in local 'documents' schema
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database insert error:', dbError);
            // Try to clean up uploaded file
            await supabase.storage.from(BUCKET_NAME).remove([fileName]);
            throw dbError;
        }

        return transformToDocument(data);
    },

    deleteDocument: async (id: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User must be authenticated to delete documents');
        }

        // Get the document first to get file path
        const { data: doc, error: fetchError } = await supabase
            .from('documents')
            .select('file_path')
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (fetchError) {
            console.error('Error fetching document for deletion:', fetchError);
            throw fetchError;
        }

        // Delete from storage
        if (doc?.file_path) {
            const { error: storageError } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([doc.file_path]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
            }
        }

        // Delete from database
        const { error: dbError } = await supabase
            .from('documents')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (dbError) {
            console.error('Database deletion error:', dbError);
            throw dbError;
        }
    },

    getDocumentUrl: async (filePath: string): Promise<string | null> => {
        const { data } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(filePath, 3600);

        return data?.signedUrl || null;
    },

    renameDocument: async (id: string, newName: string): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            throw new Error('User must be authenticated to rename documents');
        }

        // 'documents' table usually has 'name' column.
        const { error } = await supabase
            .from('documents')
            .update({ name: newName }) // Removed updated_at if not sure it exists
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Rename error:', error);
            throw error;
        }
    }
};
