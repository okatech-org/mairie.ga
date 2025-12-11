/**
 * Service de Gestion des Environnements Utilisateurs
 * 
 * Gère l'assignation et la vérification des environnements:
 * - BACK_OFFICE (Super Admin, collaborateurs)
 * - MUNICIPAL_STAFF (Personnel municipal)
 * - PUBLIC_USER (Citoyens, associations, entreprises)
 * 
 * NOTE: Ce service utilise une table user_environments qui peut ne pas exister.
 * Il fournit un fallback vers l'ancien système user_roles.
 */

import { supabase } from '@/integrations/supabase/client';
import {
    UserEnvironment,
    UserEnvironmentAssignment,
    BackOfficeRole,
    MunicipalStaffRole,
    PublicUserRole,
    EnvironmentPermissions,
    getEnvironmentPermissions
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

    async getUserEnvironment(userId: string): Promise<UserEnvironmentInfo | null> {
        // Check cache first
        const cached = this.cache.get(userId);
        if (cached) {
            return cached;
        }

        // The user_environments table may not exist yet, so we use the legacy fallback
        return this.getLegacyEnvironment(userId);
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

    async isSuperAdmin(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.BACK_OFFICE
            && env?.role === BackOfficeRole.SUPER_ADMIN;
    }

    async isBackOffice(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.BACK_OFFICE;
    }

    async isMunicipalStaff(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.MUNICIPAL_STAFF;
    }

    async isPublicUser(userId?: string): Promise<boolean> {
        const targetUserId = userId || (await this.getCurrentUserId());
        if (!targetUserId) return false;

        const env = await this.getUserEnvironment(targetUserId);
        return env?.environment === UserEnvironment.PUBLIC_USER;
    }

    async sameOrganization(userId1: string, userId2: string): Promise<boolean> {
        const [env1, env2] = await Promise.all([
            this.getUserEnvironment(userId1),
            this.getUserEnvironment(userId2)
        ]);

        if (!env1?.organizationId || !env2?.organizationId) return false;
        return env1.organizationId === env2.organizationId;
    }

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

    async assignEnvironment(params: AssignEnvironmentParams): Promise<boolean> {
        try {
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                console.error('[UserEnvironment] Only super admins can assign environments');
                return false;
            }

            // For now, we update the legacy user_roles table
            let appRole = 'citizen';
            
            switch (params.environment) {
                case UserEnvironment.BACK_OFFICE:
                    appRole = 'super_admin';
                    break;
                case UserEnvironment.MUNICIPAL_STAFF:
                    if ([MunicipalStaffRole.MAIRE, MunicipalStaffRole.MAIRE_ADJOINT, MunicipalStaffRole.SECRETAIRE_GENERAL].includes(params.role as MunicipalStaffRole)) {
                        appRole = 'admin';
                    } else {
                        appRole = 'agent';
                    }
                    break;
                case UserEnvironment.PUBLIC_USER:
                    appRole = 'citizen';
                    break;
            }

            // Check if role exists first
            const { data: existing } = await supabase
                .from('user_roles')
                .select('id')
                .eq('user_id', params.userId)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('user_roles')
                    .update({ role: appRole as any })
                    .eq('user_id', params.userId);
                if (error) {
                    console.error('[UserEnvironment] Assign error:', error);
                    return false;
                }
            } else {
                const { error } = await supabase
                    .from('user_roles')
                    .insert({ user_id: params.userId, role: appRole as any });
                if (error) {
                    console.error('[UserEnvironment] Assign error:', error);
                    return false;
                }
            }

            this.cache.delete(params.userId);
            return true;
        } catch (error) {
            console.error('[UserEnvironment] Assign error:', error);
            return false;
        }
    }

    async deactivateEnvironment(userId: string, _environmentId: string): Promise<boolean> {
        try {
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                return false;
            }

            // For legacy system, we remove the user role
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .eq('user_id', userId);

            if (error) return false;

            this.cache.delete(userId);
            return true;
        } catch (error) {
            return false;
        }
    }

    async listAllEnvironments(_options?: {
        environment?: UserEnvironment;
        organizationId?: string;
        isActive?: boolean;
    }): Promise<UserEnvironmentAssignment[]> {
        try {
            const isSuperAdmin = await this.isSuperAdmin();
            if (!isSuperAdmin) {
                return [];
            }

            // For legacy system, we return mapped user_roles
            const { data, error } = await supabase
                .from('user_roles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) return [];

            return (data || []).map(this.mapLegacyToAssignment);
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

    private mapLegacyToAssignment(data: any): UserEnvironmentAssignment {
        let environment = UserEnvironment.PUBLIC_USER;
        let backofficeRole: BackOfficeRole | undefined;
        let municipalRole: MunicipalStaffRole | undefined;
        let publicRole: PublicUserRole | undefined;

        switch (data.role) {
            case 'super_admin':
                environment = UserEnvironment.BACK_OFFICE;
                backofficeRole = BackOfficeRole.SUPER_ADMIN;
                break;
            case 'admin':
                environment = UserEnvironment.MUNICIPAL_STAFF;
                municipalRole = MunicipalStaffRole.MAIRE;
                break;
            case 'agent':
                environment = UserEnvironment.MUNICIPAL_STAFF;
                municipalRole = MunicipalStaffRole.AGENT_MUNICIPAL;
                break;
            default:
                environment = UserEnvironment.PUBLIC_USER;
                publicRole = PublicUserRole.CITOYEN;
        }

        return {
            id: data.id,
            userId: data.user_id,
            environment,
            backofficeRole,
            municipalRole,
            publicRole,
            isActive: true,
            validFrom: data.created_at,
            createdAt: data.created_at,
            updatedAt: data.created_at
        };
    }

    clearCache(userId?: string): void {
        if (userId) {
            this.cache.delete(userId);
        } else {
            this.cache.clear();
        }
    }

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
