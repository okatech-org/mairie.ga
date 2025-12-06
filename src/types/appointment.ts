import { Tables } from "@/integrations/supabase/types";

// Types basés sur Supabase avec extensions
export type Appointment = Tables<"appointments"> & {
    service?: { name: string; category: string };
    organization?: { name: string };
    profile?: { first_name: string; last_name: string; email: string; phone?: string };
};

export type AppointmentStatus = Appointment["status"];

// Object pour compatibilité avec les valeurs (utilisé comme enum)
export const AppointmentStatusEnum = {
    SCHEDULED: 'SCHEDULED' as const,
    CONFIRMED: 'CONFIRMED' as const,
    COMPLETED: 'COMPLETED' as const,
    CANCELLED: 'CANCELLED' as const,
    NO_SHOW: 'NO_SHOW' as const
};

// Alias pour compatibilité
export const AppointmentStatus = AppointmentStatusEnum;
