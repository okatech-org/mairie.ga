/**
 * Role Context Configuration for mairie.ga
 * Defines metadata and permissions for each municipal role that has access to iAsted
 */

// Municipal role types
export type MunicipalAppRole =
    | 'maire'
    | 'maire_adjoint'
    | 'secretaire_general'
    | 'chef_service'
    | 'agent'
    | 'super_admin'
    | 'admin'
    | 'citizen'
    | 'citizen_other'
    | 'foreigner'
    | 'company'
    | 'association'
    | 'visitor'
    | 'unknown';

// Backward compatibility alias
export type AppRole = MunicipalAppRole;

// Roles authorized to access iAsted (everyone connected)
export const IASTED_AUTHORIZED_ROLES: MunicipalAppRole[] = [
    'maire',
    'maire_adjoint',
    'secretaire_general',
    'chef_service',
    'agent',
    'super_admin',
    'admin',
    'citizen',
    'citizen_other',
    'foreigner',
    'company',
    'association'
];

// Roles that can use Correspondance features (municipal staff only)
export const CORRESPONDANCE_AUTHORIZED_ROLES: MunicipalAppRole[] = [
    'maire',
    'maire_adjoint',
    'secretaire_general',
    'chef_service',
    'agent',
    'super_admin',
    'admin'
];

export interface RoleContext {
    role: MunicipalAppRole;
    defaultTitle: string; // Pre-formatted title for greeting
    appellationCourte: string; // Short form for quick references
    tone: 'formal' | 'professional' | 'friendly';
    accessLevel: 'full' | 'high' | 'medium' | 'limited' | 'basic';
    availableTools: string[];
    contextDescription: string;
}

export const ROLE_CONTEXTS: Record<MunicipalAppRole, RoleContext> = {
    maire: {
        role: 'maire',
        defaultTitle: 'Monsieur le Maire',
        appellationCourte: 'Excellence',
        tone: 'formal',
        accessLevel: 'full',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'send_correspondence',
            'view_statistics',
            'manage_services'
        ],
        contextDescription: 'Vous assistez le Maire dans la gestion de la commune. Le Maire est la première autorité municipale.'
    },
    maire_adjoint: {
        role: 'maire_adjoint',
        defaultTitle: 'Monsieur le Maire Adjoint',
        appellationCourte: 'Monsieur l\'Adjoint',
        tone: 'formal',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'send_correspondence',
            'view_statistics'
        ],
        contextDescription: 'Vous assistez le Maire Adjoint dans la coordination des services municipaux.'
    },
    secretaire_general: {
        role: 'secretaire_general',
        defaultTitle: 'Monsieur le Secrétaire Général',
        appellationCourte: 'Monsieur le SG',
        tone: 'professional',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'send_correspondence',
            'coordinate_services'
        ],
        contextDescription: 'Vous assistez le Secrétaire Général dans l\'administration de la mairie.'
    },
    chef_service: {
        role: 'chef_service',
        defaultTitle: 'Monsieur le Chef de Service',
        appellationCourte: 'Chef',
        tone: 'professional',
        accessLevel: 'medium',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'manage_service_tasks'
        ],
        contextDescription: 'Vous assistez le Chef de Service dans la gestion de son département.'
    },
    agent: {
        role: 'agent',
        defaultTitle: 'Cher collègue',
        appellationCourte: 'Collègue',
        tone: 'friendly',
        accessLevel: 'limited',
        availableTools: [
            'control_ui',
            'navigate_app',
            'read_correspondence',
            'view_tasks'
        ],
        contextDescription: 'Vous assistez l\'agent municipal dans ses tâches quotidiennes.'
    },
    super_admin: {
        role: 'super_admin',
        defaultTitle: 'Monsieur l\'Administrateur',
        appellationCourte: 'Admin',
        tone: 'professional',
        accessLevel: 'full',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'send_correspondence',
            'manage_users',
            'system_configuration'
        ],
        contextDescription: 'Vous assistez le Super Administrateur système. Accès complet à toutes les fonctionnalités.'
    },
    admin: {
        role: 'admin',
        defaultTitle: 'Monsieur le Directeur',
        appellationCourte: 'Directeur',
        tone: 'professional',
        accessLevel: 'high',
        availableTools: [
            'control_ui',
            'navigate_app',
            'generate_document',
            'read_correspondence',
            'create_correspondence',
            'send_correspondence',
            'manage_users'
        ],
        contextDescription: 'Vous assistez l\'Administrateur dans la gestion du système.'
    },
    citizen: {
        role: 'citizen',
        defaultTitle: 'Cher administré',
        appellationCourte: 'Citoyen',
        tone: 'friendly',
        accessLevel: 'basic',
        availableTools: [
            'control_ui',
            'navigate_app',
            'request_service',
            'schedule_appointment',
            'view_requests'
        ],
        contextDescription: 'Vous assistez un citoyen de la commune dans ses démarches administratives.'
    },
    citizen_other: {
        role: 'citizen_other',
        defaultTitle: 'Cher visiteur',
        appellationCourte: 'Visiteur',
        tone: 'friendly',
        accessLevel: 'basic',
        availableTools: [
            'control_ui',
            'navigate_app',
            'request_service',
            'get_service_info'
        ],
        contextDescription: 'Vous assistez un citoyen d\'une autre commune dans ses démarches.'
    },
    foreigner: {
        role: 'foreigner',
        defaultTitle: 'Cher résident',
        appellationCourte: 'Résident',
        tone: 'friendly',
        accessLevel: 'basic',
        availableTools: [
            'control_ui',
            'navigate_app',
            'request_service',
            'get_service_info'
        ],
        contextDescription: 'Vous assistez un résident étranger dans ses démarches administratives.'
    },
    company: {
        role: 'company',
        defaultTitle: 'Cher partenaire',
        appellationCourte: 'Partenaire',
        tone: 'professional',
        accessLevel: 'basic',
        availableTools: [
            'control_ui',
            'navigate_app',
            'request_service',
            'get_business_info'
        ],
        contextDescription: 'Vous assistez un représentant d\'entreprise dans ses démarches.'
    },
    association: {
        role: 'association',
        defaultTitle: 'Cher partenaire',
        appellationCourte: 'Partenaire',
        tone: 'professional',
        accessLevel: 'basic',
        availableTools: [
            'control_ui',
            'navigate_app',
            'request_service',
            'get_association_info'
        ],
        contextDescription: 'Vous assistez un représentant d\'association dans ses démarches.'
    },
    visitor: {
        role: 'visitor',
        defaultTitle: 'Bonjour',
        appellationCourte: 'Visiteur',
        tone: 'friendly',
        accessLevel: 'basic',
        availableTools: [
            'navigate_app',
            'get_service_info'
        ],
        contextDescription: 'Vous assistez un visiteur non identifié. Proposez une inscription après 3 questions.'
    },
    unknown: {
        role: 'unknown',
        defaultTitle: 'Bonjour',
        appellationCourte: 'Visiteur',
        tone: 'friendly',
        accessLevel: 'basic',
        availableTools: [
            'navigate_app',
            'get_service_info'
        ],
        contextDescription: 'Utilisateur non identifié. Proposez une connexion après 3 questions.'
    }
};

// Space contexts for mairie.ga
export interface SpaceContext {
    spaceName: string;
    displayName: string;
    description: string;
}

export const SPACE_CONTEXTS: Record<string, SpaceContext> = {
    DashboardMaire: {
        spaceName: 'DashboardMaire',
        displayName: 'Tableau de Bord du Maire',
        description: 'le tableau de bord du Maire'
    },
    EtatCivil: {
        spaceName: 'EtatCivil',
        displayName: 'État Civil',
        description: 'le service d\'état civil'
    },
    Correspondances: {
        spaceName: 'Correspondances',
        displayName: 'Correspondances',
        description: 'la gestion du courrier officiel'
    },
    Services: {
        spaceName: 'Services',
        displayName: 'Services Municipaux',
        description: 'les services municipaux'
    },
    Admin: {
        spaceName: 'Admin',
        displayName: 'Administration',
        description: 'l\'administration du système'
    }
};

/**
 * Check if a role has access to iAsted
 */
export function hasIAstedAccess(role: MunicipalAppRole | string | null): boolean {
    if (!role) return false;
    return IASTED_AUTHORIZED_ROLES.includes(role as MunicipalAppRole);
}

/**
 * Check if a role can use correspondence features
 */
export function canUseCorrespondance(role: MunicipalAppRole | string | null): boolean {
    if (!role) return false;
    return CORRESPONDANCE_AUTHORIZED_ROLES.includes(role as MunicipalAppRole);
}

/**
 * Get role context for a specific role
 */
export function getRoleContext(role: MunicipalAppRole | string | null): RoleContext {
    if (!role) return ROLE_CONTEXTS.unknown;
    return ROLE_CONTEXTS[role as MunicipalAppRole] || ROLE_CONTEXTS.unknown;
}

/**
 * Get the appropriate title for a role
 */
export function getRoleTitle(role: MunicipalAppRole | string | null, firstName?: string): string {
    const context = getRoleContext(role);
    if (!context) return 'Bonjour';

    // For citizens and lower roles, include firstName if available
    if (['citizen', 'citizen_other', 'foreigner', 'agent'].includes(context.role) && firstName) {
        return `Cher ${firstName}`;
    }

    return context.defaultTitle;
}
