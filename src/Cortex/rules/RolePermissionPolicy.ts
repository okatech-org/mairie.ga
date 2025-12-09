/**
 * CORTEX - Rule: RolePermissionPolicy
 * 
 * Pure business logic for determining permissions based on roles.
 * No external dependencies.
 */

import { MunicipalRole, ServiceDepartment, getHierarchyLevel } from '../entities/MunicipalRole';

// ============================================================
// ENUMS (Functions a user can perform)
// ============================================================

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

export enum ServiceCategory {
    ETAT_CIVIL = 'ETAT_CIVIL',
    URBANISME = 'URBANISME',
    FISCALITE = 'FISCALITE',
    AFFAIRES_SOCIALES = 'AFFAIRES_SOCIALES',
    LEGALISATION = 'LEGALISATION',
    ENTREPRISES = 'ENTREPRISES',
    ENVIRONNEMENT = 'ENVIRONNEMENT',
    VOIRIE = 'VOIRIE'
}

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface ServiceAccessLevel {
    readonly canView: boolean;
    readonly canProcess: boolean;
    readonly canValidate: boolean;
}

export interface RoleDefaults {
    readonly functions: readonly UserFunction[];
    readonly serviceCategories: readonly ServiceCategory[];
    readonly serviceAccessLevel: ServiceAccessLevel;
}

// ============================================================
// POLICY (Pure function mapping)
// ============================================================

const ROLE_DEFAULTS: Record<MunicipalRole, RoleDefaults> = {
    [MunicipalRole.MAIRE]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.CIVIL_REGISTRY_VALIDATE,
            UserFunction.CIVIL_REGISTRY_PRINT,
            UserFunction.URBANISM_VIEW,
            UserFunction.URBANISM_VALIDATE,
            UserFunction.FISCAL_VIEW,
            UserFunction.FISCAL_VALIDATE,
            UserFunction.SOCIAL_VIEW,
            UserFunction.SOCIAL_VALIDATE,
            UserFunction.USER_MANAGEMENT,
            UserFunction.SETTINGS_MANAGEMENT,
            UserFunction.REPORTING_VIEW
        ],
        serviceCategories: Object.values(ServiceCategory),
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: true }
    },
    [MunicipalRole.MAIRE_ADJOINT]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.CIVIL_REGISTRY_VALIDATE,
            UserFunction.URBANISM_VIEW,
            UserFunction.URBANISM_VALIDATE,
            UserFunction.FISCAL_VIEW,
            UserFunction.SOCIAL_VIEW,
            UserFunction.USER_MANAGEMENT,
            UserFunction.REPORTING_VIEW
        ],
        serviceCategories: [
            ServiceCategory.ETAT_CIVIL,
            ServiceCategory.URBANISME,
            ServiceCategory.FISCALITE,
            ServiceCategory.AFFAIRES_SOCIALES,
            ServiceCategory.LEGALISATION
        ],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: true }
    },
    [MunicipalRole.SECRETAIRE_GENERAL]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.URBANISM_VIEW,
            UserFunction.FISCAL_VIEW,
            UserFunction.SOCIAL_VIEW,
            UserFunction.USER_MANAGEMENT,
            UserFunction.SETTINGS_MANAGEMENT,
            UserFunction.REPORTING_VIEW
        ],
        serviceCategories: [
            ServiceCategory.ETAT_CIVIL,
            ServiceCategory.URBANISME,
            ServiceCategory.FISCALITE,
            ServiceCategory.AFFAIRES_SOCIALES,
            ServiceCategory.LEGALISATION,
            ServiceCategory.ENTREPRISES
        ],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.CHEF_SERVICE]: {
        functions: [UserFunction.REPORTING_VIEW, UserFunction.USER_MANAGEMENT],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: true }
    },
    [MunicipalRole.CHEF_BUREAU]: {
        functions: [UserFunction.REPORTING_VIEW],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.AGENT_ETAT_CIVIL]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.CIVIL_REGISTRY_CREATE,
            UserFunction.CIVIL_REGISTRY_PRINT
        ],
        serviceCategories: [ServiceCategory.ETAT_CIVIL, ServiceCategory.LEGALISATION],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.AGENT_MUNICIPAL]: {
        functions: [UserFunction.CIVIL_REGISTRY_VIEW, UserFunction.URBANISM_VIEW],
        serviceCategories: [ServiceCategory.ETAT_CIVIL, ServiceCategory.URBANISME],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.AGENT_TECHNIQUE]: {
        functions: [UserFunction.URBANISM_VIEW, UserFunction.URBANISM_PROCESS],
        serviceCategories: [ServiceCategory.URBANISME, ServiceCategory.VOIRIE, ServiceCategory.ENVIRONNEMENT],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.AGENT_ACCUEIL]: {
        functions: [],
        serviceCategories: [
            ServiceCategory.ETAT_CIVIL,
            ServiceCategory.URBANISME,
            ServiceCategory.FISCALITE,
            ServiceCategory.AFFAIRES_SOCIALES
        ],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    },
    [MunicipalRole.STAGIAIRE]: {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    },
    [MunicipalRole.CITOYEN]: {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    },
    [MunicipalRole.CITOYEN_AUTRE_COMMUNE]: {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    },
    [MunicipalRole.ETRANGER_RESIDENT]: {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    },
    [MunicipalRole.PERSONNE_MORALE]: {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: true, canProcess: false, canValidate: false }
    }
};

// ============================================================
// POLICY FUNCTIONS
// ============================================================

/**
 * Get default permissions for a given role
 */
export function getDefaultsForRole(role: MunicipalRole): RoleDefaults {
    return ROLE_DEFAULTS[role] || {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: false, canProcess: false, canValidate: false }
    };
}

/**
 * Check if a manager role can manage a target role
 */
export function canManageRole(managerRole: MunicipalRole, targetRole: MunicipalRole): boolean {
    const managerLevel = getHierarchyLevel(managerRole);
    const targetLevel = getHierarchyLevel(targetRole);

    // Can only manage roles below in hierarchy
    return managerLevel > 0 && managerLevel < targetLevel;
}

/**
 * Check if a role has a specific function
 */
export function hasFunction(role: MunicipalRole, func: UserFunction): boolean {
    const defaults = getDefaultsForRole(role);
    return defaults.functions.includes(func);
}

/**
 * Check if a role has access to a service category
 */
export function hasServiceAccess(role: MunicipalRole, category: ServiceCategory): boolean {
    const defaults = getDefaultsForRole(role);
    return defaults.serviceCategories.includes(category);
}
