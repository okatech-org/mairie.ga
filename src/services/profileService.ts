import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

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

import { organizationService } from "./organizationService";
import { MOCK_PROFILES } from "@/data/mock-profiles";

export const profileService = {
    async getAll(): Promise<ProfileWithRole[]> {
        // 1. Récupérer les profils
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        // Use mocks if DB is empty
        if (!profiles || profiles.length === 0) {
            console.log("📦 [Profiles] Using mock data (Generated Staff)");
            return MOCK_PROFILES as unknown as ProfileWithRole[];
        }

        // 2. Récupérer les rôles
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

        if (rolesError) throw rolesError;

        // 3. Récupérer les organisations pour le mapping
        const organizations = await organizationService.getAll();
        const orgMap = new Map(organizations.map(o => [o.id, o]));
        // Fallback: Map by name if ID doesn't match
        const orgNameMap = new Map(organizations.map(o => [o.name, o]));

        // 4. Mapper les données
        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);

        return (profiles || []).map(p => {
            // Tentative de liaison avec l'organisation via le champ 'employer' (ID ou Nom)
            // ou via 'organization_id' si présent dans le type (pour compatibilité mock)
            const orgIdOrName = p.employer || (p as any).organization_id;
            let organization = orgMap.get(orgIdOrName) || orgNameMap.get(orgIdOrName);

            // Si pas trouvé, et que c'est un mock ID, essayer de nettoyer
            if (!organization && orgIdOrName?.startsWith('mock-')) {
                organization = orgMap.get(orgIdOrName);
            }

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

        if (error) throw error;

        // Enrichir avec rôle et org (simplifié ici, pourrait être factorisé)
        // Pour l'instant on retourne juste le profil de base + role via autre appel si besoin
        // Mais pour SuperAdminUsers on utilise surtout getAll()
        return data as unknown as ProfileWithRole;
    },

    async getByUserId(userId: string): Promise<ProfileWithRole | null> {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) throw error;

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
        // Reuse getAll logic for now as it handles the enrichment
        // In a real optimized scenario, we would filter at DB level + join
        const allProfiles = await this.getAll();

        return allProfiles.filter(p => {
            // Check direct match
            if (p.organization_id === organizationId) return true;
            // Check employer match (alias)
            if (p.employer === organizationId) return true;
            // Check if it's a mock ID pattern match (e.g. 'mock-1' matches 'mairie-libreville')
            // For this specific MVP data set, we rely on the enriched 'organization' object having the right name/id
            // But simpler is to rely on our previous mapping in getAll
            return p.organization_id === organizationId || p.employer === organizationId;
        });
    },

    async update(id: string, updates: Partial<ProfileWithRole>): Promise<Profile> {
        // Check for mock ID or if we are likely in demo mode for this user
        if (id.startsWith('user-') || id.startsWith('mock-') || id.startsWith('temp-')) {
            console.log("📦 [Profiles] Simulating UPDATE for mock user:", id, updates);
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                id,
                ...updates,
                updated_at: new Date().toISOString()
            } as any;
        }

        // Extraire le rôle et l'organisation si présents
        const { role, organization, ...profileUpdates } = updates as any;

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

        if (error) throw error;

        // Mettre à jour le rôle si fourni
        if (role) {
            const profile = data as any;
            await supabase
                .from('user_roles')
                .upsert({ user_id: profile.user_id, role } as any)
                .select();
        }

        return data as Profile;
    },

    async updateByUserId(userId: string, updates: Partial<Profile>): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    // Simulation de création pour l'UI Super Admin
    async create(profileData: any): Promise<ProfileWithRole> {
        // Dans une vraie app, cela appellerait une Edge Function pour inviter l'utilisateur
        // ou utiliserait supabase.auth.admin.createUser
        console.log("Simulating user creation:", profileData);

        // On retourne un objet mocké qui ressemble à ce qu'on a créé pour l'UI
        return {
            id: `temp-${Date.now()}`,
            user_id: `temp-user-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            first_name: profileData.name.split(' ')[0] || '',
            last_name: profileData.name.split(' ').slice(1).join(' ') || '',
            email: profileData.email,
            employer: profileData.entityId,
            role: profileData.role,
            // ... autres champs
        } as unknown as ProfileWithRole;
    }
};
