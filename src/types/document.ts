export type DocumentType = 'ID_CARD' | 'PASSPORT' | 'BIRTH_CERTIFICATE' | 'RESIDENCE_PERMIT' | 'OTHER';

export type DocumentStatus = 'VERIFIED' | 'PENDING' | 'REJECTED';

export interface Document {
    id: string;
    title: string;
    type: DocumentType;
    uploadDate: string;
    status: DocumentStatus;
    url: string;
    size?: string;
}
