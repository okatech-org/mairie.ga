import { DemoUser } from './roles';
import { AddressData, EntityStatus } from './company';

export enum AssociationRole {
    PRESIDENT = 'PRESIDENT',
    MEMBER = 'MEMBER',
    VICE_PRESIDENT = 'VICE_PRESIDENT',
    SECRETARY = 'SECRETARY',
    TREASURER = 'TREASURER'
}

export enum AssociationType {
    CULTURAL = 'CULTURAL',
    SPORTS = 'SPORTS',
    RELIGIOUS = 'RELIGIOUS',
    PROFESSIONAL = 'PROFESSIONAL',
    SOLIDARITY = 'SOLIDARITY',
    EDUCATION = 'EDUCATION',
    YOUTH = 'YOUTH',
    WOMEN = 'WOMEN',
    STUDENT = 'STUDENT',
    OTHER = 'OTHER'
}

export interface Association {
    id: string;

    // Informations de base
    name: string;
    legalName?: string;
    associationType: AssociationType;
    registrationNumber?: string;
    creationDate?: string; // ISO Date

    // Statut et validation
    status: EntityStatus;
    validatedAt?: string;
    validatedById?: string;
    rejectionReason?: string;

    // Contact
    email: string;
    phone: string;
    website?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;

    // Description
    description: string;
    shortDescription?: string;
    objectives?: string;

    // Informations complémentaires
    memberCount?: number;
    foundingYear?: number;

    // Médias
    logoUrl?: string;

    // Adresse
    address: AddressData;

    // Relation avec l'utilisateur créateur
    ownerId: string;
    ownerRole: AssociationRole;

    // Métadonnées
    createdAt: string;
    updatedAt: string;
}

export interface AssociationWithDetails extends Association {
    owner?: DemoUser;
    validatedBy?: DemoUser;
}
