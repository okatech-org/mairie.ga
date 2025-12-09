/**
 * CORTEX - Port: IRequestRepository
 * 
 * Defines the contract for service request persistence.
 */

import { RequestStatus, RequestPriority, RequestType } from '../entities/Request';

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
    readonly subject?: string;
    readonly data?: Record<string, unknown>;
    readonly documents?: Record<string, string>;
    readonly notes?: string;
    readonly assignedTo?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface RequestStatistics {
    readonly total: number;
    readonly pending: number;
    readonly inProgress: number;
    readonly completed: number;
    readonly rejected: number;
}

// ============================================================
// PORT
// ============================================================

export interface IRequestRepository {
    findAll(citizenId?: string): Promise<ServiceRequest[]>;
    findById(id: string): Promise<ServiceRequest | null>;
    create(request: Omit<ServiceRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceRequest>;
    updateStatus(id: string, status: RequestStatus): Promise<ServiceRequest>;
    update(id: string, updates: Partial<ServiceRequest>): Promise<ServiceRequest>;
    getStatistics(citizenId: string): Promise<RequestStatistics>;
}
