/**
 * Dependency Injection Container
 * 
 * Centralized factory for Neurons with injected adapters.
 * Use this for non-hook contexts (e.g., background tasks, server actions).
 */

import {
    supabaseAuthAdapter,
    supabaseProfileAdapter,
    supabaseRequestAdapter
} from '@/LimbicSystem/supabase';

// Auth Neurons
import {
    RegisterCitizenNeuron,
    AuthenticateByEmailNeuron,
    AuthenticateByPinNeuron
} from '@/Neurons/auth';

// Profile Neurons
import {
    GetProfileNeuron,
    UpdateProfileNeuron,
    ListProfilesNeuron
} from '@/Neurons/profile';

// Request Neurons
import {
    CreateRequestNeuron,
    UpdateRequestStatusNeuron,
    GetRequestStatisticsNeuron,
    ListRequestsNeuron
} from '@/Neurons/request';

/**
 * Container for all instantiated neurons with injected dependencies.
 * This is the "wiring" of the Neuro-Hexagonal architecture.
 */
export const NeuronContainer = {
    // Auth
    auth: {
        register: new RegisterCitizenNeuron(supabaseAuthAdapter),
        loginByEmail: new AuthenticateByEmailNeuron(supabaseAuthAdapter),
        loginByPin: new AuthenticateByPinNeuron(supabaseAuthAdapter),
        getGateway: () => supabaseAuthAdapter
    },

    // Profile
    profile: {
        get: new GetProfileNeuron(supabaseProfileAdapter),
        update: new UpdateProfileNeuron(supabaseProfileAdapter),
        list: new ListProfilesNeuron(supabaseProfileAdapter)
    },

    // Request
    request: {
        create: new CreateRequestNeuron(supabaseRequestAdapter),
        updateStatus: new UpdateRequestStatusNeuron(supabaseRequestAdapter),
        getStats: new GetRequestStatisticsNeuron(supabaseRequestAdapter),
        list: new ListRequestsNeuron(supabaseRequestAdapter)
    }
};

// Type-safe access
export type NeuronContainerType = typeof NeuronContainer;
