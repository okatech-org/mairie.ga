import { Tables } from "@/integrations/supabase/types";

// Types basés sur Supabase avec extensions
export type ServiceRequest = Tables<"requests"> & {
    service?: { name: string; category: string };
    organization?: { name: string };
    profile?: { first_name: string; last_name: string; email: string };
    data?: Record<string, any>;
    documents?: Record<string, string>;
};

export type RequestStatus = ServiceRequest["status"];
export type RequestType = ServiceRequest["type"];
export type RequestPriority = ServiceRequest["priority"];

// Enums pour compatibilité avec les valeurs
export const RequestStatusEnum = {
    PENDING: 'PENDING' as const,
    IN_PROGRESS: 'IN_PROGRESS' as const,
    AWAITING_DOCUMENTS: 'AWAITING_DOCUMENTS' as const,
    VALIDATED: 'VALIDATED' as const,
    REJECTED: 'REJECTED' as const,
    COMPLETED: 'COMPLETED' as const
};

export const RequestPriorityEnum = {
    LOW: 'LOW' as const,
    NORMAL: 'NORMAL' as const,
    HIGH: 'HIGH' as const,
    URGENT: 'URGENT' as const
};

export const RequestTypeEnum = {
    PASSPORT: 'PASSPORT' as const,
    VISA: 'VISA' as const,
    CIVIL_REGISTRY: 'CIVIL_REGISTRY' as const,
    LEGALIZATION: 'LEGALIZATION' as const,
    CONSULAR_CARD: 'CONSULAR_CARD' as const,
    ATTESTATION: 'ATTESTATION' as const,
    ACTE_NAISSANCE: 'ACTE_NAISSANCE' as const,
    ACTE_MARIAGE: 'ACTE_MARIAGE' as const,
    ACTE_DECES: 'ACTE_DECES' as const,
    CERTIFICAT_RESIDENCE: 'CERTIFICAT_RESIDENCE' as const,
    PERMIS_CONSTRUIRE: 'PERMIS_CONSTRUIRE' as const,
    PATENTE: 'PATENTE' as const
};

// Alias pour compatibilité
export const RequestStatus = RequestStatusEnum;
export const RequestPriority = RequestPriorityEnum;
export const RequestType = RequestTypeEnum;

// Legacy interface
export interface Request {
    id: string;
    type: string;
    status: string;
    priority: string;
    citizenName: string;
    citizenEmail: string;
    citizenPhone?: string;
    subject: string;
    description: string;
    attachedDocuments: string[];
    requiredDocuments: string[];
    createdAt: Date;
    updatedAt: Date;
    expectedCompletionDate?: Date;
    assignedTo?: string;
    assignedToName?: string;
    internalNotes?: string;
}

// Types de démarches municipales
export const RequestTypeLabels: Record<string, string> = {
    'ACTE_NAISSANCE': 'Acte de naissance',
    'ACTE_MARIAGE': 'Acte de mariage',
    'ACTE_DECES': 'Acte de décès',
    'CERTIFICAT_RESIDENCE': 'Certificat de résidence',
    'CERTIFICAT_CELIBAT': 'Certificat de célibat',
    'CERTIFICAT_VIE': 'Certificat de vie',
    'LIVRET_FAMILLE': 'Livret de famille',
    'PERMIS_CONSTRUIRE': 'Permis de construire',
    'PATENTE': 'Patente commerciale',
    'TAXE_FONCIERE': 'Taxe foncière',
    'AUTORISATION_COMMERCE': 'Autorisation commerciale',
    'ATTESTATION': 'Attestation',
    'LEGALISATION': 'Légalisation',
    'PASSPORT': 'Passeport',
    'VISA': 'Visa',
    'CIVIL_REGISTRY': 'État civil',
    'CONSULAR_CARD': 'Carte consulaire'
};
