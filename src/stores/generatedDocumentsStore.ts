/**
 * Store pour les documents générés dans le chat iAsted
 * Permet de conserver les blobs entre la génération et le classement
 */

import { create } from 'zustand';

interface GeneratedDocument {
    id: string;
    name: string;
    blob: Blob;
    url: string; // blob URL
    type: string;
    createdAt: Date;
}

interface GeneratedDocumentsState {
    documents: Map<string, GeneratedDocument>;
    addDocument: (doc: Omit<GeneratedDocument, 'createdAt'>) => void;
    getDocument: (id: string) => GeneratedDocument | undefined;
    getDocumentByUrl: (url: string) => GeneratedDocument | undefined;
    removeDocument: (id: string) => void;
    clearOldDocuments: () => void;
}

export const useGeneratedDocumentsStore = create<GeneratedDocumentsState>((set, get) => ({
    documents: new Map(),

    addDocument: (doc) => {
        set((state) => {
            const newDocs = new Map(state.documents);
            newDocs.set(doc.id, { ...doc, createdAt: new Date() });
            console.log('📄 [GeneratedDocumentsStore] Document ajouté:', doc.id, doc.name);
            return { documents: newDocs };
        });
    },

    getDocument: (id) => {
        return get().documents.get(id);
    },

    getDocumentByUrl: (url) => {
        const docs = get().documents;
        for (const doc of docs.values()) {
            if (doc.url === url) {
                return doc;
            }
        }
        return undefined;
    },

    removeDocument: (id) => {
        set((state) => {
            const newDocs = new Map(state.documents);
            const doc = newDocs.get(id);
            if (doc) {
                // Révoquer le blob URL
                URL.revokeObjectURL(doc.url);
                newDocs.delete(id);
                console.log('🗑️ [GeneratedDocumentsStore] Document supprimé:', id);
            }
            return { documents: newDocs };
        });
    },

    clearOldDocuments: () => {
        set((state) => {
            const newDocs = new Map(state.documents);
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            
            for (const [id, doc] of newDocs.entries()) {
                if (doc.createdAt < oneHourAgo) {
                    URL.revokeObjectURL(doc.url);
                    newDocs.delete(id);
                    console.log('🧹 [GeneratedDocumentsStore] Document expiré supprimé:', id);
                }
            }
            
            return { documents: newDocs };
        });
    },
}));
