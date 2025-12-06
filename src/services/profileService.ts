import { supabase } from "@/integrations/supabase/client";

export interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    role: string; // 'super_admin', 'admin', 'agent', 'citizen'
    organization_id?: string;
    phone?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;

    // Joined fields
    organization?: {
        name: string;
        metadata: any; // JSONB
    };
}

export const profileService = {
    async getAll(): Promise<Profile[]> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                organization:organizations(name, metadata)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as unknown as Profile[];
    },

    async getById(id: string): Promise<Profile | null> {
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                organization:organizations(name, metadata)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Profile;
    },

    async update(id: string, updates: Partial<Profile>): Promise<Profile> {
        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Profile;
    },

    // Note: Creating profiles usually happens via Auth signup triggers, 
    // but admins might create agent accounts. 
    // For now, we'll assume profile creation is handled by Auth or a separate admin function that creates auth user + profile.
    // We can add a create method if we have an Edge Function to create users.
};
