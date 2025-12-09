/**
 * NEURON - UpdateRequestStatus
 * 
 * Use case: Update the status of an existing request.
 */

import { IRequestRepository } from '../../Cortex/ports/IRequestRepository';
import { RequestStatus, RequestTypeLabels } from '../../Cortex/entities/Request';
import { UpdateRequestStatusInput, RequestOutput } from '../../Signals/request.signals';

export class UpdateRequestStatusNeuron {
    constructor(private readonly requestRepository: IRequestRepository) { }

    async execute(input: UpdateRequestStatusInput): Promise<RequestOutput> {
        // 1. Validate input
        if (!input.requestId) throw new Error('Request ID requis');
        if (!input.newStatus) throw new Error('Nouveau statut requis');

        // 2. Validate status transition
        const existing = await this.requestRepository.findById(input.requestId);
        if (!existing) throw new Error('Demande non trouvée');

        this.validateStatusTransition(existing.status, input.newStatus);

        // 3. Update status
        const updated = await this.requestRepository.updateStatus(input.requestId, input.newStatus);

        // 4. If notes provided, update them too
        if (input.notes) {
            await this.requestRepository.update(input.requestId, { notes: input.notes });
        }

        // 5. Return output
        return {
            id: updated.id,
            type: updated.type,
            typeLabel: RequestTypeLabels[updated.type] || updated.type,
            status: updated.status,
            priority: updated.priority,
            subject: updated.subject || '',
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt.toISOString()
        };
    }

    private validateStatusTransition(current: RequestStatus, next: RequestStatus): void {
        const allowedTransitions: Record<RequestStatus, RequestStatus[]> = {
            [RequestStatus.PENDING]: [RequestStatus.IN_PROGRESS, RequestStatus.REJECTED],
            [RequestStatus.IN_PROGRESS]: [RequestStatus.AWAITING_DOCUMENTS, RequestStatus.VALIDATED, RequestStatus.REJECTED],
            [RequestStatus.AWAITING_DOCUMENTS]: [RequestStatus.IN_PROGRESS, RequestStatus.REJECTED],
            [RequestStatus.VALIDATED]: [RequestStatus.COMPLETED],
            [RequestStatus.REJECTED]: [], // Terminal state
            [RequestStatus.COMPLETED]: [] // Terminal state
        };

        if (!allowedTransitions[current]?.includes(next)) {
            throw new Error(`Transition invalide: ${current} → ${next}`);
        }
    }
}
