import React, { useEffect, useState } from 'react';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import IAstedInterface from './IAstedInterface';

/**
 * Wrapper qui injecte le rôle de l'utilisateur actuel dans IAstedInterface
 * Priorise l'utilisateur Supabase connecté, puis le mode démo
 */
export default function IAstedInterfaceWrapper() {
  const { currentUser: demoUser } = useDemo();
  const { user: authUser, loading: authLoading } = useAuth();
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [userFirstName, setUserFirstName] = useState<string | undefined>(undefined);

  useEffect(() => {
    const detectUserAndRole = async () => {
      // Priorité 1: Utilisateur Supabase authentifié
      if (authUser) {
        console.log('🔐 [IAstedWrapper] Utilisateur connecté:', authUser.email);
        
        // Récupérer le rôle depuis user_roles
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', authUser.id)
          .single();

        if (roleData?.role) {
          console.log('🔐 [IAstedWrapper] Rôle détecté:', roleData.role);
          setUserRole(roleData.role);
        } else {
          setUserRole('citizen');
        }

        // Récupérer le prénom depuis profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('user_id', authUser.id)
          .single();

        if (profileData?.first_name) {
          console.log('🔐 [IAstedWrapper] Prénom détecté:', profileData.first_name);
          setUserFirstName(profileData.first_name);
        }
        return;
      }

      // Priorité 2: Mode démo
      if (demoUser?.role) {
        console.log('🎭 [IAstedWrapper] Mode démo:', demoUser.role);
        setUserRole(demoUser.role);
        setUserFirstName(demoUser.name?.split(' ')[0]);
        return;
      }

      // Pas d'utilisateur = inconnu
      setUserRole('unknown');
      setUserFirstName(undefined);
    };

    if (!authLoading) {
      detectUserAndRole();
    }
  }, [authUser, authLoading, demoUser]);

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

  const mappedRole = mapUserRole(userRole);

  return <IAstedInterface userRole={mappedRole} userFirstName={userFirstName} />;
}
