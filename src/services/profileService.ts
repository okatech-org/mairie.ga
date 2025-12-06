import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Types basés sur la table profiles de Supabase
export type Profile = Tables<"profiles">;

export interface ProfileWithRole extends Profile {
    role?: string;
    organization?: {
        name: string;
        settings: any;
    };
}

export const profileService = {
    async getAll(): Promise<ProfileWithRole[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                organization:organizations(name, settings)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as ProfileWithRole[];
    },

    async getById(id: string): Promise<ProfileWithRole | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                organization:organizations(name, settings)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as ProfileWithRole;
    },

    async getByUserId(userId: string): Promise<ProfileWithRole | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                organization:organizations(name, settings)
            `)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        return data as unknown as ProfileWithRole;
    },

    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
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
