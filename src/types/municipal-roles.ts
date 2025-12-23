// Types pour les rôles municipaux gabonais

export enum MunicipalRole {
    // Direction
    MAIRE = 'MAIRE',
    MAIRE_ADJOINT = 'MAIRE_ADJOINT',
    SECRETAIRE_GENERAL = 'SECRETAIRE_GENERAL',

    // Services Techniques
    CHEF_SERVICE_ETAT_CIVIL = 'CHEF_SERVICE_ETAT_CIVIL',
    CHEF_SERVICE_URBANISME = 'CHEF_SERVICE_URBANISME',
    OFFICIER_ETAT_CIVIL = 'OFFICIER_ETAT_CIVIL',
    AGENT_MUNICIPAL = 'AGENT_MUNICIPAL',

    // Support
    AGENT_ACCUEIL = 'AGENT_ACCUEIL',
    STAGIAIRE = 'STAGIAIRE',

    // Usagers
    USAGER = 'USAGER'
}

export enum EmploymentStatus {
    FONCTIONNAIRE = 'FONCTIONNAIRE',
    CONTRACTUEL = 'CONTRACTUEL',
    VACATAIRE = 'VACATAIRE',
    STAGIAIRE = 'STAGIAIRE',
    USAGER = 'USAGER',
    CITOYEN = 'USAGER' // Alias for backwards compatibility
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

export interface RoleMunicipalMapping {
    role: MunicipalRole;
    label: string;
    labelFeminin: string;
    allowedOrgTypes: string[];
    employmentStatus: EmploymentStatus;
    hierarchyLevel: number;
    department?: ServiceDepartment;
    canManageRoles: MunicipalRole[];
    permissions: string[];
}

export const MUNICIPAL_ROLE_MAPPING: Record<MunicipalRole, RoleMunicipalMapping> = {
    [MunicipalRole.MAIRE]: {
        role: MunicipalRole.MAIRE,
        label: 'Maire',
        labelFeminin: 'Maire',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 1,
        department: ServiceDepartment.DIRECTION,
        canManageRoles: [
            MunicipalRole.MAIRE_ADJOINT,
            MunicipalRole.SECRETAIRE_GENERAL,
            MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
            MunicipalRole.CHEF_SERVICE_URBANISME,
            MunicipalRole.OFFICIER_ETAT_CIVIL,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Supervision globale',
            'Signature actes officiels',
            'Gestion budget',
            'Représentation légale',
            'Validation finale demandes',
            'Gestion personnel'
        ]
    },

    [MunicipalRole.MAIRE_ADJOINT]: {
        role: MunicipalRole.MAIRE_ADJOINT,
        label: 'Maire Adjoint',
        labelFeminin: 'Maire Adjointe',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 2,
        department: ServiceDepartment.DIRECTION,
        canManageRoles: [
            MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
            MunicipalRole.CHEF_SERVICE_URBANISME,
            MunicipalRole.OFFICIER_ETAT_CIVIL,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Délégation Maire',
            'Supervision services',
            'Validation demandes',
            'Gestion quotidienne'
        ]
    },

    [MunicipalRole.SECRETAIRE_GENERAL]: {
        role: MunicipalRole.SECRETAIRE_GENERAL,
        label: 'Secrétaire Général',
        labelFeminin: 'Secrétaire Générale',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 3,
        department: ServiceDepartment.DIRECTION,
        canManageRoles: [
            MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
            MunicipalRole.CHEF_SERVICE_URBANISME,
            MunicipalRole.OFFICIER_ETAT_CIVIL,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Coordination administrative',
            'Gestion ressources humaines',
            'Suivi dossiers',
            'Reporting'
        ]
    },

    [MunicipalRole.CHEF_SERVICE_ETAT_CIVIL]: {
        role: MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
        label: 'Chef Service État Civil',
        labelFeminin: 'Cheffe Service État Civil',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 4,
        department: ServiceDepartment.ETAT_CIVIL,
        canManageRoles: [
            MunicipalRole.OFFICIER_ETAT_CIVIL,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Gestion service état civil',
            'Validation technique actes',
            'Encadrement officiers',
            'Rapports statistiques'
        ]
    },

    [MunicipalRole.CHEF_SERVICE_URBANISME]: {
        role: MunicipalRole.CHEF_SERVICE_URBANISME,
        label: 'Chef Service Urbanisme',
        labelFeminin: 'Cheffe Service Urbanisme',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 4,
        department: ServiceDepartment.URBANISME,
        canManageRoles: [
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Gestion service urbanisme',
            'Instruction permis',
            'Validation technique dossiers',
            'Suivi terrain'
        ]
    },

    [MunicipalRole.OFFICIER_ETAT_CIVIL]: {
        role: MunicipalRole.OFFICIER_ETAT_CIVIL,
        label: 'Officier d\'État Civil',
        labelFeminin: 'Officière d\'État Civil',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 6,
        department: ServiceDepartment.ETAT_CIVIL,
        canManageRoles: [MunicipalRole.STAGIAIRE],
        permissions: [
            'Établissement actes',
            'Célébration mariages',
            'Tenue des registres'
        ]
    },

    [MunicipalRole.AGENT_MUNICIPAL]: {
        role: MunicipalRole.AGENT_MUNICIPAL,
        label: 'Agent Municipal',
        labelFeminin: 'Agente Municipale',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.CONTRACTUEL,
        hierarchyLevel: 6,
        department: ServiceDepartment.ACCUEIL,
        canManageRoles: [MunicipalRole.STAGIAIRE, MunicipalRole.AGENT_ACCUEIL],
        permissions: [
            'Traitement demandes',
            'Accueil usagers',
            'Saisie données'
        ]
    },

    [MunicipalRole.AGENT_ACCUEIL]: {
        role: MunicipalRole.AGENT_ACCUEIL,
        label: 'Agent d\'Accueil',
        labelFeminin: 'Agente d\'Accueil',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.CONTRACTUEL,
        hierarchyLevel: 7,
        department: ServiceDepartment.ACCUEIL,
        canManageRoles: [MunicipalRole.STAGIAIRE],
        permissions: [
            'Accueil usagers',
            'Orientation',
            'Délivrance formulaires',
            'Information générale'
        ]
    },

    [MunicipalRole.STAGIAIRE]: {
        role: MunicipalRole.STAGIAIRE,
        label: 'Stagiaire',
        labelFeminin: 'Stagiaire',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.STAGIAIRE,
        hierarchyLevel: 7,
        canManageRoles: [],
        permissions: [
            'Support traitement',
            'Apprentissage',
            'Saisie données'
        ]
    },

    [MunicipalRole.USAGER]: {
        role: MunicipalRole.USAGER,
        label: 'Usager',
        labelFeminin: 'Usager',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE'],
        employmentStatus: EmploymentStatus.USAGER,
        hierarchyLevel: 0,
        canManageRoles: [],
        permissions: [
            'Mes demandes',
            'Mon profil',
            'État Civil',
            'Urbanisme',
            'Légalisations'
        ]
    }
};

// Helper functions
export const getRoleLabel = (role: MunicipalRole, feminine = false): string => {
    const mapping = MUNICIPAL_ROLE_MAPPING[role];
    return feminine ? mapping.labelFeminin : mapping.label;
};

export const getRoleHierarchyLevel = (role: MunicipalRole): number => {
    return MUNICIPAL_ROLE_MAPPING[role].hierarchyLevel;
};

export const canManageRole = (managerRole: MunicipalRole, targetRole: MunicipalRole): boolean => {
    return MUNICIPAL_ROLE_MAPPING[managerRole].canManageRoles.includes(targetRole);
};

export const isStaffRole = (role: MunicipalRole): boolean => {
    return role !== MunicipalRole.USAGER;
};

export const isUserRole = (role: MunicipalRole): boolean => {
    return role === MunicipalRole.USAGER;
};

// Compatibility aliases for legacy code
export const ConsularRole = {
    ...MunicipalRole,
    CONSUL_GENERAL: MunicipalRole.MAIRE,
    CONSUL: MunicipalRole.MAIRE_ADJOINT,
    VICE_CONSUL: MunicipalRole.SECRETAIRE_GENERAL,
    CHARGE_AFFAIRES_CONSULAIRES: MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
    AGENT_CONSULAIRE: MunicipalRole.AGENT_MUNICIPAL,
    CITIZEN: MunicipalRole.USAGER,
    FOREIGNER: MunicipalRole.USAGER
} as const;

export type ConsularRoleType = MunicipalRole;

// Re-export for hierarchy validation with allowedEntityTypes
export const ROLE_ENTITY_MAPPING: Record<MunicipalRole, RoleMunicipalMapping & { allowedEntityTypes: string[] }> =
    Object.fromEntries(
        Object.entries(MUNICIPAL_ROLE_MAPPING).map(([key, value]) => [
            key,
            { ...value, allowedEntityTypes: value.allowedOrgTypes }
        ])
    ) as any;
