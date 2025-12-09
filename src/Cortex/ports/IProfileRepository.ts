/**
 * CORTEX - Port: IProfileRepository
 * 
 * Defines the contract for profile persistence operations.
 */

import { MunicipalRole } from '../entities/MunicipalRole';

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface ProfileIdentity {
    readonly id: string;
    readonly userId: string;
    readonly email: string;
}

export interface ProfilePersonalInfo {
    readonly firstName: string;
    readonly lastName: string;
    readonly dateOfBirth?: string;
    readonly phone?: string;
    readonly nationality?: string;
    readonly placeOfBirth?: string;
}

export interface ProfileEmployment {
    readonly employer?: string;
    readonly profession?: string;
    readonly organizationId?: string;
}

// ============================================================
// AGGREGATE ROOT
// ============================================================

export interface Profile {
    readonly identity: ProfileIdentity;
    readonly personalInfo: ProfilePersonalInfo;
    readonly employment: ProfileEmployment;
    readonly role: MunicipalRole;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

// ============================================================
// PORT
// ============================================================

export interface IProfileRepository {
    findAll(organizationId?: string): Promise<Profile[]>;
    findById(id: string): Promise<Profile | null>;
    findByUserId(userId: string): Promise<Profile | null>;
    save(profile: Profile): Promise<Profile>;
    exists(userId: string): Promise<boolean>;
}
