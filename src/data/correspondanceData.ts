/**
 * Données de référence pour les correspondances administratives
 * Utilisées pour l'autocomplétion et la sélection intelligente
 */

// Types de correspondances administratives courantes
export const CORRESPONDANCE_TYPES = [
    // Urbanisme et Construction
    { id: 'permis-construire', name: 'Demande de permis de construire', category: 'Urbanisme' },
    { id: 'permis-demolir', name: 'Demande de permis de démolir', category: 'Urbanisme' },
    { id: 'certificat-urbanisme', name: 'Certificat d\'urbanisme', category: 'Urbanisme' },
    { id: 'autorisation-travaux', name: 'Autorisation de travaux', category: 'Urbanisme' },
    { id: 'declaration-prealable', name: 'Déclaration préalable de travaux', category: 'Urbanisme' },

    // Délibérations et Conseil
    { id: 'deliberation', name: 'Délibération du Conseil Municipal', category: 'Gouvernance' },
    { id: 'pv-conseil', name: 'Procès-verbal de séance du Conseil', category: 'Gouvernance' },
    { id: 'convocation-conseil', name: 'Convocation au Conseil Municipal', category: 'Gouvernance' },
    { id: 'rapport-commission', name: 'Rapport de commission', category: 'Gouvernance' },

    // Budget et Finances
    { id: 'budget-primitif', name: 'Budget primitif', category: 'Finances' },
    { id: 'budget-supplementaire', name: 'Budget supplémentaire', category: 'Finances' },
    { id: 'compte-administratif', name: 'Compte administratif', category: 'Finances' },
    { id: 'annexe-budgetaire', name: 'Annexe budgétaire', category: 'Finances' },
    { id: 'demande-subvention', name: 'Demande de subvention', category: 'Finances' },

    // État Civil
    { id: 'acte-naissance', name: 'Acte de naissance', category: 'État Civil' },
    { id: 'acte-mariage', name: 'Acte de mariage', category: 'État Civil' },
    { id: 'acte-deces', name: 'Acte de décès', category: 'État Civil' },
    { id: 'livret-famille', name: 'Livret de famille', category: 'État Civil' },
    { id: 'certificat-residence', name: 'Certificat de résidence', category: 'État Civil' },

    // Conventions et Contrats
    { id: 'convention-partenariat', name: 'Convention de partenariat', category: 'Conventions' },
    { id: 'contrat-delegation', name: 'Contrat de délégation de service', category: 'Conventions' },
    { id: 'marche-public', name: 'Marché public', category: 'Conventions' },
    { id: 'avenant-contrat', name: 'Avenant au contrat', category: 'Conventions' },

    // Courriers officiels
    { id: 'courrier-officiel', name: 'Courrier officiel', category: 'Courrier' },
    { id: 'reponse-requete', name: 'Réponse à une requête', category: 'Courrier' },
    { id: 'notification', name: 'Notification officielle', category: 'Courrier' },
    { id: 'invitation', name: 'Invitation officielle', category: 'Courrier' },
    { id: 'attestation', name: 'Attestation', category: 'Courrier' },

    // Rapports
    { id: 'rapport-activite', name: 'Rapport d\'activité', category: 'Rapports' },
    { id: 'rapport-trimestriel', name: 'Rapport trimestriel', category: 'Rapports' },
    { id: 'rapport-annuel', name: 'Rapport annuel', category: 'Rapports' },
    { id: 'synthese', name: 'Synthèse', category: 'Rapports' },

    // Arrêtés
    { id: 'arrete-municipal', name: 'Arrêté municipal', category: 'Arrêtés' },
    { id: 'arrete-circulation', name: 'Arrêté de circulation', category: 'Arrêtés' },
    { id: 'arrete-police', name: 'Arrêté de police', category: 'Arrêtés' },
];

// Organisations destinataires avec leurs contacts
export interface OrganizationContact {
    id: string;
    name: string;
    role: string;
    email?: string;
    phone?: string;
}

export interface Organization {
    id: string;
    name: string;
    type: 'prefecture' | 'ministry' | 'municipality' | 'public_service' | 'enterprise' | 'association' | 'other';
    category: string;
    address?: string;
    contacts: OrganizationContact[];
}

export const ORGANIZATIONS: Organization[] = [
    // Préfectures
    {
        id: 'prefecture-estuaire',
        name: 'Préfecture de l\'Estuaire',
        type: 'prefecture',
        category: 'Préfectures',
        address: 'Boulevard de l\'Indépendance, Libreville',
        contacts: [
            { id: 'prefet-estuaire', name: 'M. le Préfet', role: 'Préfet de l\'Estuaire', email: 'prefet@estuaire.ga' },
            { id: 'sg-pref-estuaire', name: 'Secrétaire Général', role: 'Secrétaire Général de la Préfecture' },
            { id: 'dir-cab-pref', name: 'Directeur de Cabinet', role: 'Directeur de Cabinet du Préfet' },
        ]
    },
    {
        id: 'prefecture-ogooue',
        name: 'Préfecture de l\'Ogooué-Maritime',
        type: 'prefecture',
        category: 'Préfectures',
        address: 'Port-Gentil',
        contacts: [
            { id: 'prefet-ogooue', name: 'M. le Préfet', role: 'Préfet de l\'Ogooué-Maritime' },
            { id: 'sg-pref-ogooue', name: 'Secrétaire Général', role: 'Secrétaire Général de la Préfecture' },
        ]
    },
    {
        id: 'prefecture-haut-ogooue',
        name: 'Préfecture du Haut-Ogooué',
        type: 'prefecture',
        category: 'Préfectures',
        address: 'Franceville',
        contacts: [
            { id: 'prefet-haut-ogooue', name: 'M. le Préfet', role: 'Préfet du Haut-Ogooué' },
        ]
    },

    // Ministères
    {
        id: 'ministere-interieur',
        name: 'Ministère de l\'Intérieur',
        type: 'ministry',
        category: 'Ministères',
        address: 'Libreville',
        contacts: [
            { id: 'ministre-interieur', name: 'M. le Ministre', role: 'Ministre de l\'Intérieur' },
            { id: 'sg-min-interieur', name: 'Secrétaire Général', role: 'Secrétaire Général du Ministère' },
            { id: 'dgcl', name: 'DGCL', role: 'Direction Générale des Collectivités Locales' },
        ]
    },
    {
        id: 'ministere-budget',
        name: 'Ministère du Budget',
        type: 'ministry',
        category: 'Ministères',
        address: 'Libreville',
        contacts: [
            { id: 'ministre-budget', name: 'M. le Ministre', role: 'Ministre du Budget' },
            { id: 'dgi', name: 'Direction Générale des Impôts', role: 'DGI' },
            { id: 'tresor', name: 'Trésor Public', role: 'Direction du Trésor' },
        ]
    },
    {
        id: 'ministere-urbanisme',
        name: 'Ministère de l\'Urbanisme',
        type: 'ministry',
        category: 'Ministères',
        contacts: [
            { id: 'ministre-urbanisme', name: 'M. le Ministre', role: 'Ministre de l\'Urbanisme' },
            { id: 'dir-urbanisme', name: 'Direction de l\'Urbanisme', role: 'Direction Centrale' },
        ]
    },
    {
        id: 'ministere-education',
        name: 'Ministère de l\'Éducation Nationale',
        type: 'ministry',
        category: 'Ministères',
        contacts: [
            { id: 'ministre-education', name: 'M. le Ministre', role: 'Ministre de l\'Éducation' },
            { id: 'inspection-academique', name: 'Inspection Académique', role: 'Inspecteur d\'Académie' },
        ]
    },

    // Mairies voisines
    {
        id: 'mairie-port-gentil',
        name: 'Mairie de Port-Gentil',
        type: 'municipality',
        category: 'Communes',
        contacts: [
            { id: 'maire-pg', name: 'M. le Maire', role: 'Maire de Port-Gentil' },
            { id: 'sg-mairie-pg', name: 'Secrétaire Général', role: 'SG Mairie Port-Gentil' },
            { id: 'daf-pg', name: 'DAF', role: 'Directeur Administratif et Financier' },
        ]
    },
    {
        id: 'mairie-franceville',
        name: 'Mairie de Franceville',
        type: 'municipality',
        category: 'Communes',
        contacts: [
            { id: 'maire-fv', name: 'M. le Maire', role: 'Maire de Franceville' },
            { id: 'sg-mairie-fv', name: 'Secrétaire Général', role: 'SG Mairie Franceville' },
        ]
    },
    {
        id: 'mairie-oyem',
        name: 'Mairie d\'Oyem',
        type: 'municipality',
        category: 'Communes',
        contacts: [
            { id: 'maire-oyem', name: 'M. le Maire', role: 'Maire d\'Oyem' },
        ]
    },
    {
        id: 'mairie-lambarene',
        name: 'Mairie de Lambaréné',
        type: 'municipality',
        category: 'Communes',
        contacts: [
            { id: 'maire-lambarene', name: 'M. le Maire', role: 'Maire de Lambaréné' },
        ]
    },
    {
        id: 'communaute-urbaine',
        name: 'Communauté Urbaine du Grand Libreville',
        type: 'municipality',
        category: 'Intercommunalité',
        contacts: [
            { id: 'president-cu', name: 'M. le Président', role: 'Président de la Communauté Urbaine' },
            { id: 'dg-cu', name: 'Directeur Général', role: 'DG des Services' },
        ]
    },

    // Services publics
    {
        id: 'seeg',
        name: 'SEEG (Société d\'Énergie et d\'Eau du Gabon)',
        type: 'public_service',
        category: 'Services Publics',
        contacts: [
            { id: 'dg-seeg', name: 'Directeur Général', role: 'DG SEEG' },
            { id: 'service-client-seeg', name: 'Service Client', role: 'Direction Clientèle' },
        ]
    },
    {
        id: 'cnss',
        name: 'CNSS (Caisse Nationale de Sécurité Sociale)',
        type: 'public_service',
        category: 'Services Publics',
        contacts: [
            { id: 'dg-cnss', name: 'Directeur Général', role: 'DG CNSS' },
        ]
    },
    {
        id: 'tribunal-libreville',
        name: 'Tribunal de Première Instance de Libreville',
        type: 'public_service',
        category: 'Justice',
        contacts: [
            { id: 'president-tribunal', name: 'M. le Président', role: 'Président du Tribunal' },
            { id: 'procureur', name: 'M. le Procureur', role: 'Procureur de la République' },
        ]
    },

    // Entreprises partenaires
    {
        id: 'comilog',
        name: 'COMILOG',
        type: 'enterprise',
        category: 'Entreprises',
        contacts: [
            { id: 'dg-comilog', name: 'Directeur Général', role: 'DG COMILOG' },
            { id: 'drh-comilog', name: 'DRH', role: 'Directeur des Ressources Humaines' },
        ]
    },
    {
        id: 'olam-gabon',
        name: 'OLAM Gabon',
        type: 'enterprise',
        category: 'Entreprises',
        contacts: [
            { id: 'dg-olam', name: 'Directeur Général', role: 'DG OLAM Gabon' },
        ]
    },
    {
        id: 'total-gabon',
        name: 'TotalEnergies Gabon',
        type: 'enterprise',
        category: 'Entreprises',
        contacts: [
            { id: 'dg-total', name: 'Directeur Général', role: 'DG TotalEnergies Gabon' },
            { id: 'dir-comm-total', name: 'Direction Communication', role: 'Directeur Communication' },
        ]
    },

    // Associations
    {
        id: 'association-maires',
        name: 'Association des Maires du Gabon',
        type: 'association',
        category: 'Associations',
        contacts: [
            { id: 'president-amg', name: 'M. le Président', role: 'Président de l\'AMG' },
            { id: 'sg-amg', name: 'Secrétaire Général', role: 'SG de l\'AMG' },
        ]
    },
    {
        id: 'ong-locale',
        name: 'ONG Partenaires',
        type: 'association',
        category: 'Associations',
        contacts: [
            { id: 'coordinateur-ong', name: 'Coordinateur', role: 'Coordinateur ONG' },
        ]
    },
];

// Fonctions utilitaires

export function searchCorrespondanceTypes(query: string): typeof CORRESPONDANCE_TYPES {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return CORRESPONDANCE_TYPES.slice(0, 10);

    return CORRESPONDANCE_TYPES.filter(type =>
        type.name.toLowerCase().includes(normalizedQuery) ||
        type.category.toLowerCase().includes(normalizedQuery)
    );
}

export function searchOrganizations(query: string): Organization[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return ORGANIZATIONS;

    return ORGANIZATIONS.filter(org =>
        org.name.toLowerCase().includes(normalizedQuery) ||
        org.category.toLowerCase().includes(normalizedQuery)
    );
}

export function getOrganizationContacts(organizationId: string): OrganizationContact[] {
    const org = ORGANIZATIONS.find(o => o.id === organizationId);
    return org?.contacts || [];
}

export function getOrganizationById(id: string): Organization | undefined {
    return ORGANIZATIONS.find(o => o.id === id);
}

export function getOrganizationCategories(): string[] {
    const categories = new Set(ORGANIZATIONS.map(o => o.category));
    return Array.from(categories);
}

export function getCorrespondanceCategories(): string[] {
    const categories = new Set(CORRESPONDANCE_TYPES.map(t => t.category));
    return Array.from(categories);
}
