// Types pour les rôles municipaux gabonais

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
    STAGIAIRE = 'STAGIAIRE',
    
    // Usagers
    CITOYEN = 'CITOYEN',
    ETRANGER_RESIDENT = 'ETRANGER_RESIDENT',
    PERSONNE_MORALE = 'PERSONNE_MORALE'
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
            MunicipalRole.CHEF_SERVICE,
            MunicipalRole.CHEF_BUREAU,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.AGENT_ETAT_CIVIL,
            MunicipalRole.AGENT_TECHNIQUE,
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
            MunicipalRole.CHEF_SERVICE,
            MunicipalRole.CHEF_BUREAU,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.AGENT_ETAT_CIVIL,
            MunicipalRole.AGENT_TECHNIQUE,
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
            MunicipalRole.CHEF_SERVICE,
            MunicipalRole.CHEF_BUREAU,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.AGENT_ETAT_CIVIL,
            MunicipalRole.AGENT_TECHNIQUE,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Coordination administrative',
            'Gestion ressources humaines',
            'Suivi dossiers',
            'Reporting'
        ]
    },

    [MunicipalRole.CHEF_SERVICE]: {
        role: MunicipalRole.CHEF_SERVICE,
        label: 'Chef de Service',
        labelFeminin: 'Cheffe de Service',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 4,
        canManageRoles: [
            MunicipalRole.CHEF_BUREAU,
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.AGENT_ETAT_CIVIL,
            MunicipalRole.AGENT_TECHNIQUE,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Gestion service',
            'Validation technique',
            'Encadrement équipe',
            'Planification'
        ]
    },

    [MunicipalRole.CHEF_BUREAU]: {
        role: MunicipalRole.CHEF_BUREAU,
        label: 'Chef de Bureau',
        labelFeminin: 'Cheffe de Bureau',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.FONCTIONNAIRE,
        hierarchyLevel: 5,
        canManageRoles: [
            MunicipalRole.AGENT_MUNICIPAL,
            MunicipalRole.AGENT_ETAT_CIVIL,
            MunicipalRole.AGENT_TECHNIQUE,
            MunicipalRole.STAGIAIRE
        ],
        permissions: [
            'Gestion bureau',
            'Traitement dossiers',
            'Encadrement agents'
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
        canManageRoles: [MunicipalRole.STAGIAIRE],
        permissions: [
            'Traitement demandes',
            'Accueil usagers',
            'Saisie données'
        ]
    },

    [MunicipalRole.AGENT_ETAT_CIVIL]: {
        role: MunicipalRole.AGENT_ETAT_CIVIL,
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
            'Registres état civil'
        ]
    },

    [MunicipalRole.AGENT_TECHNIQUE]: {
        role: MunicipalRole.AGENT_TECHNIQUE,
        label: 'Agent Technique',
        labelFeminin: 'Agente Technique',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.CONTRACTUEL,
        hierarchyLevel: 6,
        department: ServiceDepartment.URBANISME,
        canManageRoles: [MunicipalRole.STAGIAIRE],
        permissions: [
            'Instruction technique',
            'Visites terrain',
            'Avis techniques'
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

    [MunicipalRole.CITOYEN]: {
        role: MunicipalRole.CITOYEN,
        label: 'Citoyen',
        labelFeminin: 'Citoyenne',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.USAGER,
        hierarchyLevel: 0,
        canManageRoles: [],
        permissions: [
            'Déposer demandes',
            'Suivre dossiers',
            'Prendre rendez-vous',
            'Télécharger documents'
        ]
    },

    [MunicipalRole.ETRANGER_RESIDENT]: {
        role: MunicipalRole.ETRANGER_RESIDENT,
        label: 'Étranger Résident',
        labelFeminin: 'Étrangère Résidente',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.USAGER,
        hierarchyLevel: 0,
        canManageRoles: [],
        permissions: [
            'Certificat résidence',
            'Attestations',
            'Légalisations'
        ]
    },

    [MunicipalRole.PERSONNE_MORALE]: {
        role: MunicipalRole.PERSONNE_MORALE,
        label: 'Personne Morale',
        labelFeminin: 'Personne Morale',
        allowedOrgTypes: ['MAIRIE_CENTRALE', 'MAIRIE_ARRONDISSEMENT', 'MAIRIE_COMMUNE', 'COMMUNAUTE_URBAINE'],
        employmentStatus: EmploymentStatus.USAGER,
        hierarchyLevel: 0,
        canManageRoles: [],
        permissions: [
            'Patente commerciale',
            'Autorisations',
            'Marchés publics',
            'Fiscalité entreprise'
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
    return ![MunicipalRole.CITOYEN, MunicipalRole.ETRANGER_RESIDENT, MunicipalRole.PERSONNE_MORALE].includes(role);
};

export const isUserRole = (role: MunicipalRole): boolean => {
    return [MunicipalRole.CITOYEN, MunicipalRole.ETRANGER_RESIDENT, MunicipalRole.PERSONNE_MORALE].includes(role);
};

// Compatibility aliases for legacy code
export const ConsularRole = {
    ...MunicipalRole,
    CONSUL_GENERAL: MunicipalRole.MAIRE,
    CONSUL: MunicipalRole.MAIRE_ADJOINT,
    VICE_CONSUL: MunicipalRole.SECRETAIRE_GENERAL,
    CHARGE_AFFAIRES_CONSULAIRES: MunicipalRole.CHEF_SERVICE,
    AGENT_CONSULAIRE: MunicipalRole.AGENT_MUNICIPAL,
    CITIZEN: MunicipalRole.CITOYEN,
    FOREIGNER: MunicipalRole.ETRANGER_RESIDENT
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
