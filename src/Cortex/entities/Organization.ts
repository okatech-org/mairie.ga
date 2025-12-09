/**
 * CORTEX - Entity: Organization
 * 
 * Represents a Gabonese municipality (Mairie).
 * No external dependencies.
 */

// ============================================================
// ENUMS
// ============================================================

export enum OrganizationType {
    MAIRIE_CENTRALE = 'MAIRIE_CENTRALE',
    MAIRIE_ARRONDISSEMENT = 'MAIRIE_ARRONDISSEMENT',
    MAIRIE_COMMUNE = 'MAIRIE_COMMUNE',
    COMMUNAUTE_URBAINE = 'COMMUNAUTE_URBAINE'
}

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface GeoCoordinates {
    readonly lat: number;
    readonly lng: number;
}

export interface OrganizationMetadata {
    readonly city: string;
    readonly country: string;
    readonly province?: string;
    readonly population?: number;
    readonly coordinates?: GeoCoordinates;
    readonly isCapitalProvince?: boolean;
    readonly color?: string;
}

// ============================================================
// AGGREGATE ROOT
// ============================================================

export interface Organization {
    readonly id: string;
    readonly name: string;
    readonly type: OrganizationType;
    readonly metadata: OrganizationMetadata;
    readonly parentId?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

// ============================================================
// HELPERS
// ============================================================

export function isCentralMairie(org: Organization): boolean {
    return org.type === OrganizationType.MAIRIE_CENTRALE;
}

export function isCapital(org: Organization): boolean {
    return org.metadata.isCapitalProvince === true;
}
