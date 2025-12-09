/**
 * SIGNAL - Request Signals
 * 
 * DTOs for service request operations.
 */

import { RequestType, RequestPriority, RequestStatus } from '../Cortex/entities/Request';

// ============================================================
// INPUT SIGNALS
// ============================================================

export interface CreateRequestInput {
    readonly citizenId: string;
    readonly serviceId: string;
    readonly organizationId: string;
    readonly type: RequestType;
    readonly priority?: RequestPriority;
    readonly subject: string;
    readonly description?: string;
    readonly data?: Record<string, unknown>;
}

export interface UpdateRequestStatusInput {
    readonly requestId: string;
    readonly newStatus: RequestStatus;
    readonly notes?: string;
}

// ============================================================
// OUTPUT SIGNALS
// ============================================================

export interface RequestOutput {
    readonly id: string;
    readonly type: string;
    readonly typeLabel: string;
    readonly status: string;
    readonly priority: string;
    readonly subject: string;
    readonly description?: string;
    readonly serviceName?: string;
    readonly organizationName?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface RequestStatisticsOutput {
    readonly total: number;
    readonly pending: number;
    readonly inProgress: number;
    readonly completed: number;
    readonly rejected: number;
}
