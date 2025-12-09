/**
 * useAuthNeurons - React Hook for Auth Use Cases
 * 
 * Bridges the Neuro-Hexagonal architecture with React.
 * Injects LimbicSystem adapters into Neurons.
 */

import { useMemo, useState, useCallback } from 'react';
import { supabaseAuthAdapter } from '@/LimbicSystem/supabase';
import {
    RegisterCitizenNeuron,
    AuthenticateByEmailNeuron,
    AuthenticateByPinNeuron
} from '@/Neurons/auth';
import {
    RegisterCitizenInput,
    LoginByEmailInput,
    LoginByPinInput,
    AuthResultOutput
} from '@/Signals/auth.signals';

export function useAuthNeurons() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Instantiate neurons with injected adapter
    const neurons = useMemo(() => ({
        register: new RegisterCitizenNeuron(supabaseAuthAdapter),
        loginByEmail: new AuthenticateByEmailNeuron(supabaseAuthAdapter),
        loginByPin: new AuthenticateByPinNeuron(supabaseAuthAdapter)
    }), []);

    /**
     * Register a new citizen
     */
    const registerCitizen = useCallback(async (input: RegisterCitizenInput): Promise<AuthResultOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.register.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'inscription');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Login with email and password
     */
    const loginWithEmail = useCallback(async (input: LoginByEmailInput): Promise<AuthResultOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.loginByEmail.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur de connexion');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Login with email and PIN
     */
    const loginWithPin = useCallback(async (input: LoginByPinInput): Promise<AuthResultOutput | null> => {
        setLoading(true);
        setError(null);
        try {
            const result = await neurons.loginByPin.execute(input);
            return result;
        } catch (err: any) {
            setError(err.message || 'Erreur de connexion');
            return null;
        } finally {
            setLoading(false);
        }
    }, [neurons]);

    /**
     * Logout
     */
    const logout = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            await supabaseAuthAdapter.logout();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        // Actions
        registerCitizen,
        loginWithEmail,
        loginWithPin,
        logout,
        // State
        loading,
        error,
        clearError: () => setError(null)
    };
}
