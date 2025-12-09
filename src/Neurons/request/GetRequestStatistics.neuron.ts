/**
 * NEURON - GetRequestStatistics
 * 
 * Use case: Get statistics about a citizen's requests.
 */

import { IRequestRepository } from '../../Cortex/ports/IRequestRepository';
import { RequestStatisticsOutput } from '../../Signals/request.signals';

export class GetRequestStatisticsNeuron {
    constructor(private readonly requestRepository: IRequestRepository) { }

    async execute(citizenId: string): Promise<RequestStatisticsOutput> {
        // 1. Validate input
        if (!citizenId) throw new Error('Citizen ID requis');

        // 2. Get statistics from repository
        const stats = await this.requestRepository.getStatistics(citizenId);

        // 3. Return output signal
        return {
            total: stats.total,
            pending: stats.pending,
            inProgress: stats.inProgress,
            completed: stats.completed,
            rejected: stats.rejected
        };
    }
}
