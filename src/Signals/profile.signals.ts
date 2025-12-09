/**
 * SIGNAL - Profile Signals
 * 
 * DTOs for profile operations.
 */

import { MunicipalRole } from '../Cortex/entities/MunicipalRole';

// ============================================================
// INPUT SIGNALS
// ============================================================

export interface GetProfileInput {
    readonly userId: string;
}

export interface UpdateProfileInput {
    readonly profileId: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly phone?: string;
    readonly email?: string;
    readonly dateOfBirth?: string;
    readonly nationality?: string;
    readonly profession?: string;
    readonly address?: string;
    readonly employer?: string;
    readonly role?: MunicipalRole;
}

export interface ListProfilesInput {
    readonly organizationId?: string;
    readonly role?: MunicipalRole;
    readonly limit?: number;
    readonly offset?: number;
}

// ============================================================
// OUTPUT SIGNALS
// ============================================================

export interface ProfileOutput {
    readonly id: string;
    readonly userId: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly fullName: string;
    readonly email: string;
    readonly phone?: string;
    readonly role: string;
    readonly roleLabel: string;
    readonly organizationId?: string;
    readonly organizationName?: string;
    readonly createdAt: string;
}

export interface ProfileListOutput {
    readonly profiles: ProfileOutput[];
    readonly total: number;
}
