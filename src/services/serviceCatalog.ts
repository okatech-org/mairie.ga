import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { MUNICIPAL_SERVICE_CATALOG } from "@/types/municipal-services";

// Utiliser la table services au lieu de consular_services
export type Service = Tables<"services">;

// Fallback Mock Data for Demo
const MOCK_SERVICES = Object.values(MUNICIPAL_SERVICE_CATALOG).map(s => ({
    id: s.id,
    name: s.name,
    description: s.description,
    price: s.price,
    currency: 'FCFA',
    is_active: true,
    requirements: s.requiredDocuments,
    processing_time: `${s.processingDays} jours`,
    organization_id: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
}));

export const serviceCatalog = {
    async getAll(organizationId?: string): Promise<Service[]> {
        // Return Mock Data for the Demo
        return MOCK_SERVICES as any[];

        /* 
        // Original Supabase Implementation
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
        */
    },

    async getById(id: string): Promise<Service | null> {
        const mock = MOCK_SERVICES.find(s => s.id === id);
        if (mock) return mock as any;

        const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as Service;
    },

    async create(service: Omit<Service, 'id' | 'created_at' | 'updated_at'>): Promise<Service> {
        // Mock creation
        console.log("Mock Create Service:", service);
        return {
            ...service,
            id: `mock-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Service;

        /*
        const { data, error } = await supabase
            .from('services')
            .insert(service as any)
            .select()
            .single();

        if (error) throw error;
        return data as Service;
        */
    },

    async update(id: string, updates: Partial<Service>): Promise<Service> {
        console.log("Mock Update Service:", id, updates);
        return {
            id,
            ...updates,
            updated_at: new Date().toISOString()
        } as any;

        /*
        const { data, error } = await supabase
            .from('services')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Service;
        */
    },

    async delete(id: string): Promise<void> {
        console.log("Mock Delete Service:", id);
        return;

        /*
        const { error } = await supabase
            .from('services')
            .delete()
            .eq('id', id);

        if (error) throw error;
        */
    }
};

// Alias pour compatibilité
export type ConsularService = Service;
