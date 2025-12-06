import { DemoUser } from '@/types/roles';
import { MunicipalRole, EmploymentStatus } from '@/types/municipal-roles';
import { UserFunction, BillingFeature } from '@/types/user-management';
import { MOCK_MAIRIES_NETWORK, MairieInfo } from './mock-mairies-network';
import { MOCK_GABONAIS_CITIZENS } from './mock-citizens';
import { MOCK_FOREIGNERS } from './mock-foreigners';

// --- STATIC USERS (Admin & Citizens) ---

const ADMIN_USER: DemoUser = {
  id: 'admin-system',
  role: 'ADMIN',
  name: 'Super Admin National',
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

// --- DYNAMIC STAFF GENERATION FOR MAIRIES ---

const generateStaffForMairie = (mairie: MairieInfo): DemoUser[] => {
  const staff: DemoUser[] = [];
  const city = mairie.name;
  const idPrefix = mairie.id;

  // 1. MAIRE
  staff.push({
    id: `${idPrefix}-maire`,
    role: MunicipalRole.MAIRE,
    name: `M. le Maire de ${city}`,
    entityId: mairie.id,
    hierarchyLevel: 1,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Supervision globale', 'Direction stratégique', 'Signature actes officiels', 'Gestion budget'],
    badge: '🏛️',
    description: `Maire de ${city} - Première autorité municipale`,
    functions: [UserFunction.CIVIL_REGISTRY_VALIDATE, UserFunction.SETTINGS_MANAGEMENT],
    quotas: { maxDailyFiles: 500, maxStorageGB: 50, canExportData: true }
  });

  // 2. MAIRE ADJOINT
  staff.push({
    id: `${idPrefix}-maire-adjoint`,
    role: MunicipalRole.MAIRE_ADJOINT,
    name: `Maire Adjoint (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 2,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Délégation Maire', 'Supervision services', 'Validation demandes'],
    badge: '🎖️',
    description: 'Maire Adjoint - Délégation du Maire',
  });

  // 3. SECRÉTAIRE GÉNÉRAL
  staff.push({
    id: `${idPrefix}-sg`,
    role: MunicipalRole.SECRETAIRE_GENERAL,
    name: `Secrétaire Général (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 3,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Coordination administrative', 'Gestion RH', 'Suivi dossiers'],
    badge: '📋',
    description: 'Secrétaire Général - Coordination Administrative',
  });

  // 4. CHEF SERVICE ÉTAT CIVIL
  staff.push({
    id: `${idPrefix}-chef-ec`,
    role: MunicipalRole.CHEF_SERVICE,
    name: `Chef Service État Civil (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 4,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Gestion état civil', 'Validation actes', 'Encadrement agents'],
    badge: '📑',
    description: 'Chef de Service État Civil',
  });

  // 5. CHEF SERVICE URBANISME
  staff.push({
    id: `${idPrefix}-chef-urb`,
    role: MunicipalRole.CHEF_SERVICE,
    name: `Chef Service Urbanisme (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 4,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Gestion urbanisme', 'Permis construire', 'Validation technique'],
    badge: '🏗️',
    description: 'Chef de Service Urbanisme',
  });

  // 6. OFFICIER ÉTAT CIVIL 1
  staff.push({
    id: `${idPrefix}-oec-1`,
    role: MunicipalRole.AGENT_ETAT_CIVIL,
    name: `Officier État Civil 1 (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Établissement actes', 'Célébration mariages', 'Registres'],
    badge: '✍️',
    description: 'Officier d\'État Civil',
  });

  // 7. OFFICIER ÉTAT CIVIL 2
  staff.push({
    id: `${idPrefix}-oec-2`,
    role: MunicipalRole.AGENT_ETAT_CIVIL,
    name: `Officier État Civil 2 (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    permissions: ['Établissement actes', 'Copies actes', 'Registres'],
    badge: '✍️',
    description: 'Officier d\'État Civil',
  });

  // 8. AGENT MUNICIPAL
  staff.push({
    id: `${idPrefix}-agent-1`,
    role: MunicipalRole.AGENT_MUNICIPAL,
    name: `Agent Municipal (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    permissions: ['Traitement dossiers', 'Guichet virtuel', 'Saisie données'],
    badge: '🟢',
    description: 'Agent de traitement - Guichet',
  });

  // 9. AGENT ACCUEIL
  staff.push({
    id: `${idPrefix}-accueil`,
    role: MunicipalRole.AGENT_ACCUEIL,
    name: `Agent Accueil (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 7,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    permissions: ['Accueil usagers', 'Orientation', 'Information'],
    badge: '🙋',
    description: 'Agent d\'accueil',
  });

  // 10. STAGIAIRE
  staff.push({
    id: `${idPrefix}-stagiaire`,
    role: MunicipalRole.STAGIAIRE,
    name: `Stagiaire (${city})`,
    entityId: mairie.id,
    hierarchyLevel: 7,
    employmentStatus: EmploymentStatus.STAGIAIRE,
    permissions: ['Support traitement', 'Saisie données', 'Apprentissage'],
    badge: '🎓',
    description: 'Stagiaire - Support Opérationnel',
  });

  return staff;
};

// Generate staff for all mairies
const GENERATED_STAFF = MOCK_MAIRIES_NETWORK.flatMap(mairie => generateStaffForMairie(mairie));

// --- CITIZENS MAPPING ---

// Convert detailed citizens to DemoUser
const MAPPED_CITIZENS: DemoUser[] = MOCK_GABONAIS_CITIZENS.map(c => ({
  id: c.id,
  role: MunicipalRole.CITOYEN,
  name: `${c.firstName} ${c.lastName}`,
  entityId: c.assignedConsulate, // Will need to be mapped to mairie
  permissions: ['Accès complet', 'État Civil', 'Urbanisme', 'Légalisation'],
  badge: '🇬🇦',
  description: `Citoyen Gabonais - ${c.profession}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
}));

// Convert detailed foreigners to DemoUser
const MAPPED_FOREIGNERS: DemoUser[] = MOCK_FOREIGNERS.map(f => ({
  id: f.id,
  role: MunicipalRole.ETRANGER_RESIDENT,
  name: `${f.firstName} ${f.lastName}`,
  entityId: f.assignedConsulate, // Will need to be mapped to mairie
  permissions: ['Certificat résidence', 'Légalisations', 'Attestations'],
  badge: '🌍',
  description: `Étranger Résident - ${f.nationality}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.USAGER
}));

// --- TEST CASES ---

const TEST_CITIZEN_LIBREVILLE: DemoUser = {
  id: 'citizen-libreville-1',
  role: MunicipalRole.CITOYEN,
  name: 'Jean-Baptiste Ndong',
  entityId: 'mairie-libreville-centrale',
  permissions: ['Accès complet'],
  badge: '🏠',
  description: 'Citoyen de Libreville - 1er Arrondissement',
  residenceCountry: 'GA',
  currentLocation: 'GA',
};

const TEST_ENTREPRISE: DemoUser = {
  id: 'entreprise-libreville-1',
  role: MunicipalRole.PERSONNE_MORALE,
  name: 'SARL Construction Plus',
  entityId: 'mairie-libreville-centrale',
  permissions: ['Patente', 'Permis construire', 'Autorisations'],
  badge: '🏢',
  description: 'Entreprise de BTP à Libreville',
};

export const MOCK_USERS: DemoUser[] = [
  ADMIN_USER,
  ...GENERATED_STAFF,
  ...MAPPED_CITIZENS,
  ...MAPPED_FOREIGNERS,
  TEST_CITIZEN_LIBREVILLE,
  TEST_ENTREPRISE
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
    user.role !== MunicipalRole.CITOYEN && 
    user.role !== MunicipalRole.ETRANGER_RESIDENT &&
    user.role !== MunicipalRole.PERSONNE_MORALE
  );
};