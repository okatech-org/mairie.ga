import React from 'react';
import { useDemo } from '@/contexts/DemoContext';
import IAstedInterface from './IAstedInterface';

/**
 * Wrapper qui injecte le rôle de l'utilisateur actuel dans IAstedInterface
 * Adapte les rôles du système consulaire aux rôles attendus par iAsted
 */
export default function IAstedInterfaceWrapper() {
  const { currentUser } = useDemo();

  // Mapper les rôles du système municipal vers les rôles iAsted
  const mapUserRole = (role?: string): string => {
    if (!role) return 'unknown'; // Pas de rôle = page d'accueil, on ne sait pas à qui on s'adresse

    switch (role.toUpperCase()) {
      // Personnel municipal - Élus
      case 'MAIRE':
        return 'maire';
      case 'MAIRE_ADJOINT':
      case 'ADJOINT':
        return 'maire_adjoint';
      
      // Personnel municipal - Administration
      case 'SECRETAIRE_GENERAL':
      case 'SG':
        return 'secretaire_general';
      case 'CHEF_SERVICE':
      case 'CHEF_SERVICE_ETAT_CIVIL':
      case 'CHEF_URBANISME':
        return 'chef_service';
      case 'AGENT':
      case 'AGENT_MUNICIPAL':
      case 'OFFICIER_ETAT_CIVIL':
      case 'AGENT_ACCUEIL':
        return 'agent';
      
      // Super Administration
      case 'SUPER_ADMIN':
      case 'ADMIN':
        return 'super_admin';
      
      // Usagers - Citoyens
      case 'CITIZEN':
      case 'CITOYEN':
      case 'RESIDENT':
        return 'citizen';
      case 'CITOYEN_AUTRE_COMMUNE':
        return 'citizen_other';
      case 'FOREIGNER':
      case 'ETRANGER':
      case 'ETRANGER_RESIDENT':
        return 'foreigner';
      
      // Usagers - Entités morales
      case 'COMPANY':
      case 'ENTREPRISE':
      case 'SOCIETE':
        return 'company';
      case 'ASSOCIATION':
        return 'association';
      
      default:
        return 'unknown'; // Retour inconnu pour salutation neutre
    }
  };

  const mappedRole = mapUserRole(currentUser?.role);

  return <IAstedInterface userRole={mappedRole} />;
}
