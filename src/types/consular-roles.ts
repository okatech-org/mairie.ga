import { EntityType } from './entity';

// Énumération des rôles consulaires
export enum ConsularRole {
    // CONSULAT_GENERAL uniquement
    CONSUL_GENERAL = 'CONSUL_GENERAL',

    // CONSULAT_GENERAL, CONSULAT, AMBASSADE
    CONSUL = 'CONSUL',

    // CONSULAT_GENERAL, CONSULAT uniquement (PAS AMBASSADE)
    VICE_CONSUL = 'VICE_CONSUL',

    // CONSULAT_GENERAL, CONSULAT, AMBASSADE
    CHARGE_AFFAIRES_CONSULAIRES = 'CHARGE_AFFAIRES_CONSULAIRES',

    // CONSULAT_GENERAL, CONSULAT, AMBASSADE
    AGENT_CONSULAIRE = 'AGENT_CONSULAIRE',

    // CONSULAT_GENERAL, CONSULAT, AMBASSADE
    STAGIAIRE = 'STAGIAIRE',

    // Utilisateur standard
    CITIZEN = 'CITIZEN',

    // Usager étranger
    FOREIGNER = 'FOREIGNER'
}

// Énumération du statut d'emploi
export enum EmploymentStatus {
    FONCTIONNAIRE = 'FONCTIONNAIRE',
    CONTRACTUEL = 'CONTRACTUEL',
    CITOYEN = 'CITOYEN'
}

// Interface pour valider les rôles par entité
export interface RoleEntityMapping {
    role: ConsularRole;
    allowedEntityTypes: EntityType[];
    employmentStatus: EmploymentStatus;
    hierarchyLevel: number;
    canManageRoles: ConsularRole[];
}

// Mapping complet de la hiérarchie
export const ROLE_ENTITY_MAPPING: Record<ConsularRole, RoleEntityMapping> = {
    [ConsularRole.CONSUL_GENERAL]: {
        role: ConsularRole.CONSUL_GENERAL,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 1,
        canManageRoles: [
            ConsularRole.CONSUL,
            ConsularRole.VICE_CONSUL,
            ConsularRole.CHARGE_AFFAIRES_CONSULAIRES,
            ConsularRole.AGENT_CONSULAIRE,
            ConsularRole.STAGIAIRE
        ]
    },

    [ConsularRole.CONSUL]: {
        role: ConsularRole.CONSUL,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 2,
        canManageRoles: [
            ConsularRole.VICE_CONSUL,
            ConsularRole.CHARGE_AFFAIRES_CONSULAIRES,
            ConsularRole.AGENT_CONSULAIRE,
            ConsularRole.STAGIAIRE
        ]
    },

    [ConsularRole.VICE_CONSUL]: {
        role: ConsularRole.VICE_CONSUL,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 3,
        canManageRoles: [
            ConsularRole.CHARGE_AFFAIRES_CONSULAIRES,
            ConsularRole.AGENT_CONSULAIRE,
            ConsularRole.STAGIAIRE
        ]
    },

    [ConsularRole.CHARGE_AFFAIRES_CONSULAIRES]: {
        role: ConsularRole.CHARGE_AFFAIRES_CONSULAIRES,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 4,
        canManageRoles: [
            ConsularRole.AGENT_CONSULAIRE,
            ConsularRole.STAGIAIRE
        ]
    },

    [ConsularRole.AGENT_CONSULAIRE]: {
        role: ConsularRole.AGENT_CONSULAIRE,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.CONTRACTUEL,
        hierarchyLevel: 5,
        canManageRoles: [ConsularRole.STAGIAIRE]
    },

    [ConsularRole.STAGIAIRE]: {
        role: ConsularRole.STAGIAIRE,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.CONTRACTUEL,
        hierarchyLevel: 6,
        canManageRoles: []
    },

    [ConsularRole.CITIZEN]: {
        role: ConsularRole.CITIZEN,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.CITOYEN,
        hierarchyLevel: 0,
        canManageRoles: []
    },

    [ConsularRole.FOREIGNER]: {
        role: ConsularRole.FOREIGNER,
        allowedEntityTypes: [EntityType.CONSULAT_GENERAL, EntityType.CONSULAT, EntityType.AMBASSADE, EntityType.HAUT_COMMISSARIAT, EntityType.MISSION_PERMANENTE],
        employmentStatus: EmploymentStatus.CITOYEN, // Considered as user
        hierarchyLevel: 0,
        canManageRoles: []
    }
};
