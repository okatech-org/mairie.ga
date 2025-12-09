/**
 * NEURON - ListRequests
 * 
 * Use case: List all requests for a citizen or organization.
 */

import { IRequestRepository } from '../../Cortex/ports/IRequestRepository';
import { RequestTypeLabels } from '../../Cortex/entities/Request';
import { RequestOutput } from '../../Signals/request.signals';

export interface ListRequestsInput {
    readonly citizenId?: string;
    readonly organizationId?: string;
    readonly status?: string;
    readonly limit?: number;
    readonly offset?: number;
}

export class ListRequestsNeuron {
    constructor(private readonly requestRepository: IRequestRepository) { }

    async execute(input: ListRequestsInput): Promise<RequestOutput[]> {
        // 1. Fetch requests
        const requests = await this.requestRepository.findAll(input.citizenId);

        // 2. Apply filters
        let filtered = requests;
        if (input.status) {
            filtered = requests.filter(r => r.status === input.status);
        }

        // 3. Apply pagination
        const offset = input.offset ?? 0;
        const limit = input.limit ?? 50;
        const paginated = filtered.slice(offset, offset + limit);

        // 4. Transform to output
        return paginated.map(request => ({
            id: request.id,
            type: request.type,
            typeLabel: RequestTypeLabels[request.type] || request.type,
            status: request.status,
            priority: request.priority,
            subject: request.subject || '',
            description: request.notes,
            createdAt: request.createdAt.toISOString(),
            updatedAt: request.updatedAt.toISOString()
        }));
    }
}
