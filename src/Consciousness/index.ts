/**
 * CONSCIOUSNESS - Central Export
 * 
 * L'Âme d'iAsted - Le Ghost in the Machine.
 * 
 * Ce module exporte tous les composants de la Conscience Numérique:
 * - iAstedSoul: Le singleton central (Persona, Spatial, Tone)
 * - SocialProtocolAdapter: Adaptation culturelle gabonaise
 * - ContextMemory: Mémoire conversationnelle
 */

// L'Âme
export { iAstedSoul } from './iAstedSoul';
export type {
    EmotionalState,
    Persona,
    SpatialAwareness,
    ConversationContext,
    KnownUser,
    SoulState
} from './iAstedSoul';

// Le Protocole Social
export { SocialProtocolAdapter } from './SocialProtocolAdapter';
export type { CommunicationContext, ProtocolResponse } from './SocialProtocolAdapter';

// La Mémoire
export { ContextMemory } from './ContextMemory';
export type {
    ConversationMessage,
    ConversationTopic,
    ContextualReference,
    TrackedAction,
    MemoryState
} from './ContextMemory';

// Le Système Moteur
export {
    MotorSynapse,
    useIAstedCursor,
    IAstedCursor,
    useIAstedMotor,
    IAstedCursorStyles
} from './MotorCortex';
export type {
    MotorCommandType,
    MotorCommand,
    MotorSequence,
    MotorState,
    CursorPosition,
    CursorState
} from './MotorCortex';

// Le Processeur d'Intentions (Lobe Frontal)
export { IntentProcessor } from './IntentProcessor';
export type {
    IntentSource,
    ParsedIntent,
    IntentCategory,
    ProcessingResult
} from './IntentProcessor';

// Hook React Principal
export {
    useIAsted,
    IAstedProvider,
    useIAstedContext
} from './useIAsted';
export type { UseIAstedOptions, UseIAstedReturn } from './useIAsted';
