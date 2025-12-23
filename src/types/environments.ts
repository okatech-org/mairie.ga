/**
 * Types pour l'architecture à 3 environnements utilisateurs
 * 
 * 1. BACK_OFFICE - Super Admin et collaborateurs
 * 2. MUNICIPAL_STAFF - Personnel des organismes municipaux
 * 3. PUBLIC_USER - Citoyens, étrangers, associations, entreprises
 */

// ============================================================
// ENUMS - Types d'environnement
// ============================================================

export enum UserEnvironment {
    BACK_OFFICE = 'BACK_OFFICE',
    MUNICIPAL_STAFF = 'MUNICIPAL_STAFF',
    PUBLIC_USER = 'PUBLIC_USER'
}

// Rôles Back Office
export enum BackOfficeRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TECH_ADMIN = 'TECH_ADMIN',
    SUPPORT_AGENT = 'SUPPORT_AGENT',
    AUDITOR = 'AUDITOR'
}

// Rôles Personnel Municipal
export enum MunicipalStaffRole {
    MAIRE = 'MAIRE',
    MAIRE_ADJOINT = 'MAIRE_ADJOINT',
    CONSEILLER_MUNICIPAL = 'CONSEILLER_MUNICIPAL',
    SECRETAIRE_GENERAL = 'SECRETAIRE_GENERAL',
    CHEF_SERVICE = 'CHEF_SERVICE',
    CHEF_BUREAU = 'CHEF_BUREAU',
    AGENT_MUNICIPAL = 'AGENT_MUNICIPAL',
    AGENT_ETAT_CIVIL = 'AGENT_ETAT_CIVIL',
    AGENT_TECHNIQUE = 'AGENT_TECHNIQUE',
    AGENT_ACCUEIL = 'AGENT_ACCUEIL',
    STAGIAIRE = 'STAGIAIRE'
}

// Rôles Usagers Publics
export enum PublicUserRole {
    CITOYEN = 'CITOYEN',
    CITOYEN_AUTRE = 'CITOYEN_AUTRE',
    ETRANGER_RESIDENT = 'ETRANGER_RESIDENT',
    ASSOCIATION = 'ASSOCIATION',
    ENTREPRISE = 'ENTREPRISE'
}

// ============================================================
// INTERFACES - Structures de données
// ============================================================

/**
 * Assignation d'environnement utilisateur
 */
export interface UserEnvironmentAssignment {
    id: string;
    userId: string;
    environment: UserEnvironment;
    organizationId?: string;

    // Un seul de ces rôles sera défini selon l'environnement
    backofficeRole?: BackOfficeRole;
    municipalRole?: MunicipalStaffRole;
    publicRole?: PublicUserRole;

    isActive: boolean;
    validFrom: string;
    validUntil?: string;

    createdAt: string;
    updatedAt: string;
    createdBy?: string;
}

/**
 * Contact iBoîte (carnet d'adresses)
 */
export interface IBoiteContact {
    id: string;
    ownerId: string;

    // Contact peut être un utilisateur ou un service
    contactUserId?: string;
    contactServiceId?: string;

    displayName: string;
    displayRole?: string;
    displayOrganization?: string;
    avatarUrl?: string;

    category: ContactCategory;
    isFavorite: boolean;

    lastContactAt?: string;
    contactCount: number;
    notes?: string;

    createdAt: string;
    updatedAt: string;
}

export type ContactCategory = 'RECENT' | 'FAVORITE' | 'COLLEAGUE' | 'SERVICE' | 'EXTERNAL' | 'GENERAL';

/**
 * Service dans l'annuaire iBoîte
 */
export interface IBoiteService {
    id: string;
    organizationId: string;

    serviceCode: string;
    serviceName: string;
    description?: string;

    responsibleUserId?: string;
    contactEmail?: string;  // Pour communication externe
    contactPhone?: string;

    parentServiceId?: string;

    isActive: boolean;

    createdAt: string;
    updatedAt: string;
}

/**
 * Résultat de recherche utilisateur iBoîte
 */
export interface IBoiteUserSearchResult {
    userId: string;
    displayName: string;
    roleLabel: string;
    organizationName?: string;
    environment: UserEnvironment;
    avatarUrl?: string;
}

/**
 * Résultat de recherche service iBoîte
 */
export interface IBoiteServiceSearchResult {
    serviceId: string;
    serviceCode: string;
    serviceName: string;
    organizationId: string;
    organizationName: string;
    responsibleName?: string;
}

/**
 * Membre d'un service
 */
export interface ServiceMember {
    id: string;
    serviceId: string;
    userId: string;
    memberRole: 'LEADER' | 'MEMBER' | 'BACKUP';
    canReceiveCorrespondence: boolean;
    canReceiveCalls: boolean;
    displayOrder: number;
    joinedAt: string;
    user?: {
        displayName: string;
        phone?: string;
        position?: string;
    };
}

/**
 * Entrée de l'annuaire des contacts
 */
export interface ContactDirectoryEntry {
    userId: string;
    profileId: string;
    displayName: string;
    firstName: string;
    lastName: string;
    phone?: string;
    position?: string;
    servicePhone?: string;
    isPublicContact: boolean;
    environment: UserEnvironment;
    role: string;
    organizationId?: string;
    organizationName?: string;
    organizationCity?: string;
    services?: Array<{
        id: string;
        name: string;
        role: string;
    }>;
}

// ============================================================
// IBOÎTE MESSAGING TYPES
// ============================================================

export type ConversationType = 'PRIVATE' | 'GROUP' | 'SERVICE' | 'BROADCAST' | 'EXTERNAL';
export type ParticipantRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'OBSERVER';
export type MessageContentType = 'TEXT' | 'HTML' | 'MARKDOWN' | 'SYSTEM';

/**
 * Conversation iBoîte
 */
export interface IBoiteConversation {
    id: string;
    conversationType: ConversationType;
    subject?: string;

    serviceId?: string;
    organizationId?: string;

    // Pour conversations externes
    externalEmail?: string;
    isExternal: boolean;

    // Dernier message (dénormalisé)
    lastMessageAt?: string;
    lastMessagePreview?: string;
    lastMessageSenderId?: string;

    isArchived: boolean;
    isResolved: boolean;

    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;

    // Relations (optionnel, peuplé par le service)
    participants?: IBoiteParticipant[];
    messages?: IBoiteMessage[];
    unreadCount?: number;

    // Champs calculés (peuplés par le service pour l'affichage)
    displayName?: string;
    avatarUrl?: string;
}

/**
 * Participant à une conversation
 */
export interface IBoiteParticipant {
    id: string;
    conversationId: string;
    userId: string;

    participantRole: ParticipantRole;

    lastReadAt?: string;
    unreadCount: number;

    isMuted: boolean;
    isPinned: boolean;

    joinedAt: string;
    leftAt?: string;
    isActive: boolean;

    // Relations (optionnel, peuplé par le service)
    user?: {
        displayName: string;
        avatarUrl?: string;
        role?: string;
    };
}

/**
 * Message iBoîte
 */
export interface IBoiteMessage {
    id: string;
    conversationId: string;
    senderId: string;

    content: string;
    contentType: MessageContentType;

    attachments: IBoiteAttachment[];

    replyToId?: string;
    mentions: string[];

    isOfficial: boolean;
    officialReference?: string;

    isEdited: boolean;
    editedAt?: string;
    isDeleted: boolean;
    deletedAt?: string;

    metadata?: Record<string, any>;
    createdAt: string;

    // Relations (optionnel, peuplé par le service)
    sender?: {
        displayName: string;
        avatarUrl?: string;
        role?: string;
    };
    replyTo?: IBoiteMessage;
    isRead?: boolean;

    // Champs calculés (peuplés par le service pour l'affichage)
    senderName?: string;
}

/**
 * Pièce jointe
 */
export interface IBoiteAttachment {
    id: string;
    name: string;
    type: 'IMAGE' | 'PDF' | 'DOCUMENT' | 'VIDEO' | 'AUDIO' | 'OTHER';
    url: string;
    size?: number;
    mimeType?: string;
    thumbnailUrl?: string;
}

/**
 * Correspondance externe (email)
 */
export interface IBoiteExternalCorrespondence {
    id: string;

    senderId: string;
    organizationId: string;

    recipientEmail: string;
    recipientName?: string;
    recipientOrganization?: string;

    subject: string;
    body: string;
    attachments: IBoiteAttachment[];

    referenceNumber?: string;
    linkedConversationId?: string;

    status: 'DRAFT' | 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
    sentAt?: string;
    deliveredAt?: string;
    errorMessage?: string;

    metadata?: Record<string, any>;
    createdAt: string;
    updatedAt: string;
}

/**
 * Type de destinataire global pour iBoîte
 */
export type RecipientType = 'USER' | 'ORGANIZATION' | 'SERVICE' | 'EXTERNAL';

/**
 * Destinataire global (utilisateur, organisation, service ou externe)
 */
export interface GlobalRecipient {
    recipientType: RecipientType;
    recipientId: string;
    displayName: string;
    subtitle?: string;
    email?: string;
    avatarUrl?: string;
    organizationId?: string;
    organizationName?: string;
}

/**
 * Organisation pour la liste des destinataires
 */
export interface OrganizationRecipient {
    id: string;
    name: string;
    city?: string;
    departement?: string;
    contactEmail?: string;
    logoUrl?: string;
    type?: string;
    maireName?: string;
}

/**
 * Service pour la liste des destinataires
 */
export interface ServiceRecipient {
    id: string;
    name: string;
    description?: string;
    category?: string;
    organizationId?: string;
    organizationName?: string;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Obtenir le label français d'un environnement
 */
export function getEnvironmentLabel(env: UserEnvironment): string {
    const labels: Record<UserEnvironment, string> = {
        [UserEnvironment.BACK_OFFICE]: 'Administration Système',
        [UserEnvironment.MUNICIPAL_STAFF]: 'Personnel Municipal',
        [UserEnvironment.PUBLIC_USER]: 'Usager'
    };
    return labels[env] || env;
}

/**
 * Obtenir le label français d'un rôle
 */
export function getRoleLabel(
    role: BackOfficeRole | MunicipalStaffRole | PublicUserRole | string
): string {
    const labels: Record<string, string> = {
        // Back Office
        [BackOfficeRole.SUPER_ADMIN]: 'Super Administrateur',
        [BackOfficeRole.TECH_ADMIN]: 'Administrateur Technique',
        [BackOfficeRole.SUPPORT_AGENT]: 'Agent Support',
        [BackOfficeRole.AUDITOR]: 'Auditeur',

        // Municipal Staff
        [MunicipalStaffRole.MAIRE]: 'Maire',
        [MunicipalStaffRole.MAIRE_ADJOINT]: 'Adjoint au Maire',
        [MunicipalStaffRole.CONSEILLER_MUNICIPAL]: 'Conseiller Municipal',
        [MunicipalStaffRole.SECRETAIRE_GENERAL]: 'Secrétaire Général',
        [MunicipalStaffRole.CHEF_SERVICE]: 'Chef de Service',
        [MunicipalStaffRole.CHEF_BUREAU]: 'Chef de Bureau',
        [MunicipalStaffRole.AGENT_MUNICIPAL]: 'Agent Municipal',
        [MunicipalStaffRole.AGENT_ETAT_CIVIL]: 'Agent État Civil',
        [MunicipalStaffRole.AGENT_TECHNIQUE]: 'Agent Technique',
        [MunicipalStaffRole.AGENT_ACCUEIL]: 'Agent d\'Accueil',
        [MunicipalStaffRole.STAGIAIRE]: 'Stagiaire',

        // Public Users
        [PublicUserRole.CITOYEN]: 'Citoyen',
        [PublicUserRole.CITOYEN_AUTRE]: 'Citoyen (Autre Commune)',
        [PublicUserRole.ETRANGER_RESIDENT]: 'Résident Étranger',
        [PublicUserRole.ASSOCIATION]: 'Association',
        [PublicUserRole.ENTREPRISE]: 'Entreprise'
    };
    return labels[role] || role;
}

/**
 * Vérifier si un rôle appartient au Back Office
 */
export function isBackOfficeRole(role: string): role is BackOfficeRole {
    return Object.values(BackOfficeRole).includes(role as BackOfficeRole);
}

/**
 * Vérifier si un rôle appartient au Personnel Municipal
 */
export function isMunicipalStaffRole(role: string): role is MunicipalStaffRole {
    return Object.values(MunicipalStaffRole).includes(role as MunicipalStaffRole);
}

/**
 * Vérifier si un rôle appartient aux Usagers Publics
 */
export function isPublicUserRole(role: string): role is PublicUserRole {
    return Object.values(PublicUserRole).includes(role as PublicUserRole);
}

/**
 * Obtenir l'environnement à partir d'un rôle
 */
export function getEnvironmentFromRole(role: string): UserEnvironment | null {
    if (isBackOfficeRole(role)) return UserEnvironment.BACK_OFFICE;
    if (isMunicipalStaffRole(role)) return UserEnvironment.MUNICIPAL_STAFF;
    if (isPublicUserRole(role)) return UserEnvironment.PUBLIC_USER;
    return null;
}

/**
 * Permissions par environnement
 */
export interface EnvironmentPermissions {
    canViewAllOrganizations: boolean;
    canManageUsers: boolean;
    canSendExternalEmail: boolean;
    canViewAuditLogs: boolean;
    canAccessDashboard: 'super-admin' | 'maire' | 'agent' | 'citizen';
}

export function getEnvironmentPermissions(env: UserEnvironment, role?: string): EnvironmentPermissions {
    switch (env) {
        case UserEnvironment.BACK_OFFICE:
            return {
                canViewAllOrganizations: true,
                canManageUsers: role === BackOfficeRole.SUPER_ADMIN,
                canSendExternalEmail: true,
                canViewAuditLogs: true,
                canAccessDashboard: 'super-admin'
            };
        case UserEnvironment.MUNICIPAL_STAFF:
            const isLeadership = [
                MunicipalStaffRole.MAIRE,
                MunicipalStaffRole.MAIRE_ADJOINT,
                MunicipalStaffRole.SECRETAIRE_GENERAL
            ].includes(role as MunicipalStaffRole);
            return {
                canViewAllOrganizations: false,
                canManageUsers: isLeadership,
                canSendExternalEmail: true,
                canViewAuditLogs: isLeadership,
                canAccessDashboard: isLeadership ? 'maire' : 'agent'
            };
        case UserEnvironment.PUBLIC_USER:
        default:
            return {
                canViewAllOrganizations: false,
                canManageUsers: false,
                canSendExternalEmail: false,
                canViewAuditLogs: false,
                canAccessDashboard: 'citizen'
            };
    }
}
