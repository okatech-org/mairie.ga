import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Utiliser la table services au lieu de consular_services
export type Service = Tables<"services">;

export const serviceCatalog = {
    async getAll(organizationId?: string): Promise<Service[]> {
        let query = supabase
            .from('services')
            .select('*')
            .order('name');

        if (organizationId) {
            query = query.eq('organization_id', organizationId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as Service[];
    },

    async getById(id: string): Promise<Service | null> {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Service;
    },

    async create(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
        const { data, error } = await supabase
            .from('services')
            .insert(service as any)
            .select()
            .single();

        if (error) throw error;
        return data as Service;
    },

    async update(id: string, updates: Partial<Service>): Promise<Service> {
        const { data, error } = await supabase
            .from('services')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Service;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Alias pour compatibilité
export type ConsularService = Service;
