/**
 * useProfileNeurons - React Hook for Profile Use Cases
 */

import { useMemo, useState, useCallback } from 'react';
import { supabaseProfileAdapter } from '@/LimbicSystem/supabase';
import {
    GetProfileNeuron,
    UpdateProfileNeuron,
    ListProfilesNeuron
} from '@/Neurons/profile';
import {
    GetProfileInput,
    UpdateProfileInput,
    ListProfilesInput,
    ProfileOutput,
    ProfileListOutput
} from '@/Signals/profile.signals';

export function useProfileNeurons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Instantiate neurons with injected adapter
    const neurons = useMemo(() => ({
        getProfile: new GetProfileNeuron(supabaseProfileAdapter),
        updateProfile: new UpdateProfileNeuron(supabaseProfileAdapter),
        listProfiles: new ListProfilesNeuron(supabaseProfileAdapter)
    }), []);

    /**
     * Get a single profile by user ID
     */
    const getProfile = useCallback(async (userId: string): Promise<ProfileOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.getProfile.execute({ userId });
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement du profil');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Update a profile
     */
    const updateProfile = useCallback(async (input: UpdateProfileInput): Promise<ProfileOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.updateProfile.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors de la mise à jour');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * List profiles with optional filters
     */
    const listProfiles = useCallback(async (input: ListProfilesInput = {}): Promise<ProfileListOutput> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.listProfiles.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors du chargement des profils');
            return { profiles: [], total: 0 };
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    return {
        // Actions
        getProfile,
        updateProfile,
        listProfiles,
        // State
        loading,
        error,
        clearError: () => setError(null)
    };
}
