/**
 * CORTEX - SKILLS: Central Export
 * 
 * Les Compétences Cognitives d'iAsted.
 * Ces skills sont les "réflexes inconscients" que la Conscience active.
 * 
 * RÈGLE: Les skills ne s'exécutent jamais seuls.
 * Ils doivent recevoir un Signal d'Activation signé par iAstedSoul.
 */

// Skills
export { CommunicationSkills } from './CommunicationSkills';
export { AdministrativeSkills } from './AdministrativeSkills';
export { NavigationSkills } from './NavigationSkills';
export { municipalDocumentSkill, MunicipalDocumentSkill } from './MunicipalDocumentSkills';

// Types réutilisables
export type {
    SkillActivationSignal,
    SkillResult,
    EmailPayload,
    CallPayload,
    NotificationPayload
} from './CommunicationSkills';

export type {
    DocumentGenerationPayload,
    ServiceRequestPayload,
    AppointmentPayload,
    FormData
} from './AdministrativeSkills';

export type {
    NavigationTarget,
    ScrollTarget
} from './NavigationSkills';

export type {
    VoiceDocumentCommand,
    DocumentGenerationResult
} from './MunicipalDocumentSkills';
