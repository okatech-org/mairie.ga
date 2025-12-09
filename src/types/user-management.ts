import { EntityType } from "./entity";

// Operational Functions that can be assigned to a user
export enum UserFunction {
    // État Civil
    CIVIL_REGISTRY_VIEW = 'CIVIL_REGISTRY_VIEW',
    CIVIL_REGISTRY_CREATE = 'CIVIL_REGISTRY_CREATE',
    CIVIL_REGISTRY_VALIDATE = 'CIVIL_REGISTRY_VALIDATE',
    CIVIL_REGISTRY_PRINT = 'CIVIL_REGISTRY_PRINT',

    // Urbanisme
    URBANISM_VIEW = 'URBANISM_VIEW',
    URBANISM_PROCESS = 'URBANISM_PROCESS',
    URBANISM_VALIDATE = 'URBANISM_VALIDATE',

    // Fiscalité
    FISCAL_VIEW = 'FISCAL_VIEW',
    FISCAL_COLLECT = 'FISCAL_COLLECT',
    FISCAL_VALIDATE = 'FISCAL_VALIDATE',

    // Affaires Sociales
    SOCIAL_VIEW = 'SOCIAL_VIEW',
    SOCIAL_PROCESS = 'SOCIAL_PROCESS',
    SOCIAL_VALIDATE = 'SOCIAL_VALIDATE',

    // Administration
    USER_MANAGEMENT = 'USER_MANAGEMENT',
    SETTINGS_MANAGEMENT = 'SETTINGS_MANAGEMENT',
    REPORTING_VIEW = 'REPORTING_VIEW'
}

// Service Access Definition
export interface ServiceAccess {
    serviceId: string; // e.g., 'visa-tourisme', 'passeport-ordinaire'
    canView: boolean;
    canProcess: boolean;
    canValidate: boolean;
    maxDailyQuota?: number;
}

// Billing Features (Premium features that might be billed)
export enum BillingFeature {
    PRIORITY_SUPPORT = 'PRIORITY_SUPPORT',
    ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
    API_ACCESS = 'API_ACCESS',
    UNLIMITED_STORAGE = 'UNLIMITED_STORAGE',
    SMS_NOTIFICATIONS = 'SMS_NOTIFICATIONS',
    WHATSAPP_INTEGRATION = 'WHATSAPP_INTEGRATION'
}

// Quota Limits for the user
export interface UserQuotas {
    maxDailyFiles?: number;
    maxStorageGB?: number;
    canExportData: boolean;
}
