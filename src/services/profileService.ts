import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { organizationService } from "./organizationService";
import { invokeWithDemoFallback } from "@/utils/demoMode";
import { auditService } from "@/services/audit-service";

// Types basés sur la table profiles de Supabase avec extensions
export type Profile = Tables<"profiles"> & {
    role?: string;
    organization?: {
        name: string;
        settings?: any;
        metadata?: {
            city?: string;
            country?: string;
            countryCode?: string;
        };
    };
};

export interface ProfileWithRole extends Profile {
    role?: string;
    organization?: {
        name: string;
        settings: any;
        metadata?: any;
    };
}

export const profileService = {
    async getAll(): Promise<ProfileWithRole[]> {
        // 1. Récupérer les profils
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) {
            console.error('Failed to fetch profiles:', profileError);
            throw new Error(`Erreur lors du chargement des profils: ${profileError.message}`);
        }

        if (!profiles || profiles.length === 0) {
            return [];
        }

        // 2. Récupérer les rôles
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

        if (rolesError) {
            console.error('Failed to fetch roles:', rolesError);
            throw new Error(`Erreur lors du chargement des rôles: ${rolesError.message}`);
        }

        // 3. Récupérer les organisations pour le mapping
        let organizations: any[] = [];
        try {
            organizations = await organizationService.getAll();
        } catch (err) {
            console.warn('Could not fetch organizations for profile enrichment:', err);
        }

        const orgMap = new Map(organizations.map(o => [o.id, o]));
        const orgNameMap = new Map(organizations.map(o => [o.name, o]));

        // 4. Mapper les données
        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

        return (profiles || []).map(p => {
            const orgIdOrName = p.employer;
            let organization = orgMap.get(orgIdOrName) || orgNameMap.get(orgIdOrName);

            return {
                ...p,
                role: roleMap.get(p.user_id) || 'citizen',
                organization: organization ? {
                    name: organization.name,
                    settings: organization.settings,
                    metadata: (organization as any).metadata || {}
                } : undefined
            };
        }) as unknown as ProfileWithRole[];
    },

    async getById(id: string): Promise<ProfileWithRole | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch profile:', error);
            return null;
        }

        return data as unknown as ProfileWithRole;
    },

    async getByUserId(userId: string): Promise<ProfileWithRole | null> {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            console.error('Failed to fetch profile by user_id:', error);
            return null;
        }

        // Récupérer le rôle
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .single();

        return {
            ...profile,
            role: roleData?.role || 'citizen'
        } as unknown as ProfileWithRole;
    },

    async getByOrganizationId(organizationId: string): Promise<ProfileWithRole[]> {
        const allProfiles = await this.getAll();
        return allProfiles.filter(p => p.employer === organizationId);
    },

    async update(id: string, updates: Partial<ProfileWithRole>): Promise<Profile> {
        // Extraire le rôle et l'organisation si présents
        const { role, organization, ...profileUpdates } = updates as any;

        // Get current data before update for audit
        const { data: currentData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        // Si entityId/employer est passé, on le met dans employer
        if ((updates as any).entityId) {
            profileUpdates.employer = (updates as any).entityId;
        }

        const { data, error } = await supabase
            .from('profiles')
            .update(profileUpdates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Failed to update profile:', error);
            throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
        }

        // Mettre à jour le rôle si fourni
        if (role) {
            const profile = data as any;
            await supabase
                .from('user_roles')
                .upsert({ user_id: profile.user_id, role } as any)
                .select();
        }

        // Log audit
        await auditService.logUpdate('profile', id, 
            currentData || {}, 
            profileUpdates as Record<string, unknown>
        );

        return data as Profile;
    },

    async updateByUserId(userId: string, updates: Partial<Profile>): Promise<Profile> {
        // Get current data before update for audit
        const { data: currentData } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        const { data, error } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('Failed to update profile:', error);
            throw new Error(`Erreur lors de la mise à jour du profil: ${error.message}`);
        }

        // Log audit
        await auditService.logUpdate('profile', data.id, 
            currentData || {}, 
            updates as Record<string, unknown>
        );

        return data as Profile;
    },

    // Create a new user profile (requires admin privileges via Edge Function)
    async create(profileData: {
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        organizationId?: string;
    }): Promise<ProfileWithRole> {
        // Call Edge Function with demo fallback
        const { data, error, isDemo } = await invokeWithDemoFallback<ProfileWithRole>(
            'create-user',
            {
                email: profileData.email,
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                role: profileData.role,
                organization_id: profileData.organizationId
            }
        );

        if (error) {
            console.error('Failed to create user:', error);
            throw new Error(`Erreur lors de la création de l'utilisateur: ${error.message}`);
        }

        if (isDemo) {
            console.log('[ProfileService] Demo mode - returning simulated user creation');
            // Return a more complete mock profile for demo mode
            return {
                id: crypto.randomUUID(),
                user_id: crypto.randomUUID(),
                first_name: profileData.firstName,
                last_name: profileData.lastName,
                email: profileData.email,
                role: profileData.role,
                employer: profileData.organizationId || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            } as unknown as ProfileWithRole;
        }

        console.log('[ProfileService] User created:', data);
        return data as ProfileWithRole;
    }
};
