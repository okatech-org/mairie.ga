import { Company, CompanyType, ActivitySector, CompanyRole } from '@/types/company';

export const MOCK_COMPANIES: Company[] = [
    {
        id: 'comp-1',
        name: 'Tech Solutions Gabon',
        legalName: 'Tech Solutions Gabon SARL',
        companyType: CompanyType.SARL,
        activitySector: ActivitySector.TECHNOLOGY,
        siret: '12345678900012',
        status: 'APPROVED',
        email: 'contact@techsolutions.ga',
        phone: '+33 1 23 45 67 89',
        website: 'https://techsolutions.ga',
        description: 'Entreprise spécialisée dans le développement de solutions numériques pour l\'Afrique.',
        shortDescription: 'Solutions numériques innovantes',
        address: {
            street: '12 Avenue des Champs-Élysées',
            city: 'Paris',
            postalCode: '75008',
            country: 'France'
        },
        ownerId: 'user-1', // Assuming this ID exists in mock-users
        ownerRole: CompanyRole.CEO,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        validatedAt: '2024-01-16T14:30:00Z',
        validatedById: 'admin-system'
    },
    {
        id: 'comp-2',
        name: 'Gabon Export',
        companyType: CompanyType.SA,
        activitySector: ActivitySector.COMMERCE,
        status: 'PENDING',
        email: 'info@gabonexport.com',
        phone: '+33 6 98 76 54 32',
        description: 'Exportation de produits artisanaux gabonais vers l\'Europe.',
        shortDescription: 'Export artisanat gabonais',
        address: {
            street: '45 Rue de la République',
            city: 'Lyon',
            postalCode: '69002',
            country: 'France'
        },
        ownerId: 'user-2',
        ownerRole: CompanyRole.DIRECTOR,
        createdAt: '2024-03-20T09:15:00Z',
        updatedAt: '2024-03-20T09:15:00Z'
    }
];
