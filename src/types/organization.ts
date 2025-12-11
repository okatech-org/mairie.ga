// Types pour les mairies gabonaises
export enum OrganizationType {
    MAIRIE_CENTRALE = 'MAIRIE_CENTRALE',
    MAIRIE_ARRONDISSEMENT = 'MAIRIE_ARRONDISSEMENT',
    MAIRIE_COMMUNE = 'MAIRIE_COMMUNE',
    COMMUNAUTE_URBAINE = 'COMMUNAUTE_URBAINE',
    PREFECTURE = 'PREFECTURE',
    MINISTERE = 'MINISTERE',
    // Legacy pour compatibilité DB
    CONSULAT_GENERAL = 'CONSULAT_GENERAL',
    CONSULAT = 'CONSULAT',
    AMBASSADE = 'AMBASSADE',
    HAUT_COMMISSARIAT = 'HAUT_COMMISSARIAT',
    MISSION_PERMANENTE = 'MISSION_PERMANENTE',
    CONSULAT_HONORAIRE = 'CONSULAT_HONORAIRE'
}

export enum OrganizationStatus {
    ACTIVE = 'ACTIVE',
    INACTIVE = 'INACTIVE',
    SUSPENDED = 'SUSPENDED'
}

export interface OrganizationMetadata {
    jurisdiction?: string[];
    contact?: { address: string; phone: string; email: string; website?: string; };
    hours?: { [day: string]: { open: string; close: string; isOpen: boolean }; };
    city?: string;
    country?: string;
    countryCode?: string;
}

export interface CountrySettings {
    contact: {
        address: string;
        phone: string;
        email: string;
        website?: string;
    };
    hours: {
        [day: string]: { open: string; close: string; isOpen: boolean };
    };
    resources?: Record<string, any>;
}

export interface Organization {
    id: string;
    name: string;
    type: OrganizationType | string;
    city?: string | null;
    country?: string | null;
    country_code?: string | null;
    countryCode?: string | null;
    jurisdiction?: string[];
    enabled_services?: string[] | null;
    enabledServices?: string[] | null;
    settings?: any | null;
    metadata?: OrganizationMetadata;
    province?: string | null;
    departement?: string | null;
    population?: number | null;
    maire_name?: string | null;
    contact_email?: string | null;
    contact_phone?: string | null;
    address?: string | null;
    website?: string | null;
    logo_url?: string | null;
    isActive?: boolean;
    latitude?: number | null;
    longitude?: number | null;
    created_at?: string;
    updated_at?: string;
}

export const COUNTRY_FLAGS: Record<string, string> = {
    'FR': '🇫🇷', 'GA': '🇬🇦', 'US': '🇺🇸', 'GB': '🇬🇧', 'CN': '🇨🇳',
    'DE': '🇩🇪', 'ES': '🇪🇸', 'IT': '🇮🇹', 'MA': '🇲🇦', 'SN': '🇸🇳',
    'MC': '🇲🇨', 'PT': '🇵🇹', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BE': '🇧🇪',
    'CH': '🇨🇭', 'AE': '🇦🇪', 'SA': '🇸🇦', 'JP': '🇯🇵', 'KR': '🇰🇷',
    'BR': '🇧🇷', 'ZA': '🇿🇦', 'NG': '🇳🇬', 'CM': '🇨🇲', 'CG': '🇨🇬',
    'CD': '🇨🇩', 'GQ': '🇬🇶', 'RU': '🇷🇺', 'IN': '🇮🇳', 'AU': '🇦🇺'
};

export const PROVINCES_GABON = [
    'Estuaire', 'Haut-Ogooué', 'Moyen-Ogooué', 'Ngounié',
    'Nyanga', 'Ogooué-Ivindo', 'Ogooué-Lolo', 'Ogooué-Maritime', 'Woleu-Ntem'
];

// Compatibility exports
export { OrganizationType as EntityType };
export type { Organization as Entity };
