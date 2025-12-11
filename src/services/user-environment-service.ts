/**
 * Service de Gestion des Environnements Utilisateurs
 * 
 * Gère l'assignation et la vérification des environnements:
 * - BACK_OFFICE (Super Admin, collaborateurs)
 * - MUNICIPAL_STAFF (Personnel municipal)
 * - PUBLIC_USER (Citoyens, associations, entreprises)
 */

import { supabase } from '@/integrations/supabase/client';
import {
    UserEnvironment,
    UserEnvironmentAssignment,
    BackOfficeRole,
    MunicipalStaffRole,
    PublicUserRole,
    EnvironmentPermissions,
    getEnvironmentPermissions,
    getEnvironmentFromRole
} from '@/types/environments';

// ============================================================
// TYPES
// ============================================================

interface UserEnvironmentInfo {
    environment: UserEnvironment;
    role: BackOfficeRole | MunicipalStaffRole | PublicUserRole;
    organizationId?: string;
    organizationName?: string;
    permissions: EnvironmentPermissions;
    isActive: boolean;
}

interface AssignEnvironmentParams {
    userId: string;
    environment: UserEnvironment;
    role: BackOfficeRole | MunicipalStaffRole | PublicUserRole;
    organizationId?: string;
    validUntil?: string;
}

// ============================================================
// SERVICE
// ============================================================

class UserEnvironmentService {
    private static instance: UserEnvironmentService;
    private cache: Map<string, UserEnvironmentInfo> = new Map();

    private constructor() {
        console.log('🌍 [UserEnvironment] Service initialisé');
    }

    public static getInstance(): UserEnvironmentService {
        if (!UserEnvironmentService.instance) {
            UserEnvironmentService.instance = new UserEnvironmentService();
        }
        return UserEnvironmentService.instance;
    }

    // ========================================================
    // OBTENIR L'ENVIRONNEMENT DE L'UTILISATEUR
    // ========================================================

    /**
     * Obtenir l'environnement actuel de l'utilisateur connecté
     */
    async getCurrentUserEnvironment(): Promise<UserEnvironmentInfo | null> {
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session?.session?.user?.id) {
                return null;
            }

            return this.getUserEnvironment(session.session.user.id);
        } catch (error) {
            console.error('[UserEnvironment] Error getting current user environment:', error);
            return null;
        }
    }

    /**
     * Obtenir l'environnement d'un utilisateur spécifique
     */
    async getUserEnvironment(userId: string): Promise<UserEnvironmentInfo | null> {
        // Check cache first
        const cached = this.cache.get(userId);
        if (cached) {
            return cached;
        }

        try {
            const { data, error } = await supabase
                .from('user_environments')
                .select(`
                    *,
                    organization:organizations(id, name)
                `)
                .eq('user_id', userId)
                .eq('is_active', true)
                .or('valid_until.is.null,valid_until.gt.now()')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error || !data) {
                // Fallback: check legacy user_roles table
                return this.getLegacyEnvironment(userId);
            }

            const role = data.backoffice_role || data.municipal_role || data.public_role;
            const envInfo: UserEnvironmentInfo = {
                environment: data.environment as UserEnvironment,
                role,
                organizationId: data.organization_id,
                organizationName: data.organization?.name,
                permissions: getEnvironmentPermissions(data.environment as UserEnvironment, role),
                isActive: data.is_active
            };

            // Cache it
            this.cache.set(userId, envInfo);

            return envInfo;
        } catch (error) {
            console.error('[UserEnvironment] Error getting user environment:', error);
            return null;
        }
    }

    /**
     * Fallback: Obtenir l'environnement depuis l'ancien système user_roles
     */
    private async getLegacyEnvironment(userId: string): Promise<UserEnvironmentInfo | null> {
        try {
            const { data } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', userId)
                .maybeSingle();

            if (!data?.role) return null;

            // Map legacy roles to new environment system
            const legacyRole = data.role;
            let environment: UserEnvironment;
            let role: BackOfficeRole | MunicipalStaffRole | PublicUserRole;

            switch (legacyRole) {
                case 'super_admin':
                    environment = UserEnvironment.BACK_OFFICE;
                    role = BackOfficeRole.SUPER_ADMIN;
                    break;
                case 'admin':
                    environment = UserEnvironment.MUNICIPAL_STAFF;
                    role = MunicipalStaffRole.MAIRE;
                    break;
                case 'agent':
                    environment = UserEnvironment.MUNICIPAL_STAFF;
                    role = MunicipalStaffRole.AGENT_MUNICIPAL;
                    break;
                case 'citizen':
                default:
                    environment = UserEnvironment.PUBLIC_USER;
                    role = PublicUserRole.CITOYEN;
                    break;
            }

            const envInfo: UserEnvironmentInfo = {
                environment,
                role,
                permissions: getEnvironmentPermissions(environment, role),
                isActive: true
            };

            this.cache.set(userId, envInfo);
            return envInfo;
        } catch (error) {
            console.error('[UserEnvironment] Error in legacy fallback:', error);
            return null;
        }
    }

    // ========================================================
    // VÉRIFICATIONS DE PERMISSIONS
    // ========================================================

    /**
     * Vérifier si l'utilisateur est Super Admin
     */
    async isSuperAdmin(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.BACK_OFFICE
            && env?.role === BackOfficeRole.SUPER_ADMIN;
    }

    /**
     * Vérifier si l'utilisateur est du Back Office
     */
    async isBackOffice(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.BACK_OFFICE;
    }

    /**
     * Vérifier si l'utilisateur est Personnel Municipal
     */
    async isMunicipalStaff(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.MUNICIPAL_STAFF;
    }

    /**
     * Vérifier si l'utilisateur est un Usager Public
     */
    async isPublicUser(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.PUBLIC_USER;
    }

    /**
     * Vérifier si deux utilisateurs sont dans la même organisation
     */
    async sameOrganization(userId1: string, userId2: string): Promise<boolean> {
        const [env1, env2] = await Promise.all([
            this.getUserEnvironment(userId1),
            this.getUserEnvironment(userId2)
        ]);

        if (!env1?.organizationId || !env2?.organizationId) return false;
        return env1.organizationId === env2.organizationId;
    }

    /**
     * Obtenir les organisations accessibles par un utilisateur
     */
    async getAccessibleOrganizations(userId?: string): Promise<string[]> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return [];

        const env = await this.getUserEnvironment(targetUserId);
        if (!env) return [];

        // Super Admin can access all
        if (env.environment === UserEnvironment.BACK_OFFICE) {
            const { data } = await supabase
                .from('organizations')
                .select('id');
            return (data || []).map(o => o.id);
        }

        // Municipal staff can only access their org
        if (env.organizationId) {
            return [env.organizationId];
        }

        return [];
    }

    // ========================================================
    // GESTION DES ENVIRONNEMENTS (ADMIN)
    // ========================================================

    /**
     * Assigner un environnement à un utilisateur
     * Réservé aux Super Admins
     */
    async assignEnvironment(params: AssignEnvironmentParams): Promise<boolean> {
        try {
            // Check if current user is super admin
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                console.error('[UserEnvironment] Only super admins can assign environments');
                return false;
            }

            // Build insert object based on environment
            const insertData: any = {
                user_id: params.userId,
                environment: params.environment,
                organization_id: params.organizationId,
                is_active: true,
                valid_from: new Date().toISOString(),
                valid_until: params.validUntil
            };

            switch (params.environment) {
                case UserEnvironment.BACK_OFFICE:
                    insertData.backoffice_role = params.role;
                    break;
                case UserEnvironment.MUNICIPAL_STAFF:
                    insertData.municipal_role = params.role;
                    if (!params.organizationId) {
                        console.error('[UserEnvironment] Municipal staff requires organization');
                        return false;
                    }
                    break;
                case UserEnvironment.PUBLIC_USER:
                    insertData.public_role = params.role;
                    break;
            }

            const { error } = await supabase
                .from('user_environments')
                .insert(insertData);

            if (error) {
                console.error('[UserEnvironment] Assign error:', error);
                return false;
            }

            // Clear cache
            this.cache.delete(params.userId);

            return true;
        } catch (error) {
            console.error('[UserEnvironment] Assign error:', error);
            return false;
        }
    }

    /**
     * Désactiver l'environnement d'un utilisateur
     */
    async deactivateEnvironment(userId: string, environmentId: string): Promise<boolean> {
        try {
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                return false;
            }

            const { error } = await supabase
                .from('user_environments')
                .update({ is_active: false })
                .eq('id', environmentId)
                .eq('user_id', userId);

            if (error) return false;

            this.cache.delete(userId);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Lister tous les environnements assignés (admin)
     */
    async listAllEnvironments(options?: {
        environment?: UserEnvironment;
        organizationId?: string;
        isActive?: boolean;
    }): Promise<UserEnvironmentAssignment[]> {
        try {
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                return [];
            }

            let query = supabase
                .from('user_environments')
                .select('*')
                .order('created_at', { ascending: false });

            if (options?.environment) {
                query = query.eq('environment', options.environment);
            }

            if (options?.organizationId) {
                query = query.eq('organization_id', options.organizationId);
            }

            if (options?.isActive !== undefined) {
                query = query.eq('is_active', options.isActive);
            }

            const { data, error } = await query;

            if (error) return [];

            return (data || []).map(this.mapAssignment);
        } catch (error) {
            return [];
        }
    }

    // ========================================================
    // HELPERS
    // ========================================================

    private async getCurrentUserId(): Promise<string | null> {
        const { data: session } = await supabase.auth.getSession();
        return session?.session?.user?.id || null;
    }

    private mapAssignment(data: any): UserEnvironmentAssignment {
        return {
            id: data.id,
            userId: data.user_id,
            environment: data.environment,
            organizationId: data.organization_id,
            backofficeRole: data.backoffice_role,
            municipalRole: data.municipal_role,
            publicRole: data.public_role,
            isActive: data.is_active,
            validFrom: data.valid_from,
            validUntil: data.valid_until,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            createdBy: data.created_by
        };
    }

    /**
     * Invalider le cache pour un utilisateur
     */
    clearCache(userId?: string): void {
        if (userId) {
            this.cache.delete(userId);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Obtenir le dashboard approprié pour l'environnement
     */
    getDashboardRoute(env: UserEnvironmentInfo): string {
        switch (env.environment) {
            case UserEnvironment.BACK_OFFICE:
                return '/dashboard/super-admin';
            case UserEnvironment.MUNICIPAL_STAFF:
                const leadershipRoles = [
                    MunicipalStaffRole.MAIRE,
                    MunicipalStaffRole.MAIRE_ADJOINT
                ];
                if (leadershipRoles.includes(env.role as MunicipalStaffRole)) {
                    return '/dashboard/maire';
                }
                if (env.role === MunicipalStaffRole.SECRETAIRE_GENERAL) {
                    return '/dashboard/sg';
                }
                if ([MunicipalStaffRole.CHEF_SERVICE, MunicipalStaffRole.CHEF_BUREAU]
                    .includes(env.role as MunicipalStaffRole)) {
                    return '/dashboard/chef-service';
                }
                return '/dashboard/agent';
            case UserEnvironment.PUBLIC_USER:
                if (env.role === PublicUserRole.ETRANGER_RESIDENT) {
                    return '/dashboard/foreigner';
                }
                return '/dashboard/citizen';
            default:
                return '/dashboard/citizen';
        }
    }
}

// Singleton export
export const userEnvironmentService = UserEnvironmentService.getInstance();
export default userEnvironmentService;
