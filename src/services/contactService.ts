/**
 * Service de gestion des contacts pour les collaborateurs municipaux
 * 
 * Catégories de contacts :
 * - Citoyens (résidents ayant fait des démarches)
 * - Entreprises (enregistrées dans la commune)
 * - Associations (déclarées dans la commune)
 * - Étrangers résidents (ayant effectué des démarches)
 * - Collaborateurs internes (agents de la mairie)
 * - Inter-municipalité (autres mairies)
 * - Administrations (Préfecture, Ministères, etc.)
 */

import { supabase } from '@/integrations/supabase/client';

// Types de contacts
export type ContactCategory =
    | 'citizen'
    | 'enterprise'
    | 'association'
    | 'foreigner'
    | 'collaborator'
    | 'inter_municipality'
    | 'administration';

export interface Contact {
    id: string;
    category: ContactCategory;
    name: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    organization?: string;
    position?: string;
    department?: string;
    municipality?: string;
    address?: string;
    avatar?: string;
    isOnline?: boolean;
    lastSeen?: string;
    tags?: string[];
    metadata?: Record<string, any>;
}

export interface ContactGroup {
    category: ContactCategory;
    label: string;
    icon: string;
    contacts: Contact[];
    count: number;
}

// Labels et icônes pour chaque catégorie
const CATEGORY_CONFIG: Record<ContactCategory, { label: string; icon: string }> = {
    citizen: { label: 'Citoyens', icon: '👤' },
    enterprise: { label: 'Entreprises', icon: '🏢' },
    association: { label: 'Associations', icon: '🤝' },
    foreigner: { label: 'Étrangers Résidents', icon: '🌍' },
    collaborator: { label: 'Collaborateurs', icon: '👔' },
    inter_municipality: { label: 'Inter-Municipalité', icon: '🏛️' },
    administration: { label: 'Administrations', icon: '🏛️' },
};

// ============= DONNÉES MOCK POUR LE MODE DÉMO =============

const MOCK_CITIZENS: Contact[] = [
    {
        id: 'cit-001',
        category: 'citizen',
        name: 'Jean-Pierre MBA',
        firstName: 'Jean-Pierre',
        lastName: 'MBA',
        email: 'jp.mba@mail.ga',
        phone: '+241 77 12 34 56',
        address: 'Quartier Louis, Libreville',
        tags: ['Acte de naissance', 'Certificat de résidence'],
        isOnline: true,
    },
    {
        id: 'cit-002',
        category: 'citizen',
        name: 'Marie NDONG ESSONO',
        firstName: 'Marie',
        lastName: 'NDONG ESSONO',
        email: 'marie.ndong@mail.ga',
        phone: '+241 66 98 76 54',
        address: 'Quartier Nzeng-Ayong, Libreville',
        tags: ['Permis de construire'],
        isOnline: false,
    },
    {
        id: 'cit-003',
        category: 'citizen',
        name: 'Paul ONDO MBIA',
        firstName: 'Paul',
        lastName: 'ONDO MBIA',
        email: 'paul.ondo@mail.ga',
        phone: '+241 74 55 66 77',
        address: 'Quartier Akebe, Libreville',
        tags: ['Mariage', 'Livret de famille'],
        isOnline: true,
    },
    {
        id: 'cit-004',
        category: 'citizen',
        name: 'Sophie NGUEMA',
        firstName: 'Sophie',
        lastName: 'NGUEMA',
        email: 'sophie.nguema@mail.ga',
        phone: '+241 62 33 44 55',
        address: 'Quartier Glass, Libreville',
        tags: ['Déclaration de naissance'],
        isOnline: false,
    },
];

const MOCK_ENTERPRISES: Contact[] = [
    {
        id: 'ent-001',
        category: 'enterprise',
        name: 'COMILOG GABON',
        organization: 'COMILOG SA',
        email: 'contact@comilog.ga',
        phone: '+241 44 76 25 00',
        address: 'Boulevard Triomphal, Libreville',
        position: 'Direction Générale',
        tags: ['Patente', 'Fiscalité'],
    },
    {
        id: 'ent-002',
        category: 'enterprise',
        name: 'OLAM GABON',
        organization: 'OLAM International',
        email: 'gabonoffice@olam.ga',
        phone: '+241 44 74 50 00',
        address: 'Zone Économique Spéciale, Nkok',
        tags: ['Autorisation', 'Commerce'],
    },
    {
        id: 'ent-003',
        category: 'enterprise',
        name: 'Boulangerie Le Bon Pain',
        organization: 'Le Bon Pain SARL',
        email: 'lebonpain@mail.ga',
        phone: '+241 66 11 22 33',
        address: 'Mont-Bouët, Libreville',
        tags: ['Commerce', 'Hygiène'],
    },
    {
        id: 'ent-004',
        category: 'enterprise',
        name: 'Transport Express Gabon',
        organization: 'TEG SA',
        email: 'info@teg.ga',
        phone: '+241 77 88 99 00',
        address: 'PK8, Libreville',
        tags: ['Transport', 'Licence'],
    },
];

const MOCK_ASSOCIATIONS: Contact[] = [
    {
        id: 'asso-001',
        category: 'association',
        name: 'Association des Jeunes de Libreville',
        organization: 'AJL',
        email: 'ajl@associations.ga',
        phone: '+241 77 22 33 44',
        address: 'Centre Culturel Français, Libreville',
        tags: ['Jeunesse', 'Culture'],
    },
    {
        id: 'asso-002',
        category: 'association',
        name: 'Femmes Actives du Gabon',
        organization: 'FAG',
        email: 'fag@associations.ga',
        phone: '+241 66 55 44 33',
        address: 'Quartier Louis, Libreville',
        tags: ['Femmes', 'Entrepreneuriat'],
    },
    {
        id: 'asso-003',
        category: 'association',
        name: 'Club Sportif de Libreville',
        organization: 'CSL',
        email: 'csl@sport.ga',
        phone: '+241 74 11 22 33',
        address: 'Stade Omar Bongo, Libreville',
        tags: ['Sport', 'Football'],
    },
];

const MOCK_FOREIGNERS: Contact[] = [
    {
        id: 'for-001',
        category: 'foreigner',
        name: 'Ahmed DIALLO',
        firstName: 'Ahmed',
        lastName: 'DIALLO',
        email: 'a.diallo@mail.sn',
        phone: '+241 77 99 88 77',
        address: 'Quartier Nzeng-Ayong, Libreville',
        tags: ['Carte de séjour', 'Sénégalais'],
        metadata: { nationality: 'Sénégalaise' },
    },
    {
        id: 'for-002',
        category: 'foreigner',
        name: 'Li WEI',
        firstName: 'Wei',
        lastName: 'LI',
        email: 'li.wei@mail.cn',
        phone: '+241 66 77 88 99',
        address: 'Zone Économique, Nkok',
        tags: ['Visa travail', 'Chinois'],
        metadata: { nationality: 'Chinoise' },
    },
    {
        id: 'for-003',
        category: 'foreigner',
        name: 'Jean-Paul DUPONT',
        firstName: 'Jean-Paul',
        lastName: 'DUPONT',
        email: 'jp.dupont@mail.fr',
        phone: '+241 74 55 66 77',
        address: 'Quartier Glass, Libreville',
        tags: ['Résident', 'Français'],
        metadata: { nationality: 'Française' },
    },
];

const MOCK_COLLABORATORS: Contact[] = [
    {
        id: 'collab-001',
        category: 'collaborator',
        name: 'M. le Maire',
        position: 'Maire',
        department: 'Cabinet du Maire',
        email: 'maire@mairie-libreville.ga',
        phone: '+241 44 72 11 00',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: true,
    },
    {
        id: 'collab-002',
        category: 'collaborator',
        name: 'Mme OBAME',
        firstName: 'Christine',
        lastName: 'OBAME',
        position: '1ère Adjointe au Maire',
        department: 'Affaires Sociales',
        email: 'c.obame@mairie-libreville.ga',
        phone: '+241 44 72 11 01',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: true,
    },
    {
        id: 'collab-003',
        category: 'collaborator',
        name: 'M. NTOUTOUME',
        firstName: 'Jean',
        lastName: 'NTOUTOUME',
        position: 'Secrétaire Général',
        department: 'Secrétariat Général',
        email: 'sg@mairie-libreville.ga',
        phone: '+241 44 72 11 02',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: false,
    },
    {
        id: 'collab-004',
        category: 'collaborator',
        name: 'Mme ELLA',
        firstName: 'Pauline',
        lastName: 'ELLA',
        position: 'Chef de Service État Civil',
        department: 'État Civil',
        email: 'etat-civil@mairie-libreville.ga',
        phone: '+241 44 72 11 03',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: true,
    },
    {
        id: 'collab-005',
        category: 'collaborator',
        name: 'M. MOUSSAVOU',
        firstName: 'Patrick',
        lastName: 'MOUSSAVOU',
        position: 'Chef de Service Urbanisme',
        department: 'Urbanisme',
        email: 'urbanisme@mairie-libreville.ga',
        phone: '+241 44 72 11 04',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: false,
    },
    {
        id: 'collab-006',
        category: 'collaborator',
        name: 'Mme BEKALE',
        firstName: 'Sylvie',
        lastName: 'BEKALE',
        position: 'Chef de Service Fiscalité',
        department: 'Fiscalité Locale',
        email: 'fiscalite@mairie-libreville.ga',
        phone: '+241 44 72 11 05',
        municipality: 'Mairie Centrale de Libreville',
        isOnline: true,
    },
];

const MOCK_INTER_MUNICIPALITY: Contact[] = [
    {
        id: 'mun-001',
        category: 'inter_municipality',
        name: 'Mairie de Port-Gentil',
        organization: 'Commune de Port-Gentil',
        position: 'Cabinet du Maire',
        email: 'cabinet@mairie-port-gentil.ga',
        phone: '+241 44 55 10 00',
        municipality: 'Port-Gentil',
        address: 'Ogooué-Maritime',
    },
    {
        id: 'mun-002',
        category: 'inter_municipality',
        name: 'Mairie de Franceville',
        organization: 'Commune de Franceville',
        position: 'Cabinet du Maire',
        email: 'cabinet@mairie-franceville.ga',
        phone: '+241 44 67 10 00',
        municipality: 'Franceville',
        address: 'Haut-Ogooué',
    },
    {
        id: 'mun-003',
        category: 'inter_municipality',
        name: 'Mairie d\'Oyem',
        organization: 'Commune d\'Oyem',
        position: 'Cabinet du Maire',
        email: 'cabinet@mairie-oyem.ga',
        phone: '+241 44 86 10 00',
        municipality: 'Oyem',
        address: 'Woleu-Ntem',
    },
    {
        id: 'mun-004',
        category: 'inter_municipality',
        name: 'Mairie de Lambaréné',
        organization: 'Commune de Lambaréné',
        position: 'Cabinet du Maire',
        email: 'cabinet@mairie-lambarene.ga',
        phone: '+241 44 58 10 00',
        municipality: 'Lambaréné',
        address: 'Moyen-Ogooué',
    },
];

const MOCK_ADMINISTRATIONS: Contact[] = [
    {
        id: 'admin-001',
        category: 'administration',
        name: 'Préfecture de l\'Estuaire',
        organization: 'Préfecture',
        position: 'Secrétariat Général',
        email: 'sg@prefecture-estuaire.ga',
        phone: '+241 44 72 00 01',
        address: 'Libreville',
    },
    {
        id: 'admin-002',
        category: 'administration',
        name: 'Ministère de l\'Intérieur',
        organization: 'Ministère de l\'Intérieur',
        position: 'Direction des Collectivités',
        email: 'dcl@interieur.gouv.ga',
        phone: '+241 44 76 00 00',
        address: 'Libreville',
    },
    {
        id: 'admin-003',
        category: 'administration',
        name: 'Direction Générale des Impôts',
        organization: 'DGI',
        position: 'Direction de la Fiscalité Locale',
        email: 'fiscalite-locale@dgi.gouv.ga',
        phone: '+241 44 79 10 00',
        address: 'Libreville',
    },
    {
        id: 'admin-004',
        category: 'administration',
        name: 'Tribunal de Première Instance',
        organization: 'Justice',
        position: 'Greffe',
        email: 'greffe@tpi-libreville.ga',
        phone: '+241 44 74 10 00',
        address: 'Libreville',
    },
];

// ============= SERVICE FUNCTIONS =============

/**
 * Récupère tous les contacts groupés par catégorie
 */
export async function getAllContacts(): Promise<ContactGroup[]> {
    // En mode démo, retourner les données mock
    // TODO: Implémenter la vraie récupération depuis Supabase

    const groups: ContactGroup[] = [
        {
            category: 'collaborator',
            ...CATEGORY_CONFIG.collaborator,
            contacts: MOCK_COLLABORATORS,
            count: MOCK_COLLABORATORS.length,
        },
        {
            category: 'citizen',
            ...CATEGORY_CONFIG.citizen,
            contacts: MOCK_CITIZENS,
            count: MOCK_CITIZENS.length,
        },
        {
            category: 'enterprise',
            ...CATEGORY_CONFIG.enterprise,
            contacts: MOCK_ENTERPRISES,
            count: MOCK_ENTERPRISES.length,
        },
        {
            category: 'association',
            ...CATEGORY_CONFIG.association,
            contacts: MOCK_ASSOCIATIONS,
            count: MOCK_ASSOCIATIONS.length,
        },
        {
            category: 'foreigner',
            ...CATEGORY_CONFIG.foreigner,
            contacts: MOCK_FOREIGNERS,
            count: MOCK_FOREIGNERS.length,
        },
        {
            category: 'inter_municipality',
            ...CATEGORY_CONFIG.inter_municipality,
            contacts: MOCK_INTER_MUNICIPALITY,
            count: MOCK_INTER_MUNICIPALITY.length,
        },
        {
            category: 'administration',
            ...CATEGORY_CONFIG.administration,
            contacts: MOCK_ADMINISTRATIONS,
            count: MOCK_ADMINISTRATIONS.length,
        },
    ];

    return groups;
}

/**
 * Récupère les contacts d'une catégorie spécifique
 */
export async function getContactsByCategory(category: ContactCategory): Promise<Contact[]> {
    const allGroups = await getAllContacts();
    const group = allGroups.find(g => g.category === category);
    return group?.contacts || [];
}

/**
 * Recherche des contacts par nom, email ou organisation
 */
export async function searchContacts(query: string): Promise<Contact[]> {
    const allGroups = await getAllContacts();
    const allContacts = allGroups.flatMap(g => g.contacts);

    const normalizedQuery = query.toLowerCase().trim();

    return allContacts.filter(contact =>
        contact.name.toLowerCase().includes(normalizedQuery) ||
        contact.email?.toLowerCase().includes(normalizedQuery) ||
        contact.organization?.toLowerCase().includes(normalizedQuery) ||
        contact.firstName?.toLowerCase().includes(normalizedQuery) ||
        contact.lastName?.toLowerCase().includes(normalizedQuery) ||
        contact.department?.toLowerCase().includes(normalizedQuery) ||
        contact.tags?.some(tag => tag.toLowerCase().includes(normalizedQuery))
    );
}

/**
 * Récupère un contact par son ID
 */
export async function getContactById(contactId: string): Promise<Contact | null> {
    const allGroups = await getAllContacts();
    const allContacts = allGroups.flatMap(g => g.contacts);
    return allContacts.find(c => c.id === contactId) || null;
}

/**
 * Récupère les contacts récents (simulé)
 */
export async function getRecentContacts(limit: number = 10): Promise<Contact[]> {
    const allGroups = await getAllContacts();
    const allContacts = allGroups.flatMap(g => g.contacts);
    return allContacts.slice(0, limit);
}

/**
 * Récupère les contacts favoris (simulé)
 */
export async function getFavoriteContacts(): Promise<Contact[]> {
    // Retourner les collaborateurs comme favoris par défaut
    return getContactsByCategory('collaborator');
}

/**
 * Récupère les contacts en ligne
 */
export async function getOnlineContacts(): Promise<Contact[]> {
    const allGroups = await getAllContacts();
    const allContacts = allGroups.flatMap(g => g.contacts);
    return allContacts.filter(c => c.isOnline);
}

// Export des configurations pour utilisation externe
export { CATEGORY_CONFIG };
