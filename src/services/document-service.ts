import { Document } from '@/types/document';

const MOCK_DOCUMENTS: Document[] = [
    {
        id: '1',
        title: 'Carte Nationale d\'Identité',
        type: 'ID_CARD',
        uploadDate: '2023-01-15',
        status: 'VERIFIED',
        url: '#',
        size: '2.4 MB'
    },
    {
        id: '2',
        title: 'Passeport',
        type: 'PASSPORT',
        uploadDate: '2023-06-20',
        status: 'VERIFIED',
        url: '#',
        size: '3.1 MB'
    },
    {
        id: '3',
        title: 'Acte de Naissance',
        type: 'BIRTH_CERTIFICATE',
        uploadDate: '2023-11-05',
        status: 'PENDING',
        url: '#',
        size: '1.2 MB'
    }
];

export const documentService = {
    getMyDocuments: async (): Promise<Document[]> => {
        await new Promise(resolve => setTimeout(resolve, 800));
        return [...MOCK_DOCUMENTS];
    },

    uploadDocument: async (file: File, type: Document['type']): Promise<Document> => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        const newDoc: Document = {
            id: Math.random().toString(36).substr(2, 9),
            title: file.name,
            type,
            status: 'PENDING',
            uploadDate: new Date().toISOString().split('T')[0],
            url: URL.createObjectURL(file),
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        };
        MOCK_DOCUMENTS.push(newDoc);
        return newDoc;
    },

    deleteDocument: async (id: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const index = MOCK_DOCUMENTS.findIndex(d => d.id === id);
        if (index !== -1) {
            MOCK_DOCUMENTS.splice(index, 1);
        }
    }
};
