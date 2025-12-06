export enum SecurityPermission {
    // Gestion Système
    VIEW_DASHBOARD = 'VIEW_DASHBOARD',
    MANAGE_SETTINGS = 'MANAGE_SETTINGS',
    VIEW_LOGS = 'VIEW_LOGS',
    MANAGE_SECURITY = 'MANAGE_SECURITY',

    // Gestion Organisation
    VIEW_ORGANIZATIONS = 'VIEW_ORGANIZATIONS',
    MANAGE_ORGANIZATIONS = 'MANAGE_ORGANIZATIONS',
    CREATE_ORGANIZATIONS = 'CREATE_ORGANIZATIONS',

    // Gestion Utilisateurs & RH
    VIEW_USERS = 'VIEW_USERS',
    MANAGE_USERS = 'MANAGE_USERS',
    MANAGE_ROLES = 'MANAGE_ROLES',

    // Opérations & Services
    VIEW_SERVICES = 'VIEW_SERVICES',
    MANAGE_SERVICES = 'MANAGE_SERVICES',
    PROCESS_REQUESTS = 'PROCESS_REQUESTS',
    VALIDATE_DOCUMENTS = 'VALIDATE_DOCUMENTS',

    // Intelligence Artificielle
    VIEW_AI_CONFIG = 'VIEW_AI_CONFIG',
    MANAGE_AI_CONFIG = 'MANAGE_AI_CONFIG',
    MANAGE_KNOWLEDGE_BASE = 'MANAGE_KNOWLEDGE_BASE',
}

export type RoleType = 'super_admin' | 'admin_mairie' | 'agent' | 'user';

export const ROLE_LABELS: Record<RoleType, string> = {
    super_admin: 'Super Administrateur',
    admin_mairie: 'Administrateur Mairie',
    agent: 'Agent Municipal',
    user: 'Usager / Citoyen',
};

export const ROLE_PERMISSIONS: Record<RoleType, SecurityPermission[]> = {
    super_admin: Object.values(SecurityPermission), // Accès total

    admin_mairie: [
        SecurityPermission.VIEW_DASHBOARD,
        SecurityPermission.MANAGE_ORGANIZATIONS, // Sa propre organisation
        SecurityPermission.VIEW_USERS,
        SecurityPermission.MANAGE_USERS,
        SecurityPermission.VIEW_SERVICES,
        SecurityPermission.MANAGE_SERVICES,
        SecurityPermission.PROCESS_REQUESTS,
        SecurityPermission.VALIDATE_DOCUMENTS,
    ],

    agent: [
        SecurityPermission.VIEW_DASHBOARD,
        SecurityPermission.VIEW_USERS, // Lecture seule
        SecurityPermission.VIEW_SERVICES,
        SecurityPermission.PROCESS_REQUESTS,
        SecurityPermission.VALIDATE_DOCUMENTS,
    ],

    user: [
        // Permissions limitées au portail citoyen (gérées séparément en général)
    ]
};

export function hasPermission(role: RoleType | string, permission: SecurityPermission): boolean {
    // Mapping des rôles existants vers notre nouveau système si nécessaire
    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) return false;

    return ROLE_PERMISSIONS[normalizedRole]?.includes(permission) || false;
}

function normalizeRole(role: string): RoleType | null {
    if (role === 'ADMIN') return 'super_admin';
    if (['MAIRE', 'MAIRE_ADJOINT', 'SECRETAIRE_GENERAL'].includes(role)) return 'admin_mairie';
    if (role.includes('AGENT') || role.includes('CHEF_SERVICE') || role === 'OFFICIER_ETAT_CIVIL') return 'agent';
    if (['CITIZEN', 'FOREIGNER', 'CITOYEN'].includes(role)) return 'user';
    return null;
}
