/**
 * CORTEX - SKILLS: AdministrativeSkills
 * 
 * Compétences cognitives administratives d'iAsted.
 * Ces neurones gèrent les processus administratifs gabonais:
 * - Génération de documents
 * - Demandes de services
 * - Gestion des rendez-vous
 * - Traitement des formulaires
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

export interface DocumentGenerationPayload {
    type: 'acte_naissance' | 'acte_mariage' | 'acte_deces' | 'certificat_residence' |
    'attestation' | 'permis_construire' | 'patente' | 'autre';
    data: Record<string, unknown>;
    format?: 'pdf' | 'word' | 'html';
}

export interface ServiceRequestPayload {
    serviceType: string;
    requesterId: string;
    details: Record<string, unknown>;
    urgency?: 'normal' | 'urgent' | 'express';
    attachments?: string[];
}

export interface AppointmentPayload {
    serviceId: string;
    requestedDate: Date;
    requestedTime: string;
    reason: string;
    attendees?: string[];
}

export interface FormData {
    formId: string;
    fields: Record<string, unknown>;
    validated: boolean;
}

// ============================================================
// BASE SKILL CLASS
// ============================================================

abstract class BaseSkill {
    protected soulState: SoulState | null = null;

    protected validateActivation(signal: SkillActivationSignal): boolean {
        if (!signal.soulState.isAwake) {
            console.warn(`⚠️ [${signal.skillName}] Rejeté: iAsted n'est pas éveillé`);
            return false;
        }
        this.soulState = signal.soulState;
        console.log(`🔓 [${signal.skillName}] Activé par ${signal.activatedBy}`);
        return true;
    }

    protected generateVocalFeedback(action: string, success: boolean): string {
        const soul = iAstedSoul.getState();

        if (success) {
            return iAstedSoul.generateActionConfirmation(action);
        } else {
            if (soul.persona.formalityLevel === 3) {
                return `Veuillez m'excuser, je n'ai pas pu ${action}. Permettez-moi de réessayer.`;
            }
            return `Désolé, il y a eu un souci avec ${action}. Je réessaie ?`;
        }
    }
}

// ============================================================
// ADMINISTRATIVE SKILLS
// ============================================================

class AdministrativeSkillsClass extends BaseSkill {
    private static instance: AdministrativeSkillsClass;

    private constructor() {
        super();
        console.log('📋 [AdministrativeSkills] Compétences administratives chargées');
    }

    public static getInstance(): AdministrativeSkillsClass {
        if (!AdministrativeSkillsClass.instance) {
            AdministrativeSkillsClass.instance = new AdministrativeSkillsClass();
        }
        return AdministrativeSkillsClass.instance;
    }

    // ========== GÉNÉRATION DE DOCUMENTS ==========

    /**
     * Génère un document administratif
     */
    public async generateDocument(
        signal: SkillActivationSignal,
        payload: DocumentGenerationPayload
    ): Promise<SkillResult<{ documentId: string; downloadUrl: string }>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'GenerateDocument',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: 'Je ne peux pas générer ce document pour le moment.'
            };
        }

        try {
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction(`Génération ${this.getDocumentTypeName(payload.type)}`);

            console.log(`📄 [GenerateDocument] Type: ${payload.type}, Format: ${payload.format || 'pdf'}`);

            // TODO: Intégrer avec le service de génération de documents
            // const doc = await documentService.generate(payload);

            // Simulation
            const documentId = `doc-${Date.now()}`;
            const downloadUrl = `/api/documents/${documentId}/download`;

            iAstedSoul.completeAction(`Génération ${this.getDocumentTypeName(payload.type)}`);
            iAstedSoul.setProcessing(false);

            const soul = iAstedSoul.getState();
            let feedback: string;

            if (soul.persona.formalityLevel === 3) {
                feedback = `${soul.persona.honorificPrefix}, votre ${this.getDocumentTypeName(payload.type)} est prêt. Souhaitez-vous que je l'ouvre pour vous ?`;
            } else {
                feedback = `Voilà ! Votre ${this.getDocumentTypeName(payload.type)} est généré. Je l'ouvre ?`;
            }

            return {
                success: true,
                skillName: 'GenerateDocument',
                data: { documentId, downloadUrl },
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'GenerateDocument',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('générer le document', false)
            };
        }
    }

    private getDocumentTypeName(type: DocumentGenerationPayload['type']): string {
        const names: Record<string, string> = {
            'acte_naissance': 'acte de naissance',
            'acte_mariage': 'acte de mariage',
            'acte_deces': 'acte de décès',
            'certificat_residence': 'certificat de résidence',
            'attestation': 'attestation',
            'permis_construire': 'permis de construire',
            'patente': 'patente',
            'autre': 'document'
        };
        return names[type] || 'document';
    }

    // ========== DEMANDES DE SERVICES ==========

    /**
     * Soumet une demande de service
     */
    public async submitServiceRequest(
        signal: SkillActivationSignal,
        payload: ServiceRequestPayload
    ): Promise<SkillResult<{ requestId: string; trackingNumber: string }>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'SubmitServiceRequest',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        try {
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction('Demande de service');

            console.log(`📨 [SubmitServiceRequest] Service: ${payload.serviceType}, Urgence: ${payload.urgency || 'normal'}`);

            // TODO: Intégrer avec le système de demandes
            // const result = await requestService.submit(payload);

            const requestId = `req-${Date.now()}`;
            const trackingNumber = `TRK-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            iAstedSoul.completeAction('Demande de service');
            iAstedSoul.setProcessing(false);

            const soul = iAstedSoul.getState();
            let feedback: string;

            if (soul.persona.formalityLevel === 3) {
                feedback = `${soul.persona.honorificPrefix}, votre demande a été enregistrée sous le numéro ${trackingNumber}. Vous pouvez suivre son avancement dans votre espace.`;
            } else {
                feedback = `C'est fait ! Votre demande est enregistrée. Numéro de suivi : ${trackingNumber}`;
            }

            return {
                success: true,
                skillName: 'SubmitServiceRequest',
                data: { requestId, trackingNumber },
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'SubmitServiceRequest',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('soumettre la demande', false)
            };
        }
    }

    /**
     * Vérifie le statut d'une demande
     */
    public async checkRequestStatus(
        signal: SkillActivationSignal,
        trackingNumber: string
    ): Promise<SkillResult<{ status: string; lastUpdate: Date; nextStep?: string }>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'CheckRequestStatus',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log(`🔍 [CheckRequestStatus] Numéro: ${trackingNumber}`);

        // TODO: Intégrer avec le système de suivi
        // const status = await requestService.getStatus(trackingNumber);

        const mockStatus = {
            status: 'En traitement',
            lastUpdate: new Date(),
            nextStep: 'Passage en commission'
        };

        const soul = iAstedSoul.getState();
        let feedback: string;

        if (soul.persona.formalityLevel === 3) {
            feedback = `${soul.persona.honorificPrefix}, votre demande ${trackingNumber} est actuellement "${mockStatus.status}". La prochaine étape est : ${mockStatus.nextStep}.`;
        } else {
            feedback = `Votre demande ${trackingNumber} est "${mockStatus.status}". Prochaine étape : ${mockStatus.nextStep}.`;
        }

        return {
            success: true,
            skillName: 'CheckRequestStatus',
            data: mockStatus,
            executionTime: Date.now() - startTime,
            vocalFeedback: feedback
        };
    }

    // ========== RENDEZ-VOUS ==========

    /**
     * Prend un rendez-vous
     */
    public async scheduleAppointment(
        signal: SkillActivationSignal,
        payload: AppointmentPayload
    ): Promise<SkillResult<{ appointmentId: string; confirmationCode: string }>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'ScheduleAppointment',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        try {
            iAstedSoul.setProcessing(true);
            iAstedSoul.queueAction('Prise de rendez-vous');

            console.log(`📅 [ScheduleAppointment] Date: ${payload.requestedDate}, Heure: ${payload.requestedTime}`);

            // TODO: Intégrer avec le système de RDV
            // const appointment = await appointmentService.book(payload);

            const appointmentId = `apt-${Date.now()}`;
            const confirmationCode = `RDV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

            iAstedSoul.completeAction('Prise de rendez-vous');
            iAstedSoul.setProcessing(false);

            const dateStr = payload.requestedDate.toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });

            const soul = iAstedSoul.getState();
            let feedback: string;

            if (soul.persona.formalityLevel === 3) {
                feedback = `${soul.persona.honorificPrefix}, votre rendez-vous est confirmé pour le ${dateStr} à ${payload.requestedTime}. Code de confirmation : ${confirmationCode}.`;
            } else {
                feedback = `Parfait ! Rendez-vous confirmé le ${dateStr} à ${payload.requestedTime}. Votre code : ${confirmationCode}.`;
            }

            return {
                success: true,
                skillName: 'ScheduleAppointment',
                data: { appointmentId, confirmationCode },
                executionTime: Date.now() - startTime,
                vocalFeedback: feedback
            };

        } catch (error) {
            iAstedSoul.setProcessing(false);
            return {
                success: false,
                skillName: 'ScheduleAppointment',
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                executionTime: Date.now() - startTime,
                vocalFeedback: this.generateVocalFeedback('prendre le rendez-vous', false)
            };
        }
    }

    // ========== FORMULAIRES ==========

    /**
     * Pré-remplit un formulaire avec les données connues
     */
    public async prefillForm(
        signal: SkillActivationSignal,
        formId: string,
        userProfile?: Record<string, unknown>
    ): Promise<SkillResult<FormData>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'PrefillForm',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log(`📝 [PrefillForm] Formulaire: ${formId}`);

        // TODO: Intégrer avec le système de formulaires
        const prefilledData: FormData = {
            formId,
            fields: userProfile || {},
            validated: false
        };

        return {
            success: true,
            skillName: 'PrefillForm',
            data: prefilledData,
            executionTime: Date.now() - startTime,
            vocalFeedback: 'J\'ai pré-rempli le formulaire avec vos informations. Vérifiez et complétez les champs manquants.'
        };
    }

    /**
     * Valide les données d'un formulaire
     */
    public async validateForm(
        signal: SkillActivationSignal,
        formData: FormData
    ): Promise<SkillResult<{ valid: boolean; errors?: string[] }>> {
        const startTime = Date.now();

        if (!this.validateActivation(signal)) {
            return {
                success: false,
                skillName: 'ValidateForm',
                error: 'Activation non autorisée',
                executionTime: Date.now() - startTime,
                vocalFeedback: ''
            };
        }

        console.log(`✅ [ValidateForm] Validation formulaire: ${formData.formId}`);

        // TODO: Intégrer les règles de validation
        const errors: string[] = [];

        // Vérifications basiques
        if (!formData.fields['nom']) errors.push('Le nom est requis');
        if (!formData.fields['prenom']) errors.push('Le prénom est requis');

        const valid = errors.length === 0;
        let feedback: string;

        if (valid) {
            feedback = 'Le formulaire est complet et prêt à être soumis.';
        } else {
            feedback = `Il manque quelques informations : ${errors.join(', ')}.`;
        }

        return {
            success: true,
            skillName: 'ValidateForm',
            data: { valid, errors: valid ? undefined : errors },
            executionTime: Date.now() - startTime,
            vocalFeedback: feedback
        };
    }
}

// ============================================================
// EXPORT
// ============================================================

export const AdministrativeSkills = AdministrativeSkillsClass.getInstance();
export type { AdministrativeSkillsClass };
