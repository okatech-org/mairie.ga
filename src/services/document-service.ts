import { supabase } from '@/integrations/supabase/client';
import { Document, DocumentType, DocumentStatus } from '@/types/document';

const BUCKET_NAME = 'document-vault';

// Map our DocumentType to category strings for the database
const typeToCategory: Record<DocumentType, string> = {
    'ID_CARD': 'identity',
    'PASSPORT': 'identity',
    'BIRTH_CERTIFICATE': 'civil_status',
    'RESIDENCE_PERMIT': 'residence',
    'PHOTO': 'photo',
    'OTHER': 'other'
};

// Map category back to DocumentType
const categoryToType = (category: string): DocumentType => {
    switch (category) {
        case 'identity': return 'ID_CARD';
        case 'civil_status': return 'BIRTH_CERTIFICATE';
        case 'residence': return 'RESIDENCE_PERMIT';
        case 'photo': return 'PHOTO';
        default: return 'OTHER';
    }
};

// Transform database row to Document type
const transformToDocument = async (row: any): Promise<Document> => {
    let url = '#';
    
    // Get signed URL for private bucket
    if (row.file_path) {
        const { data } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(row.file_path, 3600); // 1 hour expiry
        if (data?.signedUrl) {
            url = data.signedUrl;
        }
    }

    return {
        id: row.id,
        title: row.name || row.original_name || 'Document',
        type: categoryToType(row.category),
        uploadDate: new Date(row.created_at).toISOString().split('T')[0],
        status: row.is_verified ? 'VERIFIED' : 'PENDING' as DocumentStatus,
        url,
        size: row.file_size ? `${(row.file_size / (1024 * 1024)).toFixed(2)} MB` : undefined,
        thumbnailUrl: url, // Use same URL for thumbnail
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
            .from('document_vault')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }

        // Transform all documents with signed URLs
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
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

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

        // Insert record in document_vault table
        const { data, error: dbError } = await supabase
            .from('document_vault')
            .insert({
                user_id: user.id,
                name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension for display name
                original_name: file.name,
                file_path: fileName,
                file_type: file.type,
                file_size: file.size,
                category: typeToCategory[type],
                source: 'upload',
                is_verified: false
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
            .from('document_vault')
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
            .from('document_vault')
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

        const { error } = await supabase
            .from('document_vault')
            .update({ name: newName, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error('Rename error:', error);
            throw error;
        }
    }
};
