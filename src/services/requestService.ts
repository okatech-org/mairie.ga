import { supabase } from "@/integrations/supabase/client";
import { ServiceRequest, RequestStatus } from "@/types/request";

export const requestService = {
    async getAll(profileId?: string): Promise<ServiceRequest[]> {
        let query = supabase
            .from('service_requests')
            .select(`
                *,
                service:consular_services(name),
                profile:profiles(first_name, last_name, email)
            `)
            .order('created_at', { ascending: false });

        if (profileId) {
            query = query.eq('profile_id', profileId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as unknown as ServiceRequest[];
    },

    async getById(id: string): Promise<ServiceRequest | null> {
        const { data, error } = await supabase
            .from('service_requests')
            .select(`
                *,
                service:consular_services(name),
                profile:profiles(first_name, last_name, email)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as ServiceRequest;
    },

    async create(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at' | 'service' | 'profile'>): Promise<ServiceRequest> {
        const { data, error } = await supabase
            .from('service_requests')
            .insert(request)
            .select()
            .single();

        if (error) throw error;
        return data as ServiceRequest;
    },

    async updateStatus(id: string, status: RequestStatus): Promise<ServiceRequest> {
        const { data, error } = await supabase
            .from('service_requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ServiceRequest;
    },

    async updateData(id: string, requestData: Record<string, any>): Promise<ServiceRequest> {
        const { data, error } = await supabase
            .from('service_requests')
            .update({ data: requestData })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as ServiceRequest;
    }
};
