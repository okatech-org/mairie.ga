import { supabase } from "@/integrations/supabase/client";
import { Appointment, AppointmentStatus } from "@/types/appointment";

export const appointmentService = {
    async getAll(filters?: { organizationId?: string; profileId?: string; date?: string }): Promise<Appointment[]> {
        let query = supabase
            .from('appointments')
            .select(`
                *,
                service:consular_services(name, type),
                profile:profiles(first_name, last_name, email, phone),
                organization:organizations(name)
            `)
            .order('date', { ascending: true });

        if (filters?.organizationId) {
            query = query.eq('organization_id', filters.organizationId);
        }
        if (filters?.profileId) {
            query = query.eq('profile_id', filters.profileId);
        }
        if (filters?.date) {
            // Assuming date is YYYY-MM-DD, we filter for that day
            const startOfDay = `${filters.date}T00:00:00`;
            const endOfDay = `${filters.date}T23:59:59`;
            query = query.gte('date', startOfDay).lte('date', endOfDay);
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
                service:consular_services(name, type),
                profile:profiles(first_name, last_name, email, phone),
                organization:organizations(name)
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data as unknown as Appointment;
    },

    async create(appointment: Omit<Appointment, 'id' | 'created_at' | 'updated_at' | 'service' | 'profile' | 'organization'>): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert(appointment)
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
            .update(updates)
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
