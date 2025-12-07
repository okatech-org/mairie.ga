import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Types basés sur la table requests de Supabase
export type Request = Tables<"requests">;
export type RequestStatus = Request["status"];
export type RequestType = Request["type"];
export type RequestPriority = Request["priority"];

export const requestService = {
    async getAll(citizenId?: string): Promise<Request[]> {
        let query = supabase
            .from('requests')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .order('created_at', { ascending: false });

        if (citizenId) {
            query = query.eq('citizen_id', citizenId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as unknown as Request[];
    },

    async getById(id: string): Promise<Request | null> {
        const { data, error } = await supabase
            .from('requests')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Request;
    },

    async create(request: Omit<Request, 'id' | 'created_at' | 'updated_at'>): Promise<Request> {
        const { data, error } = await supabase
            .from('requests')
            .insert(request as any)
            .select()
            .single();

        if (error) throw error;
        return data as Request;
    },

    async updateStatus(id: string, status: RequestStatus): Promise<Request> {
        const { data, error } = await supabase
            .from('requests')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Request;
    },

    async update(id: string, updates: Partial<Request>): Promise<Request> {
        const { data, error } = await supabase
            .from('requests')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Request;
    },

    async getStats(userId: string) {
        const { data, error } = await supabase
            .from('requests')
            .select('status, id')
            .eq('citizen_id', userId);

        if (error) throw error;

        const total = data.length;
        const pending = data.filter(r => r.status === 'PENDING').length;
        const inProgress = data.filter(r => r.status === 'IN_PROGRESS').length;
        const completed = data.filter(r => r.status === 'COMPLETED' || r.status === 'VALIDATED').length;
        const rejected = data.filter(r => r.status === 'REJECTED').length;

        return { total, pending, inProgress, completed, rejected };
    }
};
