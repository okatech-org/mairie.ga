import { DemoUser } from '@/types/roles';
import { MunicipalRole, EmploymentStatus } from '@/types/municipal-roles';
import { UserFunction, BillingFeature } from '@/types/user-management';
import { MAIRIES_GABON, MOCK_MAIRIES_NETWORK, MairieInfo } from './mock-mairies-network';
import { MOCK_GABONAIS_CITIZENS } from './mock-citizens';
import { MOCK_FOREIGNERS } from './mock-foreigners';
import { Organization } from '@/types/organization';

// --- STATIC USERS (Admin & Citizens) ---

const ADMIN_USER: DemoUser = {
  id: 'admin-system',
  role: 'ADMIN',
  name: 'Marc-Aurèle NDONG',
  entityId: undefined,
  permissions: [
    'Accès total au système',
    'Gestion des licences',
    'Création de mairies',
    'Configuration IA et sécurité',
    'Consultation des logs système',
    'Gestion des utilisateurs globale',
  ],
  badge: '🔴',
  description: 'Super administrateur avec accès au réseau national complet',
  functions: [UserFunction.USER_MANAGEMENT, UserFunction.SETTINGS_MANAGEMENT, UserFunction.REPORTING_VIEW],
  billingFeatures: [BillingFeature.API_ACCESS, BillingFeature.UNLIMITED_STORAGE],
  quotas: { maxDailyFiles: 9999, maxStorageGB: 1000, canExportData: true }
};

// --- DYNAMIC STAFF GENERATION FOR MAIRIES (using full Organization data) ---

const GABONAIS_LAST_NAMES = [
  'MBA', 'OBAME', 'NDONG', 'NGUEMA', 'OYONO', 'MEZUI', 'BOGUIKOUMA', 'OGANDAGA',
  'MOMBO', 'KOMBILA', 'MOUSSAVOU', 'MOUNDOUNGA', 'MAPANGOU', 'BOUNGOUENDZA', 'MAGANGA'
];

const GABONAIS_FIRST_NAMES_MALE = [
  'Jean-Pierre', 'Marc', 'Célestin', 'Ghislain', 'Hervé', 'Simplice', 'Rodrigue',
  'Dieudonné', 'Franck', 'Yannick', 'Brice', 'Arnaud', 'Guy-Roger', 'Patrice'
];

const GABONAIS_FIRST_NAMES_FEMALE = [
  'Chantal', 'Solange', 'Marie-Claire', 'Sandrine', 'Edwige', 'Nadège', 'Sylvie',
  'Clémence', 'Prisca', 'Tatiana', 'Flavie', 'Paulette', 'Inès', 'Rose'
];

const generateStaffForOrganization = (org: Organization): DemoUser[] => {
  const staff: DemoUser[] = [];
  const city = org.city || org.name;
  const idPrefix = org.id;

  const getRandom = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
  const generateName = (isFemale: boolean = false) => {
    const fn = isFemale ? getRandom(GABONAIS_FIRST_NAMES_FEMALE) : getRandom(GABONAIS_FIRST_NAMES_MALE);
    const ln = getRandom(GABONAIS_LAST_NAMES);
    return { name: `${fn} ${ln}`, gender: isFemale ? 'F' : 'M' };
  };

  // 1. MAIRE
  const maireInfo = generateName();
  staff.push({
    id: `${idPrefix}-maire`,
    role: MunicipalRole.MAIRE,
    name: org.maire_name || maireInfo.name,
    gender: maireInfo.gender,
    entityId: org.id,
    hierarchyLevel: 1,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Supervision globale', 'Direction stratégique', 'Signature actes officiels', 'Gestion budget'],
    badge: '🏛️',
    description: `Maire de ${city} - Première autorité municipale`,
    functions: [UserFunction.CIVIL_REGISTRY_VALIDATE, UserFunction.SETTINGS_MANAGEMENT],
    quotas: { maxDailyFiles: 500, maxStorageGB: 50, canExportData: true }
  });

  // 2. MAIRE ADJOINT
  const adjointInfo = generateName(true);
  staff.push({
    id: `${idPrefix}-maire-adjoint`,
    role: MunicipalRole.MAIRE_ADJOINT,
    name: adjointInfo.name,
    gender: adjointInfo.gender,
    entityId: org.id,
    hierarchyLevel: 2,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Délégation Maire', 'Supervision services', 'Validation demandes'],
    badge: '🎖️',
    description: 'Maire Adjoint - Délégation du Maire',
  });

  // 3. SECRÉTAIRE GÉNÉRAL
  const sgInfo = generateName();
  staff.push({
    id: `${idPrefix}-sg`,
    role: MunicipalRole.SECRETAIRE_GENERAL,
    name: sgInfo.name,
    gender: sgInfo.gender,
    entityId: org.id,
    hierarchyLevel: 3,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Coordination administrative', 'Gestion RH', 'Suivi dossiers'],
    badge: '📋',
    description: 'Secrétaire Général - Coordination Administrative',
  });

  // 4. CHEF SERVICE ÉTAT CIVIL
  const chefEcInfo = generateName(true);
  staff.push({
    id: `${idPrefix}-chef-ec`,
    role: MunicipalRole.CHEF_SERVICE_ETAT_CIVIL,
    name: chefEcInfo.name,
    gender: chefEcInfo.gender,
    entityId: org.id,
    hierarchyLevel: 4,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Gestion état civil', 'Validation actes', 'Encadrement agents'],
    badge: '📑',
    description: 'Chef de Service État Civil',
  });

  // 5. CHEF SERVICE URBANISME
  const chefUrbInfo = generateName();
  staff.push({
    id: `${idPrefix}-chef-urb`,
    role: MunicipalRole.CHEF_SERVICE_URBANISME,
    name: chefUrbInfo.name,
    gender: chefUrbInfo.gender,
    entityId: org.id,
    hierarchyLevel: 4,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Gestion urbanisme', 'Permis construire', 'Validation technique'],
    badge: '🏗️',
    description: 'Chef de Service Urbanisme',
  });

  // 6. OFFICIER ÉTAT CIVIL 1
  const oec1Info = generateName();
  staff.push({
    id: `${idPrefix}-oec-1`,
    role: MunicipalRole.OFFICIER_ETAT_CIVIL,
    name: oec1Info.name,
    gender: oec1Info.gender,
    entityId: org.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Établissement actes', 'Célébration mariages', 'Registres'],
    badge: '✍️',
    description: 'Officier d\'État Civil',
  });

  // 7. OFFICIER ÉTAT CIVIL 2
  const oec2Info = generateName(true);
  staff.push({
    id: `${idPrefix}-oec-2`,
    role: MunicipalRole.OFFICIER_ETAT_CIVIL,
    name: oec2Info.name,
    gender: oec2Info.gender,
    entityId: org.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Établissement actes', 'Copies actes', 'Registres'],
    badge: '✍️',
    description: 'Officier d\'État Civil',
  });

  // 8. AGENT MUNICIPAL
  const agent1Info = generateName();
  staff.push({
    id: `${idPrefix}-agent-1`,
    role: MunicipalRole.AGENT_MUNICIPAL,
    name: agent1Info.name,
    gender: agent1Info.gender,
    entityId: org.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    permissions: ['Traitement dossiers', 'Guichet virtuel', 'Saisie données'],
    badge: '🟢',
    description: 'Agent de traitement - Guichet',
  });

  // 9. AGENT ACCUEIL
  const accueilInfo = generateName(true);
  staff.push({
    id: `${idPrefix}-accueil`,
    role: MunicipalRole.AGENT_ACCUEIL,
    name: accueilInfo.name,
    gender: accueilInfo.gender,
    entityId: org.id,
    hierarchyLevel: 7,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    permissions: ['Accueil usagers', 'Orientation', 'Information'],
    badge: '🙋',
    description: 'Agent d\'accueil',
  });

  // 10. STAGIAIRE
  const stagiaireInfo = generateName();
  staff.push({
    id: `${idPrefix}-stagiaire`,
    role: MunicipalRole.STAGIAIRE,
    name: stagiaireInfo.name,
    gender: stagiaireInfo.gender,
    entityId: org.id,
    hierarchyLevel: 7,
    employmentStatus: EmploymentStatus.STAGIAIRE,
    permissions: ['Support traitement', 'Saisie données', 'Apprentissage'],
    badge: '🎓',
    description: 'Stagiaire - Support Opérationnel',
  });

  return staff;
};

// Generate staff for all mairies using complete Organization data
const GENERATED_STAFF = MAIRIES_GABON.flatMap(mairie => generateStaffForOrganization(mairie));

// --- USAGER MAPPING ---

// Convert detailed citizens to DemoUser
const MAPPED_CITIZENS: DemoUser[] = MOCK_GABONAIS_CITIZENS.map(c => ({
  id: c.id,
  role: MunicipalRole.USAGER,
  name: `${c.firstName} ${c.lastName}`,
  entityId: c.assignedMunicipality, // Mapped to municipality
  permissions: ['Accès complet', 'État Civil', 'Urbanisme', 'Légalisation'],
  badge: '🏠',
  description: `Usager Résident - ${c.profession}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
}));

// Convert detailed foreigners to DemoUser
const MAPPED_FOREIGNERS: DemoUser[] = MOCK_FOREIGNERS.map(f => ({
  id: f.id,
  role: MunicipalRole.USAGER,
  name: `${f.firstName} ${f.lastName}`,
  entityId: f.assignedMunicipality, // Mapped to municipality
  permissions: ['Certificat résidence', 'Légalisations', 'Attestations'],
  badge: '🌍',
  description: `Usager Étranger - ${f.nationality}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
}));

// --- DEMO CITIZEN ACCOUNTS (4 types d'usagers) ---

const DEMO_CITOYEN_RESIDENT: DemoUser = {
  id: 'demo-citoyen-resident',
  role: MunicipalRole.USAGER,
  name: 'Lucia MBADINGA',
  gender: 'F',
  entityId: 'mairie-libreville-centrale',
  permissions: ['Mes demandes', 'Mon profil', 'État Civil', 'Urbanisme'],
  badge: '🏠',
  description: 'Usager résidant à Libreville',
  residenceCountry: 'GA',
  currentLocation: 'GA',
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
};

const DEMO_CITOYEN_AUTRE_COMMUNE: DemoUser = {
  id: 'demo-citoyen-autre-commune',
  role: MunicipalRole.USAGER,
  name: 'Hervé MOMBO',
  gender: 'M',
  entityId: 'mairie-libreville-centrale',
  permissions: ['Légalisations', 'Certificats', 'Attestations'],
  badge: '🌍',
  description: 'Usager gabonais d\'une autre commune',
  residenceCountry: 'GA',
  currentLocation: 'GA',
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
};

const DEMO_ETRANGER_RESIDENT: DemoUser = {
  id: 'demo-etranger-resident',
  role: MunicipalRole.USAGER,
  name: 'Moussa DIOP', // West African name common in Gabon
  gender: 'M',
  entityId: 'mairie-libreville-centrale',
  permissions: ['Certificat résidence', 'Attestations', 'Légalisations'],
  badge: '🌐',
  description: 'Usager étranger résidant à Libreville',
  residenceCountry: 'SN', // Set to Senegal for realism
  currentLocation: 'GA',
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
};

// Export des comptes usagers de démo
export const DEMO_CITIZEN_ACCOUNTS: DemoUser[] = [
  DEMO_CITOYEN_RESIDENT,
  DEMO_CITOYEN_AUTRE_COMMUNE,
  DEMO_ETRANGER_RESIDENT
];

export const MOCK_USERS: DemoUser[] = [
  ADMIN_USER,
  ...GENERATED_STAFF,
  ...MAPPED_CITIZENS,
  ...MAPPED_FOREIGNERS,
  ...DEMO_CITIZEN_ACCOUNTS
];

export const getUserById = (id: string): DemoUser | undefined => {
  return MOCK_USERS.find(user => user.id === id);
};

export const getUsersByEntity = (entityId: string): DemoUser[] => {
  return MOCK_USERS.filter(user => user.entityId === entityId);
};

export const getStaffByMairie = (mairieId: string): DemoUser[] => {
  return MOCK_USERS.filter(user =>
    user.entityId === mairieId &&
    user.role !== MunicipalRole.USAGER
  );
};