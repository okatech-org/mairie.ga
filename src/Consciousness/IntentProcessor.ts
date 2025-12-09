/**
 * CONSCIOUSNESS - IntentProcessor
 * 
 * Le Processeur d'Intentions d'iAsted - "Le Lobe Frontal"
 * 
 * Ce module est le point d'entrée de toutes les interactions.
 * Il reçoit les intentions (voix, texte, clic) et décide:
 * - Quel Skill activer
 * - Quelles commandes motrices envoyer
 * - Comment répondre vocalement
 * 
 * C'est le "décideur suprême" qui orchestre le Cortex.
 */

import { iAstedSoul, SoulState } from './iAstedSoul';
import { ContextMemory } from './ContextMemory';
import { SocialProtocolAdapter } from './SocialProtocolAdapter';
import { MotorSynapse } from './MotorCortex';
import {
    CommunicationSkills,
    AdministrativeSkills,
    NavigationSkills,
    SkillActivationSignal,
    SkillResult
} from '@/Cortex/Skills';

// ============================================================
// TYPES
// ============================================================

/** Source de l'intention */
export type IntentSource = 'voice' | 'text' | 'click' | 'context' | 'system';

/** Intention parsée */
export interface ParsedIntent {
    action: string;
    entities: Record<string, string>;
    confidence: number;
    rawInput: string;
    source: IntentSource;
}

/** Catégorie d'intention */
export type IntentCategory =
    | 'navigation'    // Aller à, ouvrir, fermer
    | 'communication' // Appeler, envoyer mail
    | 'administrative'// Documents, demandes, RDV
    | 'information'   // Qu'est-ce que, comment, où
    | 'control'       // Stop, annuler, recommencer
    | 'greeting'      // Bonjour, au revoir
    | 'unknown';

/** Résultat du traitement */
export interface ProcessingResult {
    success: boolean;
    intent: ParsedIntent | null;
    category: IntentCategory;
    response: string;
    actions: Array<{ skill: string; result: SkillResult }>;
    motorCommands: number;
}

// ============================================================
// PATTERNS DE RECONNAISSANCE D'INTENTIONS
// ============================================================

const INTENT_PATTERNS: Array<{
    category: IntentCategory;
    patterns: RegExp[];
    action: string;
}> = [
        // Navigation
        {
            category: 'navigation',
            patterns: [
                /(?:va|aller|emmène|amène|conduis)[\s-]*(moi\s+)?(?:à|vers|sur|au|aux)\s+(.+)/i,
                /ouvre?\s+(?:la\s+page\s+)?(.+)/i,
                /(?:retourne?|reviens?)\s+(?:en\s+)?arrière/i,
                /page\s+(.+)/i
            ],
            action: 'navigate'
        },

        // Communication
        {
            category: 'communication',
            patterns: [
                /(?:envoie?|expédie?)\s+(?:un\s+)?(?:mail|email|message|courrier)/i,
                /appelle?\s+(.+)/i,
                /(?:rédige?|écris?)\s+(?:un\s+)?(?:mail|email|message)/i,
                /contacte?\s+(.+)/i
            ],
            action: 'communicate'
        },

        // Administrative
        {
            category: 'administrative',
            patterns: [
                /(?:génère?|crée?|fait?)\s+(?:un\s+)?(?:acte|certificat|attestation|document)/i,
                /(?:demande?|soumet?)\s+(?:une?\s+)?(?:demande|service|dossier)/i,
                /(?:prends?|réserve?|fixe?)\s+(?:un\s+)?(?:rdv|rendez-vous)/i,
                /remplis?\s+(?:le\s+)?formulaire/i,
                /(?:acte\s+de\s+)?(?:naissance|mariage|décès)/i
            ],
            action: 'administrative'
        },

        // Information
        {
            category: 'information',
            patterns: [
                /(?:qu['']?est[\s-]ce\s+que?|c['']?est\s+quoi)\s+(.+)/i,
                /(?:comment|où|quand|pourquoi|combien)\s+(.+)/i,
                /(?:explique?|dis[\s-]moi|parle[\s-]moi\s+de)\s+(.+)/i,
                /(?:cherche?|trouve?|recherche?)\s+(.+)/i
            ],
            action: 'inform'
        },

        // Contrôle
        {
            category: 'control',
            patterns: [
                /(?:stop|arrête|tais[\s-]toi|silence)/i,
                /(?:annule?|cancel)/i,
                /(?:recommence?|reset|réinitialise?)/i,
                /(?:ferme?|quitte?|sort?)/i
            ],
            action: 'control'
        },

        // Greeting
        {
            category: 'greeting',
            patterns: [
                /(?:bonjour|salut|hello|hi|coucou|hey)/i,
                /(?:au\s*revoir|bye|à\s+bientôt|à\s+plus)/i,
                /(?:merci|thanks)/i
            ],
            action: 'greet'
        }
    ];

// ============================================================
// INTENT PROCESSOR CLASS
// ============================================================

class IntentProcessorClass {
    private static instance: IntentProcessorClass;
    private isProcessing: boolean = false;

    private constructor() {
        console.log('🧠 [IntentProcessor] Processeur d\'intentions initialisé');
    }

    public static getInstance(): IntentProcessorClass {
        if (!IntentProcessorClass.instance) {
            IntentProcessorClass.instance = new IntentProcessorClass();
        }
        return IntentProcessorClass.instance;
    }

    // ========== TRAITEMENT PRINCIPAL ==========

    /**
     * Traite une intention (point d'entrée principal)
     */
    public async process(
        input: string,
        source: IntentSource = 'text'
    ): Promise<ProcessingResult> {
        // Vérifier que iAsted est éveillé
        const soulState = iAstedSoul.getState();
        if (!soulState.isAwake) {
            iAstedSoul.awaken();
        }

        this.isProcessing = true;
        iAstedSoul.setProcessing(true);
        MotorSynapse.think(1000);

        console.log(`🧠 [IntentProcessor] Input: "${input}" (source: ${source})`);

        // Enregistrer dans la mémoire
        ContextMemory.addUserMessage(input);

        // Parser l'intention
        const intent = this.parseIntent(input, source);
        const category = this.categorizeIntent(intent);

        console.log(`🧠 [IntentProcessor] Intent: ${intent.action} (${category})`);

        // Créer le signal d'activation
        const activationSignal = this.createActivationSignal(intent, soulState);

        // Exécuter les skills appropriés
        const actions: Array<{ skill: string; result: SkillResult }> = [];
        let response: string;
        let motorCommandCount = 0;

        try {
            switch (category) {
                case 'navigation':
                    const navResult = await this.handleNavigation(intent, activationSignal);
                    actions.push(navResult);
                    response = navResult.result.vocalFeedback;
                    motorCommandCount = 3; // move + gaze + click
                    break;

                case 'communication':
                    const commResult = await this.handleCommunication(intent, activationSignal);
                    actions.push(commResult);
                    response = commResult.result.vocalFeedback;
                    motorCommandCount = 1;
                    break;

                case 'administrative':
                    const adminResult = await this.handleAdministrative(intent, activationSignal);
                    actions.push(adminResult);
                    response = adminResult.result.vocalFeedback;
                    motorCommandCount = 2;
                    break;

                case 'control':
                    const controlResult = await this.handleControl(intent, activationSignal);
                    actions.push(controlResult);
                    response = controlResult.result.vocalFeedback;
                    break;

                case 'greeting':
                    response = this.handleGreeting(intent);
                    break;

                case 'information':
                    response = await this.handleInformation(intent);
                    break;

                default:
                    response = this.handleUnknown(intent);
            }

            // Enregistrer la réponse
            ContextMemory.addAssistantMessage(response);

            // Vocaliser la réponse
            if (response) {
                const emotion = this.getEmotionForCategory(category);
                MotorSynapse.speak(response, emotion);
            }

        } catch (error) {
            console.error('[IntentProcessor] Error:', error);
            response = SocialProtocolAdapter.adaptMessage(
                'Une erreur s\'est produite. Veuillez réessayer.',
                soulState.persona.role,
                'error'
            );
        } finally {
            this.isProcessing = false;
            iAstedSoul.setProcessing(false);
            MotorSynapse.idle('corner');
        }

        return {
            success: actions.every(a => a.result.success) || actions.length === 0,
            intent,
            category,
            response,
            actions,
            motorCommands: motorCommandCount
        };
    }

    // ========== PARSING ==========

    private parseIntent(input: string, source: IntentSource): ParsedIntent {
        const normalized = input.trim().toLowerCase();
        const entities: Record<string, string> = {};
        let action = 'unknown';
        let confidence = 0.5;

        for (const pattern of INTENT_PATTERNS) {
            for (const regex of pattern.patterns) {
                const match = normalized.match(regex);
                if (match) {
                    action = pattern.action;
                    confidence = 0.8;

                    // Extraire les entités des groupes de capture
                    if (match[1]) entities.target = match[1].trim();
                    if (match[2]) entities.secondary = match[2].trim();

                    break;
                }
            }
            if (action !== 'unknown') break;
        }

        // Vérifier le contexte pour améliorer la confiance
        const activeTopics = ContextMemory.getActiveTopics();
        if (activeTopics.length > 0 && action === 'unknown') {
            // Utiliser le contexte pour deviner l'intention
            const lastAction = ContextMemory.getLastAction();
            if (lastAction) {
                action = 'continue';
                confidence = 0.6;
            }
        }

        return {
            action,
            entities,
            confidence,
            rawInput: input,
            source
        };
    }

    private categorizeIntent(intent: ParsedIntent): IntentCategory {
        for (const pattern of INTENT_PATTERNS) {
            if (pattern.action === intent.action) {
                return pattern.category;
            }
        }
        return 'unknown';
    }

    private createActivationSignal(
        intent: ParsedIntent,
        soulState: SoulState
    ): SkillActivationSignal {
        return {
            skillName: intent.action,
            activatedBy: intent.source,
            soulState,
            timestamp: new Date(),
            priority: 'normal'
        };
    }

    // ========== HANDLERS BY CATEGORY ==========

    private async handleNavigation(
        intent: ParsedIntent,
        signal: SkillActivationSignal
    ): Promise<{ skill: string; result: SkillResult }> {
        const target = intent.entities.target || intent.entities.secondary || '';

        // Animation de navigation
        MotorSynapse.pulse('medium', 300);

        const result = await NavigationSkills.navigateTo(signal, target);

        return { skill: 'NavigateTo', result };
    }

    private async handleCommunication(
        intent: ParsedIntent,
        signal: SkillActivationSignal
    ): Promise<{ skill: string; result: SkillResult }> {
        const rawInput = intent.rawInput.toLowerCase();

        if (rawInput.includes('appel')) {
            const result = await CommunicationSkills.startCall(signal, {
                target: intent.entities.target || 'support',
                type: 'voice'
            });
            return { skill: 'StartCall', result };
        }

        // Par défaut: préparer un brouillon d'email
        const result = await CommunicationSkills.draftEmail(signal, {
            recipient: intent.entities.target,
            topic: intent.entities.secondary
        });
        return { skill: 'DraftEmail', result };
    }

    private async handleAdministrative(
        intent: ParsedIntent,
        signal: SkillActivationSignal
    ): Promise<{ skill: string; result: SkillResult }> {
        const rawInput = intent.rawInput.toLowerCase();

        if (rawInput.includes('acte') || rawInput.includes('document') || rawInput.includes('certificat')) {
            let docType: 'acte_naissance' | 'acte_mariage' | 'acte_deces' | 'attestation' = 'attestation';

            if (rawInput.includes('naissance')) docType = 'acte_naissance';
            else if (rawInput.includes('mariage')) docType = 'acte_mariage';
            else if (rawInput.includes('décès')) docType = 'acte_deces';

            const result = await AdministrativeSkills.generateDocument(signal, {
                type: docType,
                data: {}
            });
            return { skill: 'GenerateDocument', result };
        }

        if (rawInput.includes('rdv') || rawInput.includes('rendez-vous')) {
            const result = await AdministrativeSkills.scheduleAppointment(signal, {
                serviceId: 'general',
                requestedDate: new Date(),
                requestedTime: '10:00',
                reason: intent.entities.target || 'Consultation'
            });
            return { skill: 'ScheduleAppointment', result };
        }

        // Par défaut: demande de service
        const result = await AdministrativeSkills.submitServiceRequest(signal, {
            serviceType: intent.entities.target || 'general',
            requesterId: 'current-user',
            details: {}
        });
        return { skill: 'SubmitServiceRequest', result };
    }

    private async handleControl(
        intent: ParsedIntent,
        signal: SkillActivationSignal
    ): Promise<{ skill: string; result: SkillResult }> {
        const rawInput = intent.rawInput.toLowerCase();

        if (rawInput.includes('stop') || rawInput.includes('arrête') || rawInput.includes('tais')) {
            const result = await NavigationSkills.stopConversation(signal);
            return { skill: 'StopConversation', result };
        }

        if (rawInput.includes('recommence') || rawInput.includes('reset')) {
            const result = await NavigationSkills.resetConversation(signal);
            return { skill: 'ResetConversation', result };
        }

        if (rawInput.includes('retour') || rawInput.includes('arrière')) {
            const result = await NavigationSkills.goBack(signal);
            return { skill: 'GoBack', result };
        }

        return {
            skill: 'UnknownControl',
            result: {
                success: true,
                skillName: 'UnknownControl',
                executionTime: 0,
                vocalFeedback: 'Commande non reconnue.'
            }
        };
    }

    private handleGreeting(intent: ParsedIntent): string {
        const soulState = iAstedSoul.getState();
        const rawInput = intent.rawInput.toLowerCase();

        if (rawInput.includes('revoir') || rawInput.includes('bye') || rawInput.includes('bientôt')) {
            return SocialProtocolAdapter.adaptMessage('', soulState.persona.role, 'farewell');
        }

        if (rawInput.includes('merci')) {
            if (soulState.persona.formalityLevel === 3) {
                return `Je vous en prie, ${soulState.persona.honorificPrefix}. C'est un honneur de vous servir.`;
            }
            return 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.';
        }

        return SocialProtocolAdapter.generateWelcomeMessage(
            soulState.persona.role,
            soulState.user.name || undefined
        );
    }

    private async handleInformation(intent: ParsedIntent): Promise<string> {
        const soulState = iAstedSoul.getState();
        const topic = intent.entities.target || intent.entities.secondary || '';

        // Animation de réflexion
        MotorSynapse.think(1500);

        // TODO: Intégrer avec un système de recherche ou LLM
        const prefix = soulState.persona.formalityLevel === 3
            ? `${soulState.persona.honorificPrefix}, concernant "${topic}", `
            : `À propos de "${topic}", `;

        return `${prefix}je vais rechercher les informations. Un instant, s'il vous plaît.`;
    }

    private handleUnknown(intent: ParsedIntent): string {
        const soulState = iAstedSoul.getState();

        if (soulState.persona.formalityLevel === 3) {
            return `Veuillez m'excuser, ${soulState.persona.honorificPrefix}, je n'ai pas bien compris votre demande. Pourriez-vous reformuler ?`;
        }

        return 'Je n\'ai pas bien compris. Pouvez-vous reformuler ou préciser votre demande ?';
    }

    // ========== HELPERS ==========

    private getEmotionForCategory(category: IntentCategory): 'neutral' | 'happy' | 'concerned' | 'excited' | 'formal' {
        const soulState = iAstedSoul.getState();

        if (soulState.persona.formalityLevel === 3) {
            return 'formal';
        }

        switch (category) {
            case 'greeting': return 'happy';
            case 'administrative': return 'neutral';
            case 'communication': return 'neutral';
            case 'navigation': return 'neutral';
            case 'information': return 'neutral';
            case 'control': return 'concerned';
            default: return 'neutral';
        }
    }

    // ========== API PUBLIQUE ==========

    /**
     * Vérifie si un traitement est en cours
     */
    public isCurrentlyProcessing(): boolean {
        return this.isProcessing;
    }

    /**
     * Traitement simplifié pour les commandes courantes
     */
    public async quickCommand(command: string): Promise<string> {
        const result = await this.process(command, 'system');
        return result.response;
    }
}

// ============================================================
// EXPORT
// ============================================================

export const IntentProcessor = IntentProcessorClass.getInstance();
export type { IntentProcessorClass };
