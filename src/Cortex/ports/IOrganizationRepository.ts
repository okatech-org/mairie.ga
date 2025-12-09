/**
 * CORTEX - Port: IOrganizationRepository
 * 
 * Defines the contract for organization persistence.
 */

import { OrganizationType } from '../entities/Organization';

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface OrganizationMetadata {
    readonly city: string;
    readonly country: string;
    readonly province?: string;
    readonly population?: number;
    readonly coordinates?: { lat: number; lng: number };
    readonly isCapitalProvince?: boolean;
    readonly color?: string;
}

// ============================================================
// AGGREGATE ROOT (mirrors Cortex entity)
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
// PORT
// ============================================================

export interface IOrganizationRepository {
    findAll(): Promise<Organization[]>;
    findById(id: string): Promise<Organization | null>;
    findByType(type: OrganizationType): Promise<Organization[]>;
    save(organization: Organization): Promise<Organization>;
    delete(id: string): Promise<void>;
}
