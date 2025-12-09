/**
 * CONSCIOUSNESS - useIAsted Hook
 * 
 * Hook React principal pour intégrer iAsted dans l'application.
 * C'est l'interface publique de la Conscience Numérique.
 * 
 * Usage:
 * ```tsx
 * const { 
 *   speak, 
 *   process, 
 *   isAwake, 
 *   persona,
 *   IAstedCursor 
 * } = useIAsted();
 * ```
 */

import { useEffect, useState, useCallback } from 'react';
import { iAstedSoul, SoulState, KnownUser } from './iAstedSoul';
import { SocialProtocolAdapter } from './SocialProtocolAdapter';
import { ContextMemory } from './ContextMemory';
import { MotorSynapse } from './MotorCortex';
import { IntentProcessor, ProcessingResult, IntentSource } from './IntentProcessor';
import { MunicipalRole } from '@/Cortex/entities/MunicipalRole';

// ============================================================
// TYPES
// ============================================================

export interface UseIAstedOptions {
    /** Éveiller automatiquement iAsted au montage */
    autoAwaken?: boolean;
    /** Utilisateur initial */
    initialUser?: Partial<KnownUser>;
    /** Activer l'écoute vocale automatique */
    enableVoice?: boolean;
}

export interface UseIAstedReturn {
    // === État ===
    soulState: SoulState;
    isAwake: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    isProcessing: boolean;
    persona: SoulState['persona'];

    // === Contrôle ===
    awaken: () => void;
    sleep: () => void;
    startListening: () => void;
    stopListening: () => void;

    // === Interaction ===
    process: (input: string, source?: IntentSource) => Promise<ProcessingResult>;
    speak: (text: string) => void;
    greet: () => void;
    farewell: () => void;

    // === Utilisateur ===
    setUser: (user: Partial<KnownUser>) => void;
    clearUser: () => void;

    // === Navigation spatiale ===
    updatePage: (url: string, pageName: string) => void;

    // === Moteur ===
    moveToElement: (elementId: string) => void;
    click: () => void;

    // === Mémoire ===
    getContextSummary: () => string;
    resetConversation: () => void;
}

// ============================================================
// HOOK
// ============================================================

export function useIAsted(options: UseIAstedOptions = {}): UseIAstedReturn {
    const {
        autoAwaken = false,
        initialUser,
        enableVoice = false
    } = options;

    const [soulState, setSoulState] = useState<SoulState>(iAstedSoul.getState());

    // ========== ABONNEMENT À L'ÉTAT ==========

    useEffect(() => {
        const unsubscribe = iAstedSoul.subscribe(setSoulState);

        // Initialisation
        if (autoAwaken) {
            iAstedSoul.awaken();
        }

        if (initialUser) {
            iAstedSoul.recognizeUser(initialUser);
        }

        // Mettre à jour la conscience spatiale
        if (typeof window !== 'undefined') {
            iAstedSoul.updateSpatialAwareness({
                currentUrl: window.location.href,
                currentPage: document.title,
                viewportSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            });

            // Écouter les changements de route
            const handlePopState = () => {
                iAstedSoul.updateSpatialAwareness({
                    currentUrl: window.location.href,
                    currentPage: document.title
                });
            };

            window.addEventListener('popstate', handlePopState);

            return () => {
                unsubscribe();
                window.removeEventListener('popstate', handlePopState);
            };
        }

        return unsubscribe;
    }, [autoAwaken, initialUser]);

    // ========== CONTRÔLE ==========

    const awaken = useCallback(() => {
        iAstedSoul.awaken();
        MotorSynapse.welcomeSequence();
    }, []);

    const sleep = useCallback(() => {
        iAstedSoul.sleep();
        MotorSynapse.idle('corner');
    }, []);

    const startListening = useCallback(() => {
        iAstedSoul.startListening();
        MotorSynapse.pulse('medium', 500);
    }, []);

    const stopListening = useCallback(() => {
        iAstedSoul.stopListening();
    }, []);

    // ========== INTERACTION ==========

    const process = useCallback(async (
        input: string,
        source: IntentSource = 'text'
    ): Promise<ProcessingResult> => {
        return IntentProcessor.process(input, source);
    }, []);

    const speak = useCallback((text: string) => {
        iAstedSoul.startSpeaking();

        const emotion = soulState.persona.formalityLevel === 3 ? 'formal' : 'neutral';
        MotorSynapse.speak(text, emotion);

        // Fin de parole après estimation du temps
        const duration = text.length * 50; // ~50ms par caractère
        setTimeout(() => {
            iAstedSoul.stopSpeaking();
            MotorSynapse.notifySpeechComplete();
        }, duration);
    }, [soulState.persona.formalityLevel]);

    const greet = useCallback(() => {
        const greeting = SocialProtocolAdapter.generateWelcomeMessage(
            soulState.persona.role,
            soulState.user.name || undefined
        );
        speak(greeting);
    }, [soulState.persona.role, soulState.user.name, speak]);

    const farewell = useCallback(() => {
        const closing = SocialProtocolAdapter.generateClosing(soulState.persona.role);
        speak(closing);

        setTimeout(() => {
            sleep();
        }, 2000);
    }, [soulState.persona.role, speak, sleep]);

    // ========== UTILISATEUR ==========

    const setUser = useCallback((user: Partial<KnownUser>) => {
        iAstedSoul.recognizeUser(user);
    }, []);

    const clearUser = useCallback(() => {
        iAstedSoul.recognizeUser({
            id: null,
            name: null,
            role: 'ANONYMOUS',
            organization: null,
            isAuthenticated: false
        });
    }, []);

    // ========== NAVIGATION SPATIALE ==========

    const updatePage = useCallback((url: string, pageName: string) => {
        iAstedSoul.updateSpatialAwareness({
            currentUrl: url,
            currentPage: pageName
        });
    }, []);

    // ========== MOTEUR ==========

    const moveToElement = useCallback((elementId: string) => {
        MotorSynapse.moveToElement(elementId);
    }, []);

    const click = useCallback(() => {
        MotorSynapse.click();
    }, []);

    // ========== MÉMOIRE ==========

    const getContextSummary = useCallback(() => {
        return ContextMemory.getContextSummary();
    }, []);

    const resetConversation = useCallback(() => {
        ContextMemory.reset();
    }, []);

    // ========== RETURN ==========

    return {
        // État
        soulState,
        isAwake: soulState.isAwake,
        isListening: soulState.isListening,
        isSpeaking: soulState.isSpeaking,
        isProcessing: soulState.isProcessing,
        persona: soulState.persona,

        // Contrôle
        awaken,
        sleep,
        startListening,
        stopListening,

        // Interaction
        process,
        speak,
        greet,
        farewell,

        // Utilisateur
        setUser,
        clearUser,

        // Navigation spatiale
        updatePage,

        // Moteur
        moveToElement,
        click,

        // Mémoire
        getContextSummary,
        resetConversation
    };
}

// ============================================================
// CONTEXT PROVIDER (pour usage global)
// ============================================================

import React, { createContext, useContext, ReactNode } from 'react';

const IAstedContext = createContext<UseIAstedReturn | null>(null);

interface IAstedProviderProps {
    children: ReactNode;
    options?: UseIAstedOptions;
}

export const IAstedProvider: React.FC<IAstedProviderProps> = ({
    children,
    options = { autoAwaken: true }
}) => {
    const iasted = useIAsted(options);

    return (
        <IAstedContext.Provider value={iasted}>
            {children}
        </IAstedContext.Provider>
    );
};

export function useIAstedContext(): UseIAstedReturn {
    const context = useContext(IAstedContext);
    if (!context) {
        throw new Error('useIAstedContext must be used within IAstedProvider');
    }
    return context;
}

// ============================================================
// EXPORT
// ============================================================

export default useIAsted;
