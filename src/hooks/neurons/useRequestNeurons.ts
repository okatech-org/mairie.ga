/**
 * useRequestNeurons - React Hook for Request Use Cases
 */

import { useMemo, useState, useCallback } from 'react';
import { supabaseRequestAdapter } from '@/LimbicSystem/supabase';
import {
    CreateRequestNeuron,
    UpdateRequestStatusNeuron,
    GetRequestStatisticsNeuron,
    ListRequestsNeuron,
    ListRequestsInput
} from '@/Neurons/request';
import {
    CreateRequestInput,
    UpdateRequestStatusInput,
    RequestOutput,
    RequestStatisticsOutput
} from '@/Signals/request.signals';

export function useRequestNeurons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Instantiate neurons with injected adapter
    const neurons = useMemo(() => ({
        create: new CreateRequestNeuron(supabaseRequestAdapter),
        updateStatus: new UpdateRequestStatusNeuron(supabaseRequestAdapter),
        getStatistics: new GetRequestStatisticsNeuron(supabaseRequestAdapter),
        list: new ListRequestsNeuron(supabaseRequestAdapter)
    }), []);

    /**
     * Create a new service request
     */
    const createRequest = useCallback(async (input: CreateRequestInput): Promise<RequestOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.create.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la création de la demande');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Update request status
     */
    const updateRequestStatus = useCallback(async (input: UpdateRequestStatusInput): Promise<RequestOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.updateStatus.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la mise à jour du statut');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Get statistics for a citizen
     */
    const getStatistics = useCallback(async (citizenId: string): Promise<RequestStatisticsOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.getStatistics.execute(citizenId);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des statistiques');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * List requests with optional filters
     */
    const listRequests = useCallback(async (input: ListRequestsInput = {}): Promise<RequestOutput[]> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.list.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des demandes');
            return [];
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    return {
        // Actions
        createRequest,
        updateRequestStatus,
        getStatistics,
        listRequests,
        // State
        loading,
        error,
        clearError: () => setError(null)
    };
}
