import { MunicipalRole } from "@/types/municipal-roles";
import { UserFunction } from "@/types/user-management";
import { ServiceCategory } from "@/types/municipal-services";

export interface RoleDefaults {
    functions: UserFunction[];
    serviceCategories: ServiceCategory[]; // Categories of services they should have access to
    serviceAccessLevel: {
        canView: boolean;
        canProcess: boolean;
        canValidate: boolean;
    };
}

export const ROLE_DEFAULTS: Record<MunicipalRole, RoleDefaults> = {
    // DIRECTION
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
        serviceCategories: [
            ServiceCategory.ETAT_CIVIL,
            ServiceCategory.URBANISME,
            ServiceCategory.FISCALITE,
            ServiceCategory.AFFAIRES_SOCIALES,
            ServiceCategory.LEGALISATION,
            ServiceCategory.ENTREPRISES,
            ServiceCategory.ENVIRONNEMENT,
            ServiceCategory.VOIRIE
        ],
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

    // SERVICE HEADS
    [MunicipalRole.CHEF_SERVICE_ETAT_CIVIL]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.CIVIL_REGISTRY_CREATE,
            UserFunction.CIVIL_REGISTRY_VALIDATE,
            UserFunction.CIVIL_REGISTRY_PRINT,
            UserFunction.REPORTING_VIEW,
            UserFunction.USER_MANAGEMENT
        ],
        serviceCategories: [ServiceCategory.ETAT_CIVIL, ServiceCategory.LEGALISATION],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: true }
    },
    [MunicipalRole.CHEF_SERVICE_URBANISME]: {
        functions: [
            UserFunction.URBANISM_VIEW,
            UserFunction.URBANISM_PROCESS,
            UserFunction.URBANISM_VALIDATE,
            UserFunction.REPORTING_VIEW,
            UserFunction.USER_MANAGEMENT
        ],
        serviceCategories: [ServiceCategory.URBANISME, ServiceCategory.VOIRIE, ServiceCategory.ENVIRONNEMENT],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: true }
    },

    // AGENTS
    [MunicipalRole.OFFICIER_ETAT_CIVIL]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.CIVIL_REGISTRY_CREATE,
            UserFunction.CIVIL_REGISTRY_PRINT
        ],
        serviceCategories: [ServiceCategory.ETAT_CIVIL, ServiceCategory.LEGALISATION],
        serviceAccessLevel: { canView: true, canProcess: true, canValidate: false }
    },
    [MunicipalRole.AGENT_MUNICIPAL]: {
        functions: [
            UserFunction.CIVIL_REGISTRY_VIEW,
            UserFunction.URBANISM_VIEW
        ],
        serviceCategories: [ServiceCategory.ETAT_CIVIL, ServiceCategory.URBANISME],
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

    // USAGERS (Unified public user role)
    [MunicipalRole.USAGER]: { functions: [], serviceCategories: [], serviceAccessLevel: { canView: true, canProcess: false, canValidate: false } }
};

export function getDefaultsForRole(role: MunicipalRole) {
    return ROLE_DEFAULTS[role] || {
        functions: [],
        serviceCategories: [],
        serviceAccessLevel: { canView: false, canProcess: false, canValidate: false }
    };
}
