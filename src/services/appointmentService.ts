import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

// Types basés sur la table appointments de Supabase
export type Appointment = Tables<"appointments">;
export type AppointmentStatus = Appointment["status"];

export const appointmentService = {
    async getAll(filters?: { organizationId?: string; citizenId?: string; date?: string }): Promise<Appointment[]> {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .order('appointment_date', { ascending: true });

        if (filters?.organizationId) {
            query = query.eq('organization_id', filters.organizationId);
        }
        if (filters?.citizenId) {
            query = query.eq('citizen_id', filters.citizenId);
        }
        if (filters?.date) {
            const startOfDay = `${filters.date}T00:00:00`;
            const endOfDay = `${filters.date}T23:59:59`;
            query = query.gte('appointment_date', startOfDay).lte('appointment_date', endOfDay);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data as unknown as Appointment[];
    },

    async getById(id: string): Promise<Appointment | null> {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                service:services(name, category),
                organization:organizations(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Appointment;
    },

    async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment as any)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    async update(id: string, updates: Partial<Appointment>): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .update(updates as any)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data as Appointment;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};
