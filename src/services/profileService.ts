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

export const profileService = {
    async getAll(): Promise<ProfileWithRole[]> {
        // D'abord récupérer les profils
        const { data: profiles, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (profileError) throw profileError;

        // Ensuite récupérer les rôles
        const { data: roles, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

        if (rolesError) throw rolesError;

        // Mapper les rôles sur les profils
        const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
        
        return (profiles || []).map(p => ({
            ...p,
            role: roleMap.get(p.user_id) || 'citizen'
        })) as unknown as ProfileWithRole[];
    },

    async getById(id: string): Promise<ProfileWithRole | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
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

    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
        // Extraire le rôle si présent
        const { role, ...profileUpdates } = updates as any;

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
    }
};
