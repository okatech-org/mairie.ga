/**
 * NEURON - CreateRequest
 * 
 * Use case: Create a new service request.
 */

import { IRequestRepository } from '../../Cortex/ports/IRequestRepository';
import { RequestStatus, RequestPriority, RequestTypeLabels } from '../../Cortex/entities/Request';
import { CreateRequestInput, RequestOutput } from '../../Signals/request.signals';

export class CreateRequestNeuron {
    constructor(private readonly requestRepository: IRequestRepository) { }

    async execute(input: CreateRequestInput): Promise<RequestOutput> {
        // 1. Validate input
        this.validateInput(input);

        // 2. Create request with default values
        const request = await this.requestRepository.create({
            citizenId: input.citizenId,
            serviceId: input.serviceId,
            organizationId: input.organizationId,
            type: input.type,
            status: RequestStatus.PENDING,
            priority: input.priority ?? RequestPriority.NORMAL,
            data: input.data,
            notes: input.description
        });

        // 3. Return output signal
        return {
            id: request.id,
            type: request.type,
            typeLabel: RequestTypeLabels[request.type] || request.type,
            status: request.status,
            priority: request.priority,
            subject: input.subject,
            description: input.description,
            createdAt: request.createdAt.toISOString(),
            updatedAt: request.updatedAt.toISOString()
        };
    }

    private validateInput(input: CreateRequestInput): void {
        if (!input.citizenId) throw new Error('Citoyen requis');
        if (!input.serviceId) throw new Error('Service requis');
        if (!input.organizationId) throw new Error('Organisation requise');
        if (!input.type) throw new Error('Type de demande requis');
        if (!input.subject) throw new Error('Sujet requis');
    }
}
