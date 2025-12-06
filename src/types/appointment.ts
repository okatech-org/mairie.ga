export enum AppointmentStatus {
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED',
    NO_SHOW = 'NO_SHOW'
}

export interface Appointment {
    id: string;
    profile_id: string;
    service_id: string;
    organization_id: string;
    date: string; // ISO timestamp
    status: AppointmentStatus;
    notes?: string;
    created_at: string;
    updated_at: string;

    // Joined fields (optional)
    service?: {
        name: string;
        type: string;
    };
    profile?: {
        first_name: string;
        last_name: string;
        email: string;
        phone?: string;
    };
    organization?: {
        name: string;
    };
}
