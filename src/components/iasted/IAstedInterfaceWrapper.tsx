import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useDemo } from '@/contexts/DemoContext';
import { useAuth } from '@/hooks/useAuth';
import { usePresentationSafe } from '@/contexts/PresentationContext';
import { supabase } from '@/integrations/supabase/client';
import IAstedInterface from './IAstedInterface';

/**
 * Wrapper qui injecte le rôle de l'utilisateur actuel dans IAstedInterface
 * Priorise l'utilisateur Supabase connecté, puis le mode démo
 * Gère également le déclenchement automatique de la présentation pour les nouveaux visiteurs
 */
export default function IAstedInterfaceWrapper() {
  const { currentUser: demoUser } = useDemo();
  const { user: authUser, loading: authLoading } = useAuth();
  const { showPresentation, startPresentation, stopPresentation } = usePresentationSafe();
  const [userRole, setUserRole] = useState<string | undefined>(undefined);
  const [userFirstName, setUserFirstName] = useState<string | undefined>(undefined);
  const location = useLocation();

  // Debug: Log presentation state changes
  useEffect(() => {
    console.log('🎭 [IAstedInterfaceWrapper] showPresentation changed:', showPresentation);
  }, [showPresentation]);

  // Auto-trigger presentation for new visitors
  useEffect(() => {
    // Only trigger on home page
    if (location.pathname === '/') {
      // Check localStorage
      const hasSeenPresentation = localStorage.getItem('hasSeenIAstedPresentation');

      if (!hasSeenPresentation) {
        console.log('🆕 [IAstedInterfaceWrapper] New visitor detected on Home, scheduling presentation...');

        // Delay start to let the page load and user settle
        const timer = setTimeout(() => {
          if (!localStorage.getItem('hasSeenIAstedPresentation')) { // Double check
            console.log('🎬 [IAstedInterfaceWrapper] Auto-starting presentation!');
            startPresentation();
            localStorage.setItem('hasSeenIAstedPresentation', 'true');
          }
        }, 3000); // 3 seconds delay

        return () => clearTimeout(timer);
      }
    }
  }, [location.pathname, startPresentation]);

  useEffect(() => {
    const detectUserAndRole = async () => {
      // Priorité 1: Utilisateur Supabase authentifié
      if (authUser) {
        console.log('🔐 [IAstedWrapper] Utilisateur connecté:', authUser.email);

        // D'abord essayer user_environments pour le rôle précis (MAIRE, AGENT_MUNICIPAL, etc.)
        const { data: envData } = await supabase
          .from('user_environments')
          .select('role, environment')
          .eq('user_id', authUser.id)
          .eq('is_active', true)
          .maybeSingle();

        if (envData?.role) {
          console.log('🔐 [IAstedWrapper] Rôle précis (user_environments):', envData.role);
          setUserRole(envData.role);
        } else {
          // Fallback sur user_roles
          const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (roleData?.role) {
            console.log('🔐 [IAstedWrapper] Rôle (user_roles):', roleData.role);
            setUserRole(roleData.role);
          } else {
            setUserRole('citizen');
          }
        }

        // Récupérer le prénom depuis profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profileData) {
          // Gérer le cas où first_name est "M." (abréviation de Monsieur)
          let displayName = profileData.first_name || '';
          
          // Si le prénom est une abréviation de titre, ne pas l'utiliser comme prénom
          if (displayName === 'M.' || displayName === 'Mme' || displayName === 'Mlle') {
            // Ne pas définir de prénom, laisser iAsted utiliser le titre approprié
            console.log('🔐 [IAstedWrapper] Prénom est un titre, ignoré:', displayName);
            setUserFirstName(undefined);
          } else {
            console.log('🔐 [IAstedWrapper] Prénom détecté:', displayName);
            setUserFirstName(displayName);
          }
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
    if (!role) return 'unknown';

    const upperRole = role.toUpperCase();

    // Rôles précis de user_environments ou user_roles
    switch (upperRole) {
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

      // Super Administration (rôle système)
      case 'SUPER_ADMIN':
        return 'super_admin';
      
      // Le rôle 'admin' de user_roles peut être un maire ou un admin selon le contexte
      // Priorité donnée à user_environments donc si on arrive ici avec 'admin', 
      // c'est un admin système, pas un maire
      case 'ADMIN':
        return 'admin';

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
        return 'unknown';
    }
  };

  const mappedRole = mapUserRole(userRole);

  return (
    <IAstedInterface
      userRole={mappedRole}
      userFirstName={userFirstName}
      externalPresentationMode={showPresentation}
      onExternalPresentationClose={stopPresentation}
    />
  );
}
