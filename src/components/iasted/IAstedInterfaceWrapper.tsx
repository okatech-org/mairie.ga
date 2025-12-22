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

  // Détecter le contexte basé sur la route actuelle
  const getRouteContext = (pathname: string): string | null => {
    // Dashboard du Maire
    if (pathname.startsWith('/dashboard/maire')) return 'maire';
    // Dashboard Super Admin
    if (pathname.startsWith('/dashboard/super-admin')) return 'super_admin';
    // Dashboard Agent
    if (pathname.startsWith('/dashboard/agent')) return 'agent';
    // Dashboard Citoyen
    if (pathname.startsWith('/dashboard/citizen')) return 'citizen';
    // Dashboard Admin général
    if (pathname.startsWith('/admin') || pathname.startsWith('/dashboard/admin')) return 'admin';
    return null;
  };

  // Mapper les rôles du système municipal vers les rôles iAsted
  const mapUserRole = (role?: string, routeContext?: string | null): string => {
    if (!role) return 'unknown';

    const upperRole = role.toUpperCase();

    // PRIORITÉ 1: Le contexte de la route (si l'utilisateur est sur /dashboard/maire, c'est le maire)
    if (routeContext) {
      console.log('🔐 [IAstedWrapper] Contexte de route détecté:', routeContext);
      // Si l'utilisateur a un rôle admin mais est sur le dashboard maire, c'est le maire
      if (routeContext === 'maire' && (upperRole === 'ADMIN' || upperRole === 'MAIRE')) {
        return 'maire';
      }
      // Retourner le contexte de route si compatible avec le rôle
      if (routeContext === 'super_admin' && upperRole === 'SUPER_ADMIN') return 'super_admin';
      if (routeContext === 'agent' && (upperRole === 'AGENT' || upperRole === 'AGENT_MUNICIPAL')) return 'agent';
    }

    // PRIORITÉ 2: Rôles précis de user_environments ou user_roles
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
      
      // Le rôle 'admin' - vérifier le contexte de la route
      case 'ADMIN':
        // Si on est sur le dashboard du maire avec rôle admin, c'est le maire
        if (routeContext === 'maire') return 'maire';
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

  const routeContext = getRouteContext(location.pathname);
  const mappedRole = mapUserRole(userRole, routeContext);
  
  console.log('🔐 [IAstedWrapper] Role mapping:', { 
    originalRole: userRole, 
    routeContext, 
    mappedRole,
    pathname: location.pathname 
  });

  return (
    <IAstedInterface
      userRole={mappedRole}
      userFirstName={userFirstName}
      externalPresentationMode={showPresentation}
      onExternalPresentationClose={stopPresentation}
    />
  );
}
