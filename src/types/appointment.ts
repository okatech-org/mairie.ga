import { Tables } from "@/integrations/supabase/types";

// Types basés sur Supabase
export type Appointment = Tables<"appointments"> & {
    service?: { name: string; category: string };
    organization?: { name: string };
    profile?: { first_name: string; last_name: string; email: string; phone?: string };
};

export type AppointmentStatus = Appointment["status"];

// Enum pour compatibilité legacy
export const AppointmentStatusEnum = {
    SCHEDULED: 'SCHEDULED',
    CONFIRMED: 'CONFIRMED',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW'
} as const;
