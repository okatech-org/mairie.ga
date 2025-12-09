/**
 * CORTEX - Entity: Request
 * 
 * Represents a service request in the municipal system.
 * No external dependencies.
 */

// ============================================================
// ENUMS
// ============================================================

export enum RequestStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    AWAITING_DOCUMENTS = 'AWAITING_DOCUMENTS',
    VALIDATED = 'VALIDATED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED'
}

export enum RequestPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum RequestType {
    // État Civil
    ACTE_NAISSANCE = 'ACTE_NAISSANCE',
    ACTE_MARIAGE = 'ACTE_MARIAGE',
    ACTE_DECES = 'ACTE_DECES',
    CERTIFICAT_VIE = 'CERTIFICAT_VIE',
    CERTIFICAT_CELIBAT = 'CERTIFICAT_CELIBAT',
    LIVRET_FAMILLE = 'LIVRET_FAMILLE',

    // Urbanisme
    PERMIS_CONSTRUIRE = 'PERMIS_CONSTRUIRE',
    CERTIFICAT_RESIDENCE = 'CERTIFICAT_RESIDENCE',

    // Fiscalité
    PATENTE = 'PATENTE',
    TAXE_FONCIERE = 'TAXE_FONCIERE',

    // Légalisation
    LEGALISATION = 'LEGALISATION',
    ATTESTATION = 'ATTESTATION',

    // Legacy (for compatibility)
    PASSPORT = 'PASSPORT',
    VISA = 'VISA',
    CIVIL_REGISTRY = 'CIVIL_REGISTRY',
    CONSULAR_CARD = 'CONSULAR_CARD'
}

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface RequestDocuments {
    readonly required: readonly string[];
    readonly uploaded: Record<string, string>;
}

// ============================================================
// AGGREGATE ROOT
// ============================================================

export interface ServiceRequest {
    readonly id: string;
    readonly citizenId: string;
    readonly serviceId: string;
    readonly organizationId: string;
    readonly type: RequestType;
    readonly status: RequestStatus;
    readonly priority: RequestPriority;
    readonly subject: string;
    readonly description?: string;
    readonly data?: Record<string, unknown>;
    readonly documents?: RequestDocuments;
    readonly notes?: string;
    readonly assignedTo?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly expectedCompletionDate?: Date;
}

// ============================================================
// HELPERS
// ============================================================

export function isPending(request: ServiceRequest): boolean {
    return request.status === RequestStatus.PENDING;
}

export function isCompleted(request: ServiceRequest): boolean {
    return request.status === RequestStatus.COMPLETED || request.status === RequestStatus.VALIDATED;
}

export function isRejected(request: ServiceRequest): boolean {
    return request.status === RequestStatus.REJECTED;
}

export const RequestTypeLabels: Record<RequestType, string> = {
    [RequestType.ACTE_NAISSANCE]: 'Acte de naissance',
    [RequestType.ACTE_MARIAGE]: 'Acte de mariage',
    [RequestType.ACTE_DECES]: 'Acte de décès',
    [RequestType.CERTIFICAT_VIE]: 'Certificat de vie',
    [RequestType.CERTIFICAT_CELIBAT]: 'Certificat de célibat',
    [RequestType.LIVRET_FAMILLE]: 'Livret de famille',
    [RequestType.PERMIS_CONSTRUIRE]: 'Permis de construire',
    [RequestType.CERTIFICAT_RESIDENCE]: 'Certificat de résidence',
    [RequestType.PATENTE]: 'Patente commerciale',
    [RequestType.TAXE_FONCIERE]: 'Taxe foncière',
    [RequestType.LEGALISATION]: 'Légalisation',
    [RequestType.ATTESTATION]: 'Attestation',
    [RequestType.PASSPORT]: 'Passeport',
    [RequestType.VISA]: 'Visa',
    [RequestType.CIVIL_REGISTRY]: 'État civil',
    [RequestType.CONSULAR_CARD]: 'Carte consulaire'
};
