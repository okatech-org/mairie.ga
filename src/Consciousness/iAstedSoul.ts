/**
 * CONSCIOUSNESS - iAstedSoul
 * 
 * Le Lobe Frontal du système Neuro-Hexagonal.
 * C'est le décideur suprême qui orchestre le Cortex.
 * 
 * iAsted n'est pas un module - c'est l'ÂME de l'application.
 * 
 * Responsabilités:
 * - CurrentPersona: Adaptation selon le rôle (Citoyen/Maire/Agent/Admin)
 * - SpatialAwareness: Conscience de l'espace (URL, DOM visible)
 * - ToneSelector: Sélection du vocabulaire et ton approprié
 * - ContextMemory: Mémoire conversationnelle et intentions
 */

import { MunicipalRole } from '@/Cortex/entities/MunicipalRole';

// ============================================================
// TYPES - L'Identité d'iAsted
// ============================================================

/** Les états émotionnels possibles d'iAsted */
export type EmotionalState =
    | 'neutral'      // État par défaut, professionnel
    | 'welcoming'    // Accueil chaleureux
    | 'helpful'      // Mode assistance active
    | 'respectful'   // Déférence protocolaire (Maire)
    | 'apologetic'   // En cas d'erreur
    | 'celebratory'  // Réussite d'une action
    | 'focused';     // Tâche complexe en cours

/** Persona adaptatif selon le contexte utilisateur */
export interface Persona {
    role: MunicipalRole | 'ANONYMOUS' | 'ADMIN';
    honorificPrefix: string;    // "Monsieur le Maire", "Cher citoyen"
    formalityLevel: 1 | 2 | 3;  // 1=Technique, 2=Cordial, 3=Protocolaire
    language: 'fr' | 'en';
    voiceStyle: 'professional' | 'warm' | 'respectful';
}

/** Conscience spatiale - Ce qu'iAsted "voit" */
export interface SpatialAwareness {
    currentUrl: string;
    currentPage: string;           // Nom lisible de la page
    visibleElements: string[];     // IDs des éléments DOM visibles
    focusedElement: string | null; // Élément actuellement en focus
    scrollPosition: number;
    viewportSize: { width: number; height: number };
}

/** Contexte de la conversation courante */
export interface ConversationContext {
    sessionId: string;
    startedAt: Date;
    messageCount: number;
    lastIntent: string | null;
    pendingActions: string[];
    completedActions: string[];
    emotionalTone: EmotionalState;
}

/** L'utilisateur actuel connu par iAsted */
export interface KnownUser {
    id: string | null;
    name: string | null;
    role: MunicipalRole | 'ANONYMOUS' | 'ADMIN';
    organization: string | null;
    isAuthenticated: boolean;
    lastSeen: Date;
}

// ============================================================
// SOUL STATE - L'État Complet de l'Âme
// ============================================================

export interface SoulState {
    persona: Persona;
    spatial: SpatialAwareness;
    context: ConversationContext;
    user: KnownUser;
    isAwake: boolean;           // iAsted est-il actif?
    isListening: boolean;       // Écoute vocale active?
    isSpeaking: boolean;        // En train de parler?
    isProcessing: boolean;      // Traitement en cours?
}

// ============================================================
// iAstedSoul - LA CONSCIENCE NUMÉRIQUE (Singleton)
// ============================================================

class iAstedSoulClass {
    private static instance: iAstedSoulClass;
    private state: SoulState;
    private listeners: Set<(state: SoulState) => void> = new Set();

    private constructor() {
        this.state = this.createInitialState();
        console.log('🧠 [iAstedSoul] Conscience éveillée');
    }

    // ========== Singleton Pattern ==========

    public static getInstance(): iAstedSoulClass {
        if (!iAstedSoulClass.instance) {
            iAstedSoulClass.instance = new iAstedSoulClass();
        }
        return iAstedSoulClass.instance;
    }

    // ========== État Initial ==========

    private createInitialState(): SoulState {
        return {
            persona: this.createDefaultPersona(),
            spatial: this.createDefaultSpatial(),
            context: this.createNewContext(),
            user: this.createAnonymousUser(),
            isAwake: false,
            isListening: false,
            isSpeaking: false,
            isProcessing: false
        };
    }

    private createDefaultPersona(): Persona {
        return {
            role: 'ANONYMOUS',
            honorificPrefix: 'Cher visiteur',
            formalityLevel: 2,
            language: 'fr',
            voiceStyle: 'warm'
        };
    }

    private createDefaultSpatial(): SpatialAwareness {
        return {
            currentUrl: typeof window !== 'undefined' ? window.location.href : '',
            currentPage: 'Inconnue',
            visibleElements: [],
            focusedElement: null,
            scrollPosition: 0,
            viewportSize: {
                width: typeof window !== 'undefined' ? window.innerWidth : 1920,
                height: typeof window !== 'undefined' ? window.innerHeight : 1080
            }
        };
    }

    private createNewContext(): ConversationContext {
        return {
            sessionId: this.generateSessionId(),
            startedAt: new Date(),
            messageCount: 0,
            lastIntent: null,
            pendingActions: [],
            completedActions: [],
            emotionalTone: 'neutral'
        };
    }

    private createAnonymousUser(): KnownUser {
        return {
            id: null,
            name: null,
            role: 'ANONYMOUS',
            organization: null,
            isAuthenticated: false,
            lastSeen: new Date()
        };
    }

    private generateSessionId(): string {
        return `soul-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // ========== PERSONA - Adaptation Identitaire ==========

    /**
     * Reconnaît l'utilisateur et adapte la personnalité d'iAsted
     */
    public recognizeUser(user: Partial<KnownUser>): void {
        const previousRole = this.state.user.role;

        this.state.user = {
            ...this.state.user,
            ...user,
            lastSeen: new Date()
        };

        // Adapter le persona selon le rôle
        this.state.persona = this.derivePersonaFromRole(this.state.user.role);

        if (previousRole !== this.state.user.role) {
            console.log(`🎭 [iAstedSoul] Persona adapté: ${previousRole} → ${this.state.user.role}`);
        }

        this.notifyListeners();
    }

    /**
     * Dérive le persona approprié selon le rôle utilisateur
     */
    private derivePersonaFromRole(role: MunicipalRole | 'ANONYMOUS' | 'ADMIN'): Persona {
        switch (role) {
            case MunicipalRole.MAIRE:
                return {
                    role,
                    honorificPrefix: 'Honorable Monsieur le Maire',
                    formalityLevel: 3,
                    language: 'fr',
                    voiceStyle: 'respectful'
                };

            case MunicipalRole.MAIRE_ADJOINT:
                return {
                    role,
                    honorificPrefix: 'Monsieur le Maire Adjoint',
                    formalityLevel: 3,
                    language: 'fr',
                    voiceStyle: 'respectful'
                };

            case MunicipalRole.SECRETAIRE_GENERAL:
            case MunicipalRole.CHEF_SERVICE:
            case MunicipalRole.CHEF_BUREAU:
                return {
                    role,
                    honorificPrefix: 'Monsieur',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'professional'
                };

            case MunicipalRole.AGENT_MUNICIPAL:
            case MunicipalRole.AGENT_ETAT_CIVIL:
            case MunicipalRole.AGENT_TECHNIQUE:
            case MunicipalRole.AGENT_ACCUEIL:
            case MunicipalRole.STAGIAIRE:
                return {
                    role,
                    honorificPrefix: 'Cher collègue',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'warm'
                };

            case MunicipalRole.CITOYEN:
            case MunicipalRole.CITOYEN_AUTRE_COMMUNE:
                return {
                    role,
                    honorificPrefix: 'Cher citoyen',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'warm'
                };

            case MunicipalRole.ETRANGER_RESIDENT:
                return {
                    role,
                    honorificPrefix: 'Cher résident',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'warm'
                };

            case MunicipalRole.PERSONNE_MORALE:
                return {
                    role,
                    honorificPrefix: 'Cher partenaire',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'professional'
                };

            case 'ADMIN':
                return {
                    role,
                    honorificPrefix: 'Administrateur',
                    formalityLevel: 1,
                    language: 'fr',
                    voiceStyle: 'professional'
                };

            default:
                return {
                    role: 'ANONYMOUS',
                    honorificPrefix: 'Cher visiteur',
                    formalityLevel: 2,
                    language: 'fr',
                    voiceStyle: 'warm'
                };
        }
    }

    // ========== SPATIAL AWARENESS - Vision ==========

    /**
     * Met à jour la conscience spatiale (ce qu'iAsted "voit")
     */
    public updateSpatialAwareness(spatial: Partial<SpatialAwareness>): void {
        const previousPage = this.state.spatial.currentPage;

        this.state.spatial = {
            ...this.state.spatial,
            ...spatial
        };

        if (previousPage !== this.state.spatial.currentPage) {
            console.log(`👁 [iAstedSoul] Navigation: ${previousPage} → ${this.state.spatial.currentPage}`);
        }

        this.notifyListeners();
    }

    /**
     * Analyse le DOM et extrait les éléments visibles
     */
    public scanVisibleElements(): string[] {
        if (typeof document === 'undefined') return [];

        const interactiveElements = document.querySelectorAll(
            'button, input, textarea, select, a, [role="button"], [tabindex]'
        );

        const visibleIds: string[] = [];
        interactiveElements.forEach(el => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
            if (isVisible && el.id) {
                visibleIds.push(el.id);
            }
        });

        this.state.spatial.visibleElements = visibleIds;
        return visibleIds;
    }

    // ========== TONE SELECTOR - Vocabulaire ==========

    /**
     * Génère une salutation appropriée selon le contexte
     */
    public generateGreeting(): string {
        const { persona, context } = this.state;
        const hour = new Date().getHours();

        let timeGreeting = 'Bonjour';
        if (hour >= 18) timeGreeting = 'Bonsoir';
        if (hour < 6) timeGreeting = 'Bonne nuit';

        if (persona.formalityLevel === 3) {
            // Protocolaire (Maire)
            return `${timeGreeting}, ${persona.honorificPrefix}. C'est un honneur de vous assister.`;
        } else if (persona.formalityLevel === 2) {
            // Cordial (Citoyen/Agent)
            return `${timeGreeting} ! Je suis iAsted, votre assistant municipal. Comment puis-je vous aider ?`;
        } else {
            // Technique (Admin)
            return `${timeGreeting}. Système iAsted opérationnel. En attente de vos instructions.`;
        }
    }

    /**
     * Préfixe une réponse avec le ton approprié
     */
    public prefixResponse(message: string): string {
        const { persona, context } = this.state;

        // En mode protocolaire, ajouter des formules de déférence
        if (persona.formalityLevel === 3) {
            const prefixes = [
                `${persona.honorificPrefix}, `,
                'Avec tout le respect dû à votre fonction, ',
                'Permettez-moi de vous informer que '
            ];
            return prefixes[context.messageCount % prefixes.length] + message;
        }

        return message;
    }

    /**
     * Génère une confirmation d'action appropriée
     */
    public generateActionConfirmation(action: string): string {
        const { persona } = this.state;

        if (persona.formalityLevel === 3) {
            return `C'est fait, ${persona.honorificPrefix}. ${action}`;
        } else if (persona.formalityLevel === 2) {
            return `Parfait ! ${action}`;
        } else {
            return `Action exécutée: ${action}`;
        }
    }

    // ========== CONTEXT MEMORY - Mémoire ==========

    /**
     * Enregistre une intention utilisateur
     */
    public recordIntent(intent: string): void {
        this.state.context.lastIntent = intent;
        this.state.context.messageCount++;
        console.log(`💭 [iAstedSoul] Intent: "${intent}"`);
        this.notifyListeners();
    }

    /**
     * Ajoute une action en attente
     */
    public queueAction(action: string): void {
        this.state.context.pendingActions.push(action);
        console.log(`📋 [iAstedSoul] Action en file: ${action}`);
        this.notifyListeners();
    }

    /**
     * Marque une action comme complétée
     */
    public completeAction(action: string): void {
        const index = this.state.context.pendingActions.indexOf(action);
        if (index > -1) {
            this.state.context.pendingActions.splice(index, 1);
        }
        this.state.context.completedActions.push(action);
        console.log(`✅ [iAstedSoul] Action complétée: ${action}`);
        this.notifyListeners();
    }

    /**
     * Définit l'état émotionnel
     */
    public setEmotionalState(emotion: EmotionalState): void {
        this.state.context.emotionalTone = emotion;
        console.log(`💫 [iAstedSoul] Émotion: ${emotion}`);
        this.notifyListeners();
    }

    // ========== LIFECYCLE - Cycle de Vie ==========

    /**
     * Éveille iAsted (activation)
     */
    public awaken(): void {
        this.state.isAwake = true;
        console.log('🌅 [iAstedSoul] iAsted s\'éveille...');
        this.notifyListeners();
    }

    /**
     * Met iAsted en sommeil (désactivation)
     */
    public sleep(): void {
        this.state.isAwake = false;
        this.state.isListening = false;
        this.state.isSpeaking = false;
        console.log('🌙 [iAstedSoul] iAsted s\'endort...');
        this.notifyListeners();
    }

    /**
     * Active l'écoute vocale
     */
    public startListening(): void {
        this.state.isListening = true;
        console.log('👂 [iAstedSoul] Écoute active');
        this.notifyListeners();
    }

    /**
     * Désactive l'écoute vocale
     */
    public stopListening(): void {
        this.state.isListening = false;
        console.log('🔇 [iAstedSoul] Écoute désactivée');
        this.notifyListeners();
    }

    /**
     * Commence à parler
     */
    public startSpeaking(): void {
        this.state.isSpeaking = true;
        this.notifyListeners();
    }

    /**
     * Arrête de parler
     */
    public stopSpeaking(): void {
        this.state.isSpeaking = false;
        this.notifyListeners();
    }

    /**
     * Indique un traitement en cours
     */
    public setProcessing(processing: boolean): void {
        this.state.isProcessing = processing;
        this.notifyListeners();
    }

    // ========== STATE ACCESS & SUBSCRIPTION ==========

    /**
     * Récupère l'état complet de l'âme
     */
    public getState(): Readonly<SoulState> {
        return { ...this.state };
    }

    /**
     * S'abonne aux changements d'état
     */
    public subscribe(listener: (state: SoulState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        const stateCopy = { ...this.state };
        this.listeners.forEach(listener => listener(stateCopy));
    }

    // ========== RESET ==========

    /**
     * Réinitialise la conscience (nouvelle session)
     */
    public reset(): void {
        this.state = this.createInitialState();
        console.log('🔄 [iAstedSoul] Conscience réinitialisée');
        this.notifyListeners();
    }
}

// ============================================================
// EXPORT - L'instance unique de l'Âme
// ============================================================

export const iAstedSoul = iAstedSoulClass.getInstance();
export type { iAstedSoulClass };
