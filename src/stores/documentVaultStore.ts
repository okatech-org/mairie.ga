/**
 * Document Vault Store
 * Zustand-like store for document vault state management
 */

import { VaultDocument, DocumentCategory, getVaultDocuments, getRecentDocuments } from '@/services/documentVaultService';

interface DocumentVaultState {
    documents: VaultDocument[];
    recentDocuments: VaultDocument[];
    selectedDocument: VaultDocument | null;
    isLoading: boolean;
    error: string | null;
    filters: {
        category: DocumentCategory | null;
        searchQuery: string;
    };
    listeners: Set<() => void>;
}

const state: DocumentVaultState = {
    documents: [],
    recentDocuments: [],
    selectedDocument: null,
    isLoading: false,
    error: null,
    filters: {
        category: null,
        searchQuery: ''
    },
    listeners: new Set()
};

export const documentVaultStore = {
    // Getters
    getState: () => ({ ...state }),
    getDocuments: () => [...state.documents],
    getRecentDocuments: () => [...state.recentDocuments],
    getSelectedDocument: () => state.selectedDocument,
    isLoading: () => state.isLoading,
    getError: () => state.error,
    getFilters: () => ({ ...state.filters }),

    // Filtered documents
    getFilteredDocuments: () => {
        let filtered = [...state.documents];

        if (state.filters.category) {
            filtered = filtered.filter(doc => doc.category === state.filters.category);
        }

        if (state.filters.searchQuery) {
            const query = state.filters.searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.name.toLowerCase().includes(query) ||
                doc.original_name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    },

    // Actions
    setLoading: (loading: boolean) => {
        state.isLoading = loading;
        documentVaultStore.notifyListeners();
    },

    setError: (error: string | null) => {
        state.error = error;
        documentVaultStore.notifyListeners();
    },

    setDocuments: (documents: VaultDocument[]) => {
        state.documents = documents;
        documentVaultStore.notifyListeners();
    },

    setRecentDocuments: (documents: VaultDocument[]) => {
        state.recentDocuments = documents;
        documentVaultStore.notifyListeners();
    },

    selectDocument: (document: VaultDocument | null) => {
        state.selectedDocument = document;
        documentVaultStore.notifyListeners();
    },

    setFilter: (key: keyof DocumentVaultState['filters'], value: any) => {
        (state.filters as any)[key] = value;
        documentVaultStore.notifyListeners();
    },

    clearFilters: () => {
        state.filters = { category: null, searchQuery: '' };
        documentVaultStore.notifyListeners();
    },

    addDocument: (document: VaultDocument) => {
        state.documents = [document, ...state.documents];
        documentVaultStore.notifyListeners();
    },

    removeDocument: (id: string) => {
        state.documents = state.documents.filter(doc => doc.id !== id);
        state.recentDocuments = state.recentDocuments.filter(doc => doc.id !== id);
        if (state.selectedDocument?.id === id) {
            state.selectedDocument = null;
        }
        documentVaultStore.notifyListeners();
    },

    updateDocument: (id: string, updates: Partial<VaultDocument>) => {
        state.documents = state.documents.map(doc =>
            doc.id === id ? { ...doc, ...updates } : doc
        );
        state.recentDocuments = state.recentDocuments.map(doc =>
            doc.id === id ? { ...doc, ...updates } : doc
        );
        if (state.selectedDocument?.id === id) {
            state.selectedDocument = { ...state.selectedDocument, ...updates };
        }
        documentVaultStore.notifyListeners();
    },

    // Fetch actions
    fetchDocuments: async () => {
        state.isLoading = true;
        state.error = null;
        documentVaultStore.notifyListeners();

        const { data, error } = await getVaultDocuments();

        state.isLoading = false;
        if (error) {
            state.error = error.message;
        } else {
            state.documents = data;
        }
        documentVaultStore.notifyListeners();
    },

    fetchRecentDocuments: async () => {
        const { data, error } = await getRecentDocuments(5);
        if (!error) {
            state.recentDocuments = data;
            documentVaultStore.notifyListeners();
        }
    },

    // Subscription
    subscribe: (listener: () => void) => {
        state.listeners.add(listener);
        return () => state.listeners.delete(listener);
    },

    notifyListeners: () => {
        state.listeners.forEach(listener => listener());
    }
};

// React Hook
import { useSyncExternalStore } from 'react';

export function useDocumentVault() {
    const vaultState = useSyncExternalStore(
        documentVaultStore.subscribe,
        documentVaultStore.getState
    );

    return {
        ...vaultState,
        documents: documentVaultStore.getDocuments(),
        recentDocuments: documentVaultStore.getRecentDocuments(),
        filteredDocuments: documentVaultStore.getFilteredDocuments(),
        selectDocument: documentVaultStore.selectDocument,
        setFilter: documentVaultStore.setFilter,
        clearFilters: documentVaultStore.clearFilters,
        addDocument: documentVaultStore.addDocument,
        removeDocument: documentVaultStore.removeDocument,
        updateDocument: documentVaultStore.updateDocument,
        fetchDocuments: documentVaultStore.fetchDocuments,
        fetchRecentDocuments: documentVaultStore.fetchRecentDocuments
    };
}
