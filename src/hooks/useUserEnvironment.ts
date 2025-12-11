/**
 * Hook: useUserEnvironment
 * 
 * Hook React pour accéder à l'environnement utilisateur et ses permissions.
 * Gère automatiquement le chargement et le cache.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { userEnvironmentService } from '@/services/user-environment-service';
import {
    UserEnvironment,
    BackOfficeRole,
    MunicipalStaffRole,
    PublicUserRole,
    EnvironmentPermissions,
    getEnvironmentLabel,
    getRoleLabel
} from '@/types/environments';

// ============================================================
// TYPES
// ============================================================

interface UserEnvironmentState {
    environment: UserEnvironment | null;
    role: BackOfficeRole | MunicipalStaffRole | PublicUserRole | null;
    organizationId: string | null;
    organizationName: string | null;
    permissions: EnvironmentPermissions | null;
    isLoading: boolean;
    error: string | null;
}

interface UseUserEnvironmentReturn extends UserEnvironmentState {
    // Labels localisés
    environmentLabel: string;
    roleLabel: string;

    // Vérifications rapides
    isSuperAdmin: boolean;
    isBackOffice: boolean;
    isMunicipalStaff: boolean;
    isPublicUser: boolean;

    // Helpers pour les élus
    isMaire: boolean;
    isMaireAdjoint: boolean;
    isSecretaireGeneral: boolean;
    isChefService: boolean;
    isAgent: boolean;

    // Helpers pour les usagers
    isCitoyen: boolean;
    isEtranger: boolean;
    isAssociation: boolean;
    isEntreprise: boolean;

    // Actions
    refresh: () => Promise<void>;
    getDashboardRoute: () => string;

    // Permissions utilitaires
    canViewOrganization: (orgId: string) => Promise<boolean>;
    canManageUsers: boolean;
    canSendExternalEmail: boolean;
    canViewAuditLogs: boolean;
}

// ============================================================
// HOOK
// ============================================================

export function useUserEnvironment(): UseUserEnvironmentReturn {
    const [state, setState] = useState<UserEnvironmentState>({
        environment: null,
        role: null,
        organizationId: null,
        organizationName: null,
        permissions: null,
        isLoading: true,
        error: null
    });

    // Chargement de l'environnement
    const loadEnvironment = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, isLoading: true, error: null }));

            const envInfo = await userEnvironmentService.getCurrentUserEnvironment();

            if (envInfo) {
                setState({
                    environment: envInfo.environment,
                    role: envInfo.role,
                    organizationId: envInfo.organizationId || null,
                    organizationName: envInfo.organizationName || null,
                    permissions: envInfo.permissions,
                    isLoading: false,
                    error: null
                });
            } else {
                setState({
                    environment: null,
                    role: null,
                    organizationId: null,
                    organizationName: null,
                    permissions: null,
                    isLoading: false,
                    error: null
                });
            }
        } catch (error) {
            console.error('[useUserEnvironment] Error:', error);
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: 'Erreur lors du chargement de l\'environnement'
            }));
        }
    }, []);

    // Écouter les changements d'authentification
    useEffect(() => {
        loadEnvironment();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                    loadEnvironment();
                } else if (event === 'SIGNED_OUT') {
                    setState({
                        environment: null,
                        role: null,
                        organizationId: null,
                        organizationName: null,
                        permissions: null,
                        isLoading: false,
                        error: null
                    });
                    userEnvironmentService.clearCache();
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, [loadEnvironment]);

    // Calculer les labels
    const environmentLabel = state.environment
        ? getEnvironmentLabel(state.environment)
        : '';

    const roleLabel = state.role
        ? getRoleLabel(state.role)
        : '';

    // Vérifications rapides
    const isSuperAdmin = state.environment === UserEnvironment.BACK_OFFICE
        && state.role === BackOfficeRole.SUPER_ADMIN;

    const isBackOffice = state.environment === UserEnvironment.BACK_OFFICE;
    const isMunicipalStaff = state.environment === UserEnvironment.MUNICIPAL_STAFF;
    const isPublicUser = state.environment === UserEnvironment.PUBLIC_USER;

    // Helpers pour les élus
    const isMaire = state.role === MunicipalStaffRole.MAIRE;
    const isMaireAdjoint = state.role === MunicipalStaffRole.MAIRE_ADJOINT;
    const isSecretaireGeneral = state.role === MunicipalStaffRole.SECRETAIRE_GENERAL;
    const isChefService = state.role === MunicipalStaffRole.CHEF_SERVICE
        || state.role === MunicipalStaffRole.CHEF_BUREAU;
    const isAgent = isMunicipalStaff && ![
        MunicipalStaffRole.MAIRE,
        MunicipalStaffRole.MAIRE_ADJOINT,
        MunicipalStaffRole.SECRETAIRE_GENERAL,
        MunicipalStaffRole.CHEF_SERVICE,
        MunicipalStaffRole.CHEF_BUREAU
    ].includes(state.role as MunicipalStaffRole);

    // Helpers pour les usagers
    const isCitoyen = state.role === PublicUserRole.CITOYEN
        || state.role === PublicUserRole.CITOYEN_AUTRE;
    const isEtranger = state.role === PublicUserRole.ETRANGER_RESIDENT;
    const isAssociation = state.role === PublicUserRole.ASSOCIATION;
    const isEntreprise = state.role === PublicUserRole.ENTREPRISE;

    // Actions
    const refresh = async () => {
        userEnvironmentService.clearCache();
        await loadEnvironment();
    };

    const getDashboardRoute = () => {
        if (!state.environment || !state.role || !state.permissions) {
            return '/dashboard/citizen';
        }

        return userEnvironmentService.getDashboardRoute({
            environment: state.environment,
            role: state.role,
            organizationId: state.organizationId || undefined,
            permissions: state.permissions,
            isActive: true
        });
    };

    const canViewOrganization = async (orgId: string): Promise<boolean> => {
        if (isBackOffice) return true;
        if (state.organizationId === orgId) return true;
        const accessible = await userEnvironmentService.getAccessibleOrganizations();
        return accessible.includes(orgId);
    };

    return {
        // État
        ...state,

        // Labels
        environmentLabel,
        roleLabel,

        // Vérifications environnement
        isSuperAdmin,
        isBackOffice,
        isMunicipalStaff,
        isPublicUser,

        // Vérifications élus
        isMaire,
        isMaireAdjoint,
        isSecretaireGeneral,
        isChefService,
        isAgent,

        // Vérifications usagers
        isCitoyen,
        isEtranger,
        isAssociation,
        isEntreprise,

        // Actions
        refresh,
        getDashboardRoute,
        canViewOrganization,

        // Permissions directes
        canManageUsers: state.permissions?.canManageUsers || false,
        canSendExternalEmail: state.permissions?.canSendExternalEmail || false,
        canViewAuditLogs: state.permissions?.canViewAuditLogs || false
    };
}

export default useUserEnvironment;
