/**
 * CORTEX - Entity: MunicipalRole
 * 
 * Pure enum representing roles in the Gabonese municipal hierarchy.
 * No external dependencies.
 */

// ============================================================
// ENUMS
// ============================================================

export enum MunicipalRole {
    // Direction
    MAIRE = 'MAIRE',
    MAIRE_ADJOINT = 'MAIRE_ADJOINT',
    SECRETAIRE_GENERAL = 'SECRETAIRE_GENERAL',

    // Encadrement
    CHEF_SERVICE = 'CHEF_SERVICE',
    CHEF_BUREAU = 'CHEF_BUREAU',

    // Agents
    AGENT_MUNICIPAL = 'AGENT_MUNICIPAL',
    AGENT_ETAT_CIVIL = 'AGENT_ETAT_CIVIL',
    AGENT_TECHNIQUE = 'AGENT_TECHNIQUE',
    AGENT_ACCUEIL = 'AGENT_ACCUEIL',
    STAGIAIRE = 'STAGIAIRE',

    // Usagers
    CITOYEN = 'CITOYEN',
    CITOYEN_AUTRE_COMMUNE = 'CITOYEN_AUTRE_COMMUNE',
    ETRANGER_RESIDENT = 'ETRANGER_RESIDENT',
    PERSONNE_MORALE = 'PERSONNE_MORALE'
}

export enum EmploymentStatus {
    FONCTIONNAIRE = 'FONCTIONNAIRE',
    CONTRACTUEL = 'CONTRACTUEL',
    VACATAIRE = 'VACATAIRE',
    STAGIAIRE = 'STAGIAIRE',
    USAGER = 'USAGER'
}

export enum ServiceDepartment {
    DIRECTION = 'DIRECTION',
    ETAT_CIVIL = 'ETAT_CIVIL',
    URBANISME = 'URBANISME',
    FISCALITE = 'FISCALITE',
    AFFAIRES_SOCIALES = 'AFFAIRES_SOCIALES',
    HYGIENE_SALUBRITE = 'HYGIENE_SALUBRITE',
    ACCUEIL = 'ACCUEIL'
}

// ============================================================
// VALUE OBJECTS
// ============================================================

export interface RoleDefinition {
    readonly role: MunicipalRole;
    readonly label: string;
    readonly labelFeminin: string;
    readonly hierarchyLevel: number;
    readonly department?: ServiceDepartment;
    readonly employmentStatus: EmploymentStatus;
    readonly permissions: readonly string[];
    readonly canManageRoles: readonly MunicipalRole[];
}

// ============================================================
// HELPERS (Pure functions, no side effects)
// ============================================================

export function isStaffRole(role: MunicipalRole): boolean {
    return ![
        MunicipalRole.CITOYEN,
        MunicipalRole.CITOYEN_AUTRE_COMMUNE,
        MunicipalRole.ETRANGER_RESIDENT,
        MunicipalRole.PERSONNE_MORALE
    ].includes(role);
}

export function isUserRole(role: MunicipalRole): boolean {
    return !isStaffRole(role);
}

export function getHierarchyLevel(role: MunicipalRole): number {
    const levels: Record<MunicipalRole, number> = {
        [MunicipalRole.MAIRE]: 1,
        [MunicipalRole.MAIRE_ADJOINT]: 2,
        [MunicipalRole.SECRETAIRE_GENERAL]: 3,
        [MunicipalRole.CHEF_SERVICE]: 4,
        [MunicipalRole.CHEF_BUREAU]: 5,
        [MunicipalRole.AGENT_MUNICIPAL]: 6,
        [MunicipalRole.AGENT_ETAT_CIVIL]: 6,
        [MunicipalRole.AGENT_TECHNIQUE]: 6,
        [MunicipalRole.AGENT_ACCUEIL]: 7,
        [MunicipalRole.STAGIAIRE]: 8,
        [MunicipalRole.CITOYEN]: 0,
        [MunicipalRole.CITOYEN_AUTRE_COMMUNE]: 0,
        [MunicipalRole.ETRANGER_RESIDENT]: 0,
        [MunicipalRole.PERSONNE_MORALE]: 0
    };
    return levels[role];
}
