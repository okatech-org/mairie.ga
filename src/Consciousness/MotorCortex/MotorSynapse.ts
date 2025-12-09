/**
 * CONSCIOUSNESS - MotorCortex: MotorSynapse
 * 
 * Le Système Moteur d'iAsted - "Le Corps Virtuel"
 * 
 * Ce module permet à iAsted de BOUGER dans l'interface:
 * - Déplacer le curseur de manière fluide
 * - Regarder/survoler des éléments
 * - Cliquer, taper, scroller
 * - Vocaliser en synchronisation avec les mouvements
 * 
 * Le backend envoie des commandes via un EventEmitter
 * Le frontend les reçoit et anime le curseur/orbe.
 */

// ============================================================
// TYPES - Protocole de Communication Motrice
// ============================================================

/** Types de commandes motrices */
export type MotorCommandType =
    | 'GAZE_AT'      // Regarder un élément (hover)
    | 'MOVE_TO'      // Se déplacer vers une position
    | 'INTERACT'     // Interagir (clic, type, scroll)
    | 'VOCALIZE'     // Parler
    | 'PULSE'        // Animation de l'orbe
    | 'IDLE'         // Retour au repos
    | 'THINK';       // Animation de réflexion

/** Commande de regard/survol */
export interface GazeCommand {
    type: 'GAZE_AT';
    elementId: string;
    duration: number;          // ms
    highlight?: boolean;       // Surligner l'élément
}

/** Commande de déplacement */
export interface MoveCommand {
    type: 'MOVE_TO';
    target:
    | { x: number; y: number }    // Coordonnées absolues
    | { elementId: string };      // Vers un élément
    speed: 'slow' | 'normal' | 'fast';
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/** Commande d'interaction */
export interface InteractCommand {
    type: 'INTERACT';
    action: 'click' | 'doubleClick' | 'rightClick' | 'type' | 'scroll' | 'drag';
    payload?: {
        text?: string;           // Pour type
        scrollDelta?: number;    // Pour scroll
        dragTo?: { x: number; y: number };
    };
    delay?: number;              // Délai avant l'action
}

/** Commande de vocalisation */
export interface VocalizeCommand {
    type: 'VOCALIZE';
    text: string;
    emotion: 'neutral' | 'happy' | 'concerned' | 'excited' | 'formal';
    speed?: number;              // 0.5-2.0
    pitch?: number;              // 0.5-2.0
    interruptible?: boolean;     // Peut être interrompu
}

/** Commande d'animation d'orbe */
export interface PulseCommand {
    type: 'PULSE';
    intensity: 'subtle' | 'medium' | 'strong';
    color?: string;
    duration: number;
}

/** Commande de repos */
export interface IdleCommand {
    type: 'IDLE';
    position?: 'corner' | 'center' | 'follow';
}

/** Commande de réflexion */
export interface ThinkCommand {
    type: 'THINK';
    duration: number;
    intensity: 'light' | 'deep';
}

/** Union de toutes les commandes */
export type MotorCommand =
    | GazeCommand
    | MoveCommand
    | InteractCommand
    | VocalizeCommand
    | PulseCommand
    | IdleCommand
    | ThinkCommand;

/** Séquence d'animation */
export interface MotorSequence {
    id: string;
    name: string;
    commands: MotorCommand[];
    loop?: boolean;
    onComplete?: () => void;
}

/** État du système moteur */
export interface MotorState {
    currentPosition: { x: number; y: number };
    currentElement: string | null;
    isMoving: boolean;
    isSpeaking: boolean;
    isInteracting: boolean;
    currentSequence: string | null;
    queuedCommands: MotorCommand[];
}

// ============================================================
// MOTOR SYNAPSE - Le Contrôleur Moteur
// ============================================================

type MotorEventListener = (command: MotorCommand) => void;
type StateChangeListener = (state: MotorState) => void;

class MotorSynapseClass {
    private static instance: MotorSynapseClass;
    private state: MotorState;
    private commandListeners: Set<MotorEventListener> = new Set();
    private stateListeners: Set<StateChangeListener> = new Set();
    private commandQueue: MotorCommand[] = [];
    private isProcessing: boolean = false;

    private constructor() {
        this.state = this.createInitialState();
        console.log('🦾 [MotorSynapse] Système moteur initialisé');
    }

    public static getInstance(): MotorSynapseClass {
        if (!MotorSynapseClass.instance) {
            MotorSynapseClass.instance = new MotorSynapseClass();
        }
        return MotorSynapseClass.instance;
    }

    private createInitialState(): MotorState {
        return {
            currentPosition: { x: 0, y: 0 },
            currentElement: null,
            isMoving: false,
            isSpeaking: false,
            isInteracting: false,
            currentSequence: null,
            queuedCommands: []
        };
    }

    // ========== ÉMISSION DE COMMANDES ==========

    /**
     * Envoie une commande motrice au frontend
     */
    public send(command: MotorCommand): void {
        console.log(`🦾 [MotorSynapse] Envoi: ${command.type}`);
        this.commandListeners.forEach(listener => listener(command));
        this.updateStateFromCommand(command);
    }

    /**
     * Ajoute une commande à la file d'attente
     */
    public queue(command: MotorCommand): void {
        this.commandQueue.push(command);
        this.state.queuedCommands = [...this.commandQueue];
        this.notifyStateChange();

        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    /**
     * Exécute une séquence de commandes
     */
    public async executeSequence(sequence: MotorSequence): Promise<void> {
        console.log(`🎬 [MotorSynapse] Séquence: ${sequence.name}`);
        this.state.currentSequence = sequence.id;
        this.notifyStateChange();

        for (const command of sequence.commands) {
            this.send(command);
            await this.waitForCommandDuration(command);
        }

        this.state.currentSequence = null;
        this.notifyStateChange();

        if (sequence.onComplete) {
            sequence.onComplete();
        }

        if (sequence.loop) {
            this.executeSequence(sequence);
        }
    }

    private async processQueue(): Promise<void> {
        if (this.commandQueue.length === 0) {
            this.isProcessing = false;
            return;
        }

        this.isProcessing = true;
        const command = this.commandQueue.shift()!;
        this.state.queuedCommands = [...this.commandQueue];

        this.send(command);
        await this.waitForCommandDuration(command);

        this.processQueue();
    }

    private async waitForCommandDuration(command: MotorCommand): Promise<void> {
        let duration = 0;

        switch (command.type) {
            case 'GAZE_AT':
                duration = command.duration;
                break;
            case 'MOVE_TO':
                duration = command.speed === 'slow' ? 1000 : command.speed === 'fast' ? 300 : 500;
                break;
            case 'INTERACT':
                duration = command.delay || 200;
                break;
            case 'PULSE':
            case 'THINK':
                duration = command.duration;
                break;
            default:
                duration = 100;
        }

        await new Promise(resolve => setTimeout(resolve, duration));
    }

    private updateStateFromCommand(command: MotorCommand): void {
        switch (command.type) {
            case 'MOVE_TO':
                this.state.isMoving = true;
                if ('elementId' in command.target) {
                    this.state.currentElement = command.target.elementId;
                }
                break;
            case 'GAZE_AT':
                this.state.currentElement = command.elementId;
                break;
            case 'INTERACT':
                this.state.isInteracting = true;
                break;
            case 'VOCALIZE':
                this.state.isSpeaking = true;
                break;
            case 'IDLE':
                this.state.isMoving = false;
                this.state.isInteracting = false;
                break;
        }
        this.notifyStateChange();
    }

    // ========== COMMANDES PRÉDÉFINIES ==========

    /**
     * Regarde un élément (survol avec le curseur)
     */
    public gazeAt(elementId: string, duration: number = 500, highlight: boolean = true): void {
        this.send({
            type: 'GAZE_AT',
            elementId,
            duration,
            highlight
        });
    }

    /**
     * Se déplace vers un élément
     */
    public moveToElement(elementId: string, speed: 'slow' | 'normal' | 'fast' = 'normal'): void {
        this.send({
            type: 'MOVE_TO',
            target: { elementId },
            speed,
            easing: 'easeInOut'
        });
    }

    /**
     * Se déplace vers des coordonnées
     */
    public moveToPosition(x: number, y: number, speed: 'slow' | 'normal' | 'fast' = 'normal'): void {
        this.send({
            type: 'MOVE_TO',
            target: { x, y },
            speed,
            easing: 'easeInOut'
        });
    }

    /**
     * Clique sur l'élément courant
     */
    public click(delay: number = 0): void {
        this.send({
            type: 'INTERACT',
            action: 'click',
            delay
        });
    }

    /**
     * Tape du texte
     */
    public type(text: string, delay: number = 50): void {
        this.send({
            type: 'INTERACT',
            action: 'type',
            payload: { text },
            delay
        });
    }

    /**
     * Parle avec une émotion
     */
    public speak(text: string, emotion: VocalizeCommand['emotion'] = 'neutral'): void {
        this.send({
            type: 'VOCALIZE',
            text,
            emotion,
            interruptible: true
        });
    }

    /**
     * Pulse l'orbe (animation visuelle)
     */
    public pulse(intensity: 'subtle' | 'medium' | 'strong' = 'medium', duration: number = 500): void {
        this.send({
            type: 'PULSE',
            intensity,
            duration
        });
    }

    /**
     * Anime la réflexion (processing)
     */
    public think(duration: number = 2000): void {
        this.send({
            type: 'THINK',
            duration,
            intensity: 'deep'
        });
    }

    /**
     * Retourne au repos
     */
    public idle(position: 'corner' | 'center' | 'follow' = 'corner'): void {
        this.send({
            type: 'IDLE',
            position
        });
    }

    // ========== SÉQUENCES PRÉDÉFINIES ==========

    /**
     * Animation de bienvenue
     */
    public welcomeSequence(): void {
        this.executeSequence({
            id: 'welcome',
            name: 'Animation de bienvenue',
            commands: [
                { type: 'PULSE', intensity: 'strong', duration: 500 },
                { type: 'VOCALIZE', text: 'Bonjour !', emotion: 'happy', interruptible: false },
                { type: 'PULSE', intensity: 'subtle', duration: 300 }
            ]
        });
    }

    /**
     * Animation de remplissage de formulaire
     */
    public fillFormSequence(fields: Array<{ elementId: string; value: string }>): void {
        const commands: MotorCommand[] = [];

        for (const field of fields) {
            commands.push(
                { type: 'MOVE_TO', target: { elementId: field.elementId }, speed: 'normal', easing: 'easeInOut' },
                { type: 'GAZE_AT', elementId: field.elementId, duration: 200, highlight: true },
                { type: 'INTERACT', action: 'click', delay: 100 },
                { type: 'INTERACT', action: 'type', payload: { text: field.value }, delay: 30 }
            );
        }

        this.executeSequence({
            id: `fill-form-${Date.now()}`,
            name: 'Remplissage de formulaire',
            commands
        });
    }

    /**
     * Animation de navigation
     */
    public navigateSequence(targetId: string, message: string): void {
        this.executeSequence({
            id: `navigate-${Date.now()}`,
            name: 'Navigation',
            commands: [
                { type: 'THINK', duration: 300, intensity: 'light' },
                { type: 'MOVE_TO', target: { elementId: targetId }, speed: 'fast', easing: 'easeOut' },
                { type: 'GAZE_AT', elementId: targetId, duration: 500, highlight: true },
                { type: 'INTERACT', action: 'click', delay: 200 },
                { type: 'VOCALIZE', text: message, emotion: 'neutral', interruptible: true }
            ]
        });
    }

    // ========== ABONNEMENTS ==========

    /**
     * S'abonne aux commandes motrices (pour le frontend)
     */
    public onCommand(listener: MotorEventListener): () => void {
        this.commandListeners.add(listener);
        return () => this.commandListeners.delete(listener);
    }

    /**
     * S'abonne aux changements d'état
     */
    public onStateChange(listener: StateChangeListener): () => void {
        this.stateListeners.add(listener);
        return () => this.stateListeners.delete(listener);
    }

    private notifyStateChange(): void {
        const stateCopy = { ...this.state };
        this.stateListeners.forEach(listener => listener(stateCopy));
    }

    // ========== ÉTAT ==========

    /**
     * Récupère l'état moteur actuel
     */
    public getState(): Readonly<MotorState> {
        return { ...this.state };
    }

    /**
     * Indique que le mouvement est terminé (appelé par le frontend)
     */
    public notifyMovementComplete(): void {
        this.state.isMoving = false;
        this.notifyStateChange();
    }

    /**
     * Indique que la parole est terminée (appelé par le frontend)
     */
    public notifySpeechComplete(): void {
        this.state.isSpeaking = false;
        this.notifyStateChange();
    }

    /**
     * Indique que l'interaction est terminée
     */
    public notifyInteractionComplete(): void {
        this.state.isInteracting = false;
        this.notifyStateChange();
    }

    /**
     * Arrête toutes les animations
     */
    public stop(): void {
        this.commandQueue = [];
        this.state = this.createInitialState();
        this.isProcessing = false;
        console.log('🛑 [MotorSynapse] Arrêt du système moteur');
        this.notifyStateChange();
    }
}

// ============================================================
// EXPORT
// ============================================================

export const MotorSynapse = MotorSynapseClass.getInstance();
export type { MotorSynapseClass };
