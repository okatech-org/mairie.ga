/**
 * CONSCIOUSNESS - MotorCortex: Central Export
 * 
 * Le Système Moteur d'iAsted - "Le Corps Virtuel"
 * 
 * Exports:
 * - MotorSynapse: Contrôleur central des commandes motrices
 * - useIAstedCursor: Hook React pour l'animation du curseur
 * - IAstedCursor: Composant React du curseur/orbe
 */

// Synapse principale
export { MotorSynapse } from './MotorSynapse';
export type {
    MotorCommandType,
    GazeCommand,
    MoveCommand,
    InteractCommand,
    VocalizeCommand,
    PulseCommand,
    IdleCommand,
    ThinkCommand,
    MotorCommand,
    MotorSequence,
    MotorState
} from './MotorSynapse';

// Contrôleur de curseur (hook)
export { useIAstedCursor, IAstedCursorStyles } from './CursorController';
export type { CursorPosition, CursorState } from './CursorController';

// Composant React
export { IAstedCursor, useIAstedMotor } from './IAstedCursor';
