/**
 * Demo Mode Utilities
 * 
 * This module provides utilities for detecting demo mode and providing
 * fallback responses when Edge Functions fail due to authentication issues.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Check if the app is running in demo mode
 * Demo mode is detected when:
 * - User is not authenticated with a real session
 * - Using demo/mock users
 * - Edge functions return 401 errors
 */
export async function isInDemoMode(): Promise<boolean> {
    try {
        const { data: { session } } = await supabase.auth.getSession();

        // No session = demo mode
        if (!session) {
            return true;
        }

        // Check if session token is valid (not expired)
        const expiresAt = session.expires_at;
        if (expiresAt && expiresAt * 1000 < Date.now()) {
            return true;
        }

        // Check if user email is from demo accounts
        const demoEmails = [
            'super.admin@mairie.ga',
            'jean.obame@example.com',
            'marie.ndong@example.com',
            'paul.mba@example.com',
            'nadia.ondo@example.com',
            'etienne.moussounda@example.com',
            'john.smith@example.com',
            'amira.khalil@example.com',
            'marie.agent@mairie.ga',
        ];

        if (session.user?.email && demoEmails.includes(session.user.email)) {
            return true;
        }

        return false;
    } catch {
        // On error, assume demo mode
        return true;
    }
}

/**
 * Check if an error indicates demo mode (401 Unauthorized)
 */
export function isDemoModeError(error: unknown): boolean {
    if (!error) return false;

    // Check for common demo mode error patterns
    if (typeof error === 'object' && error !== null) {
        const err = error as { message?: string; status?: number; code?: string };

        // 401 Unauthorized - typical for demo mode
        if (err.status === 401 || err.code === '401') {
            return true;
        }

        // FunctionsFetchError with auth issues
        if (err.message?.includes('401') ||
            err.message?.includes('Unauthorized') ||
            err.message?.includes('not authenticated') ||
            err.message?.includes('Invalid JWT')) {
            return true;
        }
    }

    return false;
}

/**
 * Generate mock responses for Edge Functions in demo mode
 */
export const DEMO_RESPONSES = {
    'document-ocr': {
        documentType: 'cni',
        confidence: 0.95,
        extractedData: {
            lastName: 'OBAME',
            firstName: 'Jean',
            dateOfBirth: '1985-03-15',
            placeOfBirth: 'Libreville',
            nationality: 'Gabonaise',
            address: '123 Avenue de l\'Indépendance',
            city: 'Libreville',
            documentNumber: 'CNI-GA-123456789',
        },
        uncertainFields: [],
        rawText: '[Mode Démo] Document analysé avec succès',
    },

    'enrich-document-content': {
        enrichedContent: 'Le document a été enrichi avec les informations disponibles.',
        suggestions: ['Vérifier les données personnelles', 'Ajouter les pièces justificatives'],
        status: 'success',
    },

    'send-official-correspondence': {
        success: true,
        messageId: 'demo-message-' + Date.now(),
        message: '[Mode Démo] Correspondance envoyée avec succès',
    },

    'transcribe-audio': {
        text: 'Bonjour, ceci est une transcription de démonstration.',
        confidence: 0.92,
        language: 'fr',
    },

    'chat-with-iasted': {
        answer: 'Je suis iAsted, votre assistant IA. En mode démonstration, mes fonctionnalités sont limitées. Comment puis-je vous aider ?',
        tool_calls: [],
        sources: [],
    },

    'get-mapbox-token': {
        token: null, // This will cause map to show error, which is expected in demo mode
        error: 'Token non disponible en mode démo',
    },

    'security-alert-login': {
        alert_sent: false,
        message: '[Mode Démo] Alerte de sécurité simulée',
    },

    'new-device-alert': {
        is_new_device: false,
        location: 'Libreville, Gabon',
        alert_sent: false,
    },

    'create-user': {
        success: true,
        userId: 'demo-user-' + Date.now(),
        message: '[Mode Démo] Utilisateur créé avec succès',
    },
};

/**
 * Get demo response for a specific Edge Function
 */
export function getDemoResponse(functionName: keyof typeof DEMO_RESPONSES): unknown {
    return DEMO_RESPONSES[functionName] || { success: true, demo: true };
}

/**
 * Wrapper for Edge Function calls with demo mode fallback
 */
export async function invokeWithDemoFallback<T>(
    functionName: string,
    body: Record<string, unknown>,
    options?: { showToast?: boolean }
): Promise<{ data: T | null; error: Error | null; isDemo: boolean }> {
    try {
        const { data, error } = await supabase.functions.invoke(functionName, { body });

        if (error) {
            // Check if this is a demo mode error
            if (isDemoModeError(error)) {
                console.log(`[DemoMode] Edge Function '${functionName}' failed, using mock response`);
                const demoData = getDemoResponse(functionName as keyof typeof DEMO_RESPONSES);
                return {
                    data: demoData as T,
                    error: null,
                    isDemo: true,
                };
            }

            // Real error - throw it
            return { data: null, error: new Error(error.message), isDemo: false };
        }

        return { data: data as T, error: null, isDemo: false };
    } catch (err) {
        // Check if this is a demo mode error
        if (isDemoModeError(err)) {
            console.log(`[DemoMode] Edge Function '${functionName}' failed, using mock response`);
            const demoData = getDemoResponse(functionName as keyof typeof DEMO_RESPONSES);
            return {
                data: demoData as T,
                error: null,
                isDemo: true,
            };
        }

        return {
            data: null,
            error: err instanceof Error ? err : new Error('Unknown error'),
            isDemo: false
        };
    }
}
