import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Types basés sur la table organizations de Supabase
export type Organization = Tables<"organizations">;
export type OrganizationType = Organization["type"];

export const organizationService = {
    async getAll(): Promise<Organization[]> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .order('name');

        if (error) {
            console.error('Failed to fetch organizations:', error);
            throw new Error(`Erreur lors du chargement des organisations: ${error.message}`);
        }

        return data as Organization[];
    },

    async getById(id: string): Promise<Organization | null> {
        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Failed to fetch organization:', error);
            return null;
        }
        return data as Organization;
    },

    async create(organization: Omit<Organization, 'id' | 'created_at' | 'updated_at'>): Promise<Organization> {
        const { data, error } = await supabase
            .from('organizations')
            .insert(organization as any)
            .select()
            .single();

        if (error) throw error;
        return data as Organization;
    },

    async update(id: string, updates: Partial<Organization>): Promise<Organization> {
        const { data, error } = await supabase
            .from('organizations')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Organization;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('organizations')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
