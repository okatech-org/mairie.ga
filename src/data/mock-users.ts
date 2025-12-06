import { DemoUser } from '@/types/roles';
import { ConsularRole, EmploymentStatus } from '@/types/consular-roles';
import { UserFunction, BillingFeature } from '@/types/user-management';
import { MOCK_ENTITIES } from './mock-entities';
import { Entity } from '@/types/entity';
import { OrganizationType } from '@/types/organization';
import { MOCK_GABONAIS_CITIZENS } from './mock-citizens';
import { MOCK_FOREIGNERS } from './mock-foreigners';

// --- STATIC USERS (Admin & Citizens) ---

const ADMIN_USER: DemoUser = {
  id: 'admin-system',
  role: 'ADMIN',
  name: 'Super Admin',
  entityId: undefined,
  permissions: [
    'Accès total au système',
    'Gestion des licences',
    'Création d\'entités',
    'Configuration IA et sécurité',
    'Consultation des logs système',
    'Gestion des utilisateurs globale',
  ],
  badge: '🔴',
  description: 'Super administrateur avec accès au réseau mondial complet',
  functions: [UserFunction.USER_MANAGEMENT, UserFunction.SETTINGS_MANAGEMENT, UserFunction.REPORTING_VIEW],
  billingFeatures: [BillingFeature.API_ACCESS, BillingFeature.UNLIMITED_STORAGE],
  quotas: { maxDailyFiles: 9999, maxStorageGB: 1000, canExportData: true }
};

// --- DYNAMIC STAFF GENERATION ---

const generateStaffForEntity = (entity: Entity): DemoUser[] => {
  const staff: DemoUser[] = [];
  const entityType = entity.type;
  const city = entity.metadata?.city || 'Unknown';
  const idPrefix = entity.id.split('-').slice(0, 2).join('-'); // e.g., fr-consulat

  // 1. CONSUL GENERAL (Only for CONSULAT_GENERAL)
  if (entityType === OrganizationType.CONSULAT_GENERAL) {
    staff.push({
      id: `${idPrefix}-cg`,
      role: ConsularRole.CONSUL_GENERAL,
      name: `M. le Consul Général (${city})`,
      entityId: entity.id,
      hierarchyLevel: 1,
      employmentStatus: EmploymentStatus.FONCTIONNAIRE,
      allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL],
      permissions: ['Supervision globale', 'Direction stratégique', 'Administration générale'],
      badge: '🥇',
      description: 'Consul Général - Chef de Poste',
      functions: [UserFunction.VISA_VALIDATE, UserFunction.PASSPORT_VALIDATE, UserFunction.CIVIL_REGISTRY_VALIDATE, UserFunction.CRISIS_MANAGE],
      quotas: { maxDailyFiles: 500, maxStorageGB: 50, canExportData: true }
    });
  }

  // 2. CONSUL (All entities)
  staff.push({
    id: `${idPrefix}-consul`,
    role: ConsularRole.CONSUL,
    name: `Consul (${city})`,
    entityId: entity.id,
    hierarchyLevel: 2,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT, OrganizationType.AMBASSADE],
    permissions: entityType === OrganizationType.CONSULAT_GENERAL
      ? ['Direction adjointe', 'Gestion entité']
      : ['Direction section consulaire', 'Responsable principal'],
    badge: '🥈',
    description: entityType === OrganizationType.CONSULAT_GENERAL ? 'Consul - Adjoint au Chef de Poste' : 'Consul - Chef de Section Consulaire',
  });

  // 3. VICE-CONSUL (Only for CONSULAT and CONSULAT_GENERAL)
  if (entityType === OrganizationType.CONSULAT || entityType === OrganizationType.CONSULAT_GENERAL) {
    staff.push({
      id: `${idPrefix}-vc`,
      role: ConsularRole.VICE_CONSUL,
      name: `Vice-Consul (${city})`,
      entityId: entity.id,
      hierarchyLevel: 3,
      employmentStatus: EmploymentStatus.FONCTIONNAIRE,
      allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT],
      permissions: ['Supervision opérations', 'Validation'],
      badge: '🥉',
      description: 'Vice-Consul - Supervision Opérationnelle',
    });
  }

  // 4. CHARGE D'AFFAIRES CONSULAIRES (All entities)
  staff.push({
    id: `${idPrefix}-cac`,
    role: ConsularRole.CHARGE_AFFAIRES_CONSULAIRES,
    name: `Chargé d'Affaires (${city})`,
    entityId: entity.id,
    hierarchyLevel: 4,
    employmentStatus: EmploymentStatus.FONCTIONNAIRE,
    allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT, OrganizationType.AMBASSADE],
    permissions: ['Gestion demandes', 'Validation dossiers'],
    badge: '🎖️',
    description: 'Chargé d\'Affaires Consulaires',
  });

  // 5. AGENT CONSULAIRE (All entities - 2 agents)
  staff.push({
    id: `${idPrefix}-agent-1`,
    role: ConsularRole.AGENT_CONSULAIRE,
    name: `Agent Consulaire 1 (${city})`,
    entityId: entity.id,
    hierarchyLevel: 5,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT, OrganizationType.AMBASSADE],
    permissions: ['Traitement dossiers', 'Guichet virtuel'],
    badge: '🟢',
    description: 'Agent de traitement - Guichet',
  });

  staff.push({
    id: `${idPrefix}-agent-2`,
    role: ConsularRole.AGENT_CONSULAIRE,
    name: `Agent Consulaire 2 (${city})`,
    entityId: entity.id,
    hierarchyLevel: 5,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT, OrganizationType.AMBASSADE],
    permissions: ['Traitement dossiers', 'Biométrie'],
    badge: '🟢',
    description: 'Agent de traitement - Biométrie',
  });

  // 6. STAGIAIRE (All entities)
  staff.push({
    id: `${idPrefix}-stagiaire`,
    role: ConsularRole.STAGIAIRE,
    name: `Stagiaire (${city})`,
    entityId: entity.id,
    hierarchyLevel: 6,
    employmentStatus: EmploymentStatus.CONTRACTUEL,
    allowedEntityTypes: [OrganizationType.CONSULAT_GENERAL, OrganizationType.CONSULAT, OrganizationType.AMBASSADE],
    permissions: ['Support traitement', 'Saisie données'],
    badge: '🎓',
    description: 'Stagiaire - Support Opérationnel',
  });

  return staff;
};

// Generate staff for all entities
const GENERATED_STAFF = MOCK_ENTITIES.flatMap(entity => generateStaffForEntity(entity));

// --- DYNAMIC STAFF GENERATION ---

// Convert detailed citizens to DemoUser
const MAPPED_CITIZENS: DemoUser[] = MOCK_GABONAIS_CITIZENS.map(c => ({
  id: c.id,
  role: ConsularRole.CITIZEN,
  name: `${c.firstName} ${c.lastName}`,
  entityId: c.assignedConsulate,
  permissions: ['Accès complet', 'Passeport', 'État Civil'],
  badge: '🇬🇦',
  description: `Citoyen Gabonais - ${c.profession}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.CITOYEN
}));

// Convert detailed foreigners to DemoUser
const MAPPED_FOREIGNERS: DemoUser[] = MOCK_FOREIGNERS.map(f => ({
  id: f.id,
  role: ConsularRole.FOREIGNER,
  name: `${f.firstName} ${f.lastName}`,
  entityId: f.assignedConsulate,
  permissions: ['Accès limité', 'Visa', 'Légalisation'],
  badge: '🌍',
  description: `Usager Étranger - ${f.nationality}`,
  hierarchyLevel: 0,
  employmentStatus: EmploymentStatus.CITOYEN
}));

// --- SPECIFIC TEST CASES FOR TERRITORIALITY ---

const TEST_STUDENT_FRANCE: DemoUser = {
  id: 'student-gabon-france',
  role: ConsularRole.CITIZEN,
  name: 'Étudiant Gabonais (France)',
  entityId: 'fr-consulat-paris', // Managed by France
  permissions: ['Accès complet'],
  badge: '🎓',
  description: 'Étudiant en France (> 6 mois)',
  residenceCountry: 'FR',
  currentLocation: 'FR',
  stayDuration: 12,
  managedByOrgId: 'fr-consulat-paris'
};

const TEST_STUDENT_TRAVELER: DemoUser = {
  id: 'student-gabon-traveler',
  role: ConsularRole.CITIZEN,
  name: 'Étudiant Voyageur (Maroc)',
  entityId: 'fr-consulat-paris', // Still managed by France
  permissions: ['Accès complet'],
  badge: '✈️',
  description: 'Étudiant France en voyage au Maroc (< 6 mois)',
  residenceCountry: 'FR',
  currentLocation: 'MA', // Morocco
  stayDuration: 2, // < 6 months
  managedByOrgId: 'fr-consulat-paris',
  signaledToOrgId: 'ma-consulat-rabat' // Signaled to Morocco
};

export const MOCK_USERS: DemoUser[] = [
  ADMIN_USER,
  ...GENERATED_STAFF,
  ...MAPPED_CITIZENS,
  ...MAPPED_FOREIGNERS,
  TEST_STUDENT_FRANCE,
  TEST_STUDENT_TRAVELER
];

export const getUserById = (id: string): DemoUser | undefined => {
  return MOCK_USERS.find(user => user.id === id);
};

export const getUsersByEntity = (entityId: string): DemoUser[] => {
  return MOCK_USERS.filter(user => user.entityId === entityId);
};
