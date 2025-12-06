import { Tables } from "@/integrations/supabase/types";

// Types basés sur Supabase
export type ServiceRequest = Tables<"requests"> & {
    service?: { name: string; category: string };
    organization?: { name: string };
};

export type RequestStatus = ServiceRequest["status"];
export type RequestType = ServiceRequest["type"];
export type RequestPriority = ServiceRequest["priority"];

// Enums pour compatibilité
export const RequestStatusEnum = {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    AWAITING_DOCUMENTS: 'AWAITING_DOCUMENTS',
    VALIDATED: 'VALIDATED',
    REJECTED: 'REJECTED',
    COMPLETED: 'COMPLETED'
} as const;

export const RequestPriorityEnum = {
    LOW: 'LOW',
    NORMAL: 'NORMAL',
    HIGH: 'HIGH',
    URGENT: 'URGENT'
} as const;

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
    // Legacy
    'PASSPORT': 'Passeport',
    'VISA': 'Visa',
    'CIVIL_REGISTRY': 'État civil',
    'CONSULAR_CARD': 'Carte consulaire'
};
