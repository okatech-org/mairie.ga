import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { mairiesGabon, provinces } from "@/data/mock-mairies-gabon";

// Types basés sur la table organizations de Supabase
export type Organization = Tables<"organizations">;
export type OrganizationType = Organization["type"];

// Convertir les données mock en format Organization
const getMockOrganizations = (): Organization[] => {
    return mairiesGabon.map((mairie) => {
        const province = provinces.find(p => p.name === mairie.province);
        return {
            id: `mock-${mairie.id}`,
            name: mairie.name,
            type: mairie.isCapitalProvince ? 'MAIRIE_CENTRALE' : 'MAIRIE_ARRONDISSEMENT',
            metadata: {
                city: mairie.departement,
                country: 'Gabon',
                province: mairie.province,
                population: mairie.population,
                coordinates: mairie.coordinates,
                isCapitalProvince: mairie.isCapitalProvince,
                jurisdiction: [mairie.province],
                color: province?.color || '#009e49'
            },
            parent_id: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as Organization;
    });
};

export const organizationService = {
    async getAll(): Promise<Organization[]> {
        try {
            const { data, error } = await supabase
                .from('organizations')
                .select('*')
                .order('name');

            if (error) throw error;

            // Si pas de données en base, utiliser les données mock
            if (!data || data.length === 0) {
                console.log('📦 [Organizations] Using mock data (52 municipalities from Gabon)');
                return getMockOrganizations();
            }

            return data as Organization[];
        } catch (error) {
            console.error('Failed to fetch organizations, using mock data:', error);
            return getMockOrganizations();
        }
    },

    async getById(id: string): Promise<Organization | null> {
        // Check if it's a mock ID
        if (id.startsWith('mock-')) {
            const mockId = id.replace('mock-', '');
            const mairie = mairiesGabon.find(m => m.id === mockId);
            if (mairie) {
                const province = provinces.find(p => p.name === mairie.province);
                return {
                    id: `mock-${mairie.id}`,
                    name: mairie.name,
                    type: mairie.isCapitalProvince ? 'MAIRIE_CENTRALE' : 'MAIRIE_ARRONDISSEMENT',
                    metadata: {
                        city: mairie.departement,
                        country: 'Gabon',
                        province: mairie.province,
                        population: mairie.population,
                        coordinates: mairie.coordinates,
                        isCapitalProvince: mairie.isCapitalProvince,
                        jurisdiction: [mairie.province],
                        color: province?.color || '#009e49'
                    },
                    parent_id: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                } as Organization;
            }
            return null;
        }

        const { data, error } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
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
