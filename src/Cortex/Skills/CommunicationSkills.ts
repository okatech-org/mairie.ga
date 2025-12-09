/**
 * CORTEX - SKILLS: CommunicationSkills
 * 
 * Compétences cognitives de communication d'iAsted.
 * Ces neurones gèrent toutes les interactions de communication:
 * - Appels vocaux/vidéo
 * - Emails et messages
 * - Notifications
 * 
 * RÈGLE CRUCIALE: Ces skills ne s'exécutent jamais seuls.
 * Ils doivent recevoir un Signal d'Activation signé par iAstedSoul.
 */

import { iAstedSoul, SoulState } from '@/Consciousness';

// ============================================================
// TYPES
// ============================================================

export interface SkillActivationSignal {
    skillName: string;
    activatedBy: 'voice' | 'text' | 'click' | 'context' | 'system';
    soulState: SoulState;
    timestamp: Date;
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface SkillResult<T = unknown> {
    success: boolean;
    skillName: string;
    data?: T;
    error?: string;
    executionTime: number;
    vocalFeedback: string;
}

export interface EmailPayload {
    to: string | string[];
    subject: string;
    body: string;
    cc?: string[];
    attachments?: Array<{ name: string; url: string }>;
}

export interface CallPayload {
    target: string;  // User ID ou numéro
    type: 'voice' | 'video';
    reason?: string;
}

export interface NotificationPayload {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    action?: { label: string; url: string };
}

// ============================================================
// BASE SKILL CLASS
// ============================================================

abstract class BaseSkill {
    protected soulState: SoulState | null = null;

    /**
     * Vérifie que le skill est activé par iAstedSoul
     */
    protected validateActivation(signal: SkillActivationSignal): boolean {
        if (!signal.soulState.isAwake) {
            console.warn(`⚠️ [${signal.skillName}] Rejeté: iAsted n'est pas éveillé`);
            return false;
        }
        this.soulState = signal.soulState;
        console.log(`🔓 [${signal.skillName}] Activé par ${signal.activatedBy}`);
        return true;
    }

    /**
     * Génère un feedback vocal approprié
     */
    protected generateVocalFeedback(action: string, success: boolean): string {
        const soul = iAstedSoul.getState();

        if (success) {
            return iAstedSoul.generateActionConfirmation(action);
        } else {
            if (soul.persona.formalityLevel === 3) {
                return `Veuillez m'excuser, je n'ai pas pu ${action}. Puis-je réessayer ?`;
            }
            return `Désolé, il y a eu un problème avec ${action}. Je réessaie ?`;
        }
    }
}

// ============================================================
// COMMUNICATION SKILLS
// ============================================================

class CommunicationSkillsClass extends BaseSkill {
    private static instance: CommunicationSkillsClass;

    private constructor() {
        super();
        console.log('📞 [CommunicationSkills] Compétences de communication chargées');
    }

    public static getInstance(): CommunicationSkillsClass {
        if (!CommunicationSkillsClass.instance) {
            CommunicationSkillsClass.instance = new CommunicationSkillsClass();
        }
        return CommunicationSkillsClass.instance;
    }

    // ========== APPELS ==========

    /**
     * Démarre un appel vocal ou vidéo
     */
    public async startCall(
        signal: SkillActivationSignal,
        payload: CallPayload
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'StartCall',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: 'Je ne peux pas passer d\'appel pour le moment.'
            };
        }

        try {
            // Marquer l'action en cours dans la conscience
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction(`Appel ${payload.type} vers ${payload.target}`);

            // Simuler l'initiation de l'appel (à connecter avec le vrai système)
            console.log(`📞 [StartCall] Initiation appel ${payload.type} vers ${payload.target}`);

            // TODO: Intégrer avec le système d'appel réel
            // await callService.initiate(payload);

            iAstedSoul.completeAction(`Appel ${payload.type} vers ${payload.target}`);
            iAstedSoul.setProcessing(false);

            const feedback = this.generateVocalFeedback(
                `lancer l'appel ${payload.type}`,
                true
            );

            return {
                success: true,
                skillName: 'StartCall',
                data: { callId: `call-${Date.now()}`, type: payload.type },
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'StartCall',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('passer l\'appel', false)
            };
        }
    }

    /**
     * Termine un appel en cours
     */
    public async endCall(
        signal: SkillActivationSignal,
        callId: string
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'EndCall',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log(`📴 [EndCall] Fin de l'appel ${callId}`);

        return {
            success: true,
            skillName: 'EndCall',
            data: { callId, endedAt: new Date() },
            executionTime: Date.now() - startTime,
            vocalFeedback: 'L\'appel est terminé.'
        };
    }

    // ========== EMAILS ==========

    /**
     * Envoie un email
     */
    public async sendEmail(
        signal: SkillActivationSignal,
        payload: EmailPayload
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'SendEmail',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: 'Je ne peux pas envoyer d\'email pour le moment.'
            };
        }

        try {
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction('Envoi email');

            const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
            console.log(`📧 [SendEmail] Envoi à ${recipients.join(', ')}: "${payload.subject}"`);

            // TODO: Intégrer avec le vrai service email
            // await emailService.send(payload);

            iAstedSoul.completeAction('Envoi email');
            iAstedSoul.setProcessing(false);

            const soul = iAstedSoul.getState();
            let feedback: string;

            if (soul.persona.formalityLevel === 3) {
                feedback = `${soul.persona.honorificPrefix}, votre message a été envoyé avec succès à ${recipients.length} destinataire(s).`;
            } else {
                feedback = `C'est envoyé ! Le message "${payload.subject}" est parti.`;
            }

            return {
                success: true,
                skillName: 'SendEmail',
                data: { messageId: `msg-${Date.now()}`, recipients },
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'SendEmail',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('envoyer l\'email', false)
            };
        }
    }

    /**
     * Compose un brouillon d'email
     */
    public async draftEmail(
        signal: SkillActivationSignal,
        context: { recipient?: string; topic?: string }
    ): Promise<SkillResult<EmailPayload>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'DraftEmail',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        const soul = iAstedSoul.getState();

        // Génération intelligente du brouillon
        const draft: EmailPayload = {
            to: context.recipient || '',
            subject: context.topic || '',
            body: soul.persona.formalityLevel === 3
                ? 'Honorable Monsieur/Madame,\n\n\n\nVeuillez agréer l\'expression de mes salutations distinguées.'
                : 'Bonjour,\n\n\n\nCordialement,'
        };

        return {
            success: true,
            skillName: 'DraftEmail',
            data: draft,
            executionTime: Date.now() - startTime,
            vocalFeedback: 'J\'ai préparé un brouillon pour vous.'
        };
    }

    // ========== NOTIFICATIONS ==========

    /**
     * Envoie une notification
     */
    public async sendNotification(
        signal: SkillActivationSignal,
        payload: NotificationPayload
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'SendNotification',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log(`🔔 [SendNotification] ${payload.type}: ${payload.title}`);

        // TODO: Intégrer avec le système de notifications
        // notificationService.push(payload);

        return {
            success: true,
            skillName: 'SendNotification',
            data: { notificationId: `notif-${Date.now()}` },
            executionTime: Date.now() - startTime,
            vocalFeedback: '' // Pas de feedback vocal pour les notifications
        };
    }

    // ========== MESSAGERIE INTERNE ==========

    /**
     * Envoie un message interne (iBoîte)
     */
    public async sendInternalMessage(
        signal: SkillActivationSignal,
        payload: { recipientId: string; content: string; priority?: 'normal' | 'urgent' }
    ): Promise<SkillResult> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'SendInternalMessage',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        iAstedSoul.setProcessing(true);
        console.log(`💬 [SendInternalMessage] Message vers ${payload.recipientId}`);

        // TODO: Intégrer avec iBoîte
        // await iboiteService.send(payload);

        iAstedSoul.setProcessing(false);

        return {
            success: true,
            skillName: 'SendInternalMessage',
            data: { messageId: `iboite-${Date.now()}` },
            executionTime: Date.now() - startTime,
            vocalFeedback: 'Message envoyé dans iBoîte.'
        };
    }
}

// ============================================================
// EXPORT
// ============================================================

export const CommunicationSkills = CommunicationSkillsClass.getInstance();
export type { CommunicationSkillsClass };
