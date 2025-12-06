import { Entity } from "@/types/entity";
import { DemoUser, UserRole } from "@/types/roles";
import { MunicipalRole } from "@/types/municipal-roles";

export const getDemoAccountsForEntity = (entity: Entity): DemoUser[] => {
  const baseId = `demo-${entity.id}`;
  const cityName = entity.metadata?.city || entity.name;
  
  return [
    // 1. Citoyen (Résident de la commune)
    {
      id: `${baseId}-resident`,
      role: 'citizen' as UserRole,
      name: 'Citoyen Résident',
      entityId: entity.id,
      permissions: ['Mes demandes', 'Mon profil', 'Rendez-vous', 'Documents'],
      badge: '🏠',
      description: `Citoyen résidant à ${cityName}`,
    },
    // 2. Citoyen (D'une autre commune)
    {
      id: `${baseId}-other-commune`,
      role: 'citizen' as UserRole,
      name: 'Citoyen (Autre Commune)',
      entityId: entity.id,
      permissions: ['Légalisations', 'Certificats', 'Renseignements'],
      badge: '🌍',
      description: `Citoyen gabonais d'une autre commune`,
    },
    // 3. Étranger Résident
    {
      id: `${baseId}-foreigner`,
      role: 'citizen' as UserRole,
      name: 'Étranger Résident',
      entityId: entity.id,
      permissions: ['Certificat résidence', 'Attestations', 'Légalisations'],
      badge: '🌐',
      description: `Étranger résidant à ${cityName}`,
    },
    // 4. Personne Morale (Entreprise)
    {
      id: `${baseId}-company`,
      role: 'citizen' as UserRole,
      name: 'Entreprise / Association',
      entityId: entity.id,
      permissions: ['Patente', 'Autorisations commerce', 'Marchés publics'],
      badge: '🏢',
      description: `Entité morale opérant à ${cityName}`,
    },
  ];
};

export const getMunicipalStaffAccounts = (entity: Entity): DemoUser[] => {
  const baseId = `staff-${entity.id}`;
  const cityName = entity.metadata?.city || entity.name;
  
  return [
    {
      id: `${baseId}-maire`,
      role: MunicipalRole.MAIRE,
      name: `Maire de ${cityName}`,
      entityId: entity.id,
      permissions: ['Supervision globale', 'Signature actes', 'Gestion budget'],
      badge: '🏛️',
      description: 'Première autorité municipale',
    },
    {
      id: `${baseId}-maire-adjoint`,
      role: MunicipalRole.MAIRE_ADJOINT,
      name: `Maire Adjoint`,
      entityId: entity.id,
      permissions: ['Délégation Maire', 'Supervision services'],
      badge: '🎖️',
      description: 'Adjoint au Maire',
    },
    {
      id: `${baseId}-sg`,
      role: MunicipalRole.SECRETAIRE_GENERAL,
      name: `Secrétaire Général`,
      entityId: entity.id,
      permissions: ['Coordination administrative', 'Gestion RH'],
      badge: '📋',
      description: 'Coordination des services',
    },
    {
      id: `${baseId}-chef-etat-civil`,
      role: MunicipalRole.CHEF_SERVICE,
      name: `Chef Service État Civil`,
      entityId: entity.id,
      permissions: ['Gestion état civil', 'Validation actes'],
      badge: '📑',
      description: 'Responsable État Civil',
    },
    {
      id: `${baseId}-agent-ec`,
      role: MunicipalRole.AGENT_ETAT_CIVIL,
      name: `Officier État Civil`,
      entityId: entity.id,
      permissions: ['Établissement actes', 'Célébration mariages'],
      badge: '✍️',
      description: 'Officier d\'État Civil',
    },
    {
      id: `${baseId}-agent-accueil`,
      role: MunicipalRole.AGENT_ACCUEIL,
      name: `Agent d'Accueil`,
      entityId: entity.id,
      permissions: ['Accueil usagers', 'Orientation', 'Information'],
      badge: '🙋',
      description: 'Agent d\'accueil',
    },
  ];
};