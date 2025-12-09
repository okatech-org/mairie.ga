import { mairiesGabon } from "./mock-mairies-gabon";
import { MunicipalRole } from "@/types/municipal-roles";

// Profils mock pour les mairies gabonaises
export interface MockProfile {
    id: string;
    user_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: string;
    organization_id?: string;
    employer?: string; // Alias for organization_id
    created_at: string;
    updated_at: string;
    organization?: {
        name: string;
        settings?: any;
    };
}

// Generate default staff for a mairie
const generateMairieStaff = (mairie: typeof mairiesGabon[0]): MockProfile[] => {
    const provinceCode = mairie.province.substring(0, 3).toUpperCase();
    const cityCode = mairie.name.replace('Mairie de ', '').substring(0, 3).toUpperCase();
    const baseId = `${provinceCode}-${cityCode}`;
    const domain = `${mairie.name.toLowerCase().replace(/['\s]/g, '-').replace('mairie-de-', '')}.ga`;

    // 1. Le Maire (Admin)
    const maire: MockProfile = {
        id: `user-${baseId}-MAIRE`,
        user_id: `auth-${baseId}-MAIRE`,
        first_name: "Monsieur le Maire",
        last_name: `de ${mairie.departement}`,
        email: `maire@${domain}`,
        role: MunicipalRole.MAIRE,
        organization_id: `mock-${mairie.id}`,
        employer: `mock-${mairie.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: { name: mairie.name }
    };

    // 2. Secrétaire Général
    const sg: MockProfile = {
        id: `user-${baseId}-SG`,
        user_id: `auth-${baseId}-SG`,
        first_name: "Secrétaire",
        last_name: "Général",
        email: `sg@${domain}`,
        role: MunicipalRole.SECRETAIRE_GENERAL,
        organization_id: `mock-${mairie.id}`,
        employer: `mock-${mairie.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: { name: mairie.name }
    };

    // 3. Chef de Service État Civil
    const chefF: MockProfile = {
        id: `user-${baseId}-CHEF`,
        user_id: `auth-${baseId}-CHEF`,
        first_name: "Chef",
        last_name: "Service État Civil",
        email: `etat-civil@${domain}`,
        role: MunicipalRole.CHEF_SERVICE,
        organization_id: `mock-${mairie.id}`,
        employer: `mock-${mairie.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: { name: mairie.name }
    };

    // 4. Agent d'Accueil
    const agent: MockProfile = {
        id: `user-${baseId}-AGENT`,
        user_id: `auth-${baseId}-AGENT`,
        first_name: "Agent",
        last_name: "Accueil",
        email: `accueil@${domain}`,
        role: MunicipalRole.AGENT_ACCUEIL,
        organization_id: `mock-${mairie.id}`,
        employer: `mock-${mairie.id}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: { name: mairie.name }
    };

    return [maire, sg, chefF, agent];
};

// Generate all profiles
const ALL_GENERATED_PROFILES = mairiesGabon.flatMap(generateMairieStaff);

export const MOCK_PROFILES: MockProfile[] = [
    {
        id: "user-1",
        user_id: "user-1-uuid",
        first_name: "Jean-Pierre",
        last_name: "Ondo Mba",
        email: "jp.ondomba@mairie-libreville.ga",
        role: "maire",
        organization_id: "mock-1", // Fixed ID to match mock-mairies
        employer: "mock-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: {
            name: "Mairie de Libreville"
        }
    },
    {
        id: "user-2",
        user_id: "user-2-uuid",
        first_name: "Marie",
        last_name: "Ndong",
        email: "m.ndong@mairie-libreville.ga",
        role: "agent_municipal",
        organization_id: "mock-1",
        employer: "mock-1",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        organization: {
            name: "Mairie de Libreville"
        }
    },
    {
        id: "user-3",
        user_id: "user-3-uuid",
        first_name: "Paul",
        last_name: "Moussavou",
        email: "paul_moussavou@mairie.ga",
        role: "citizen",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    ...ALL_GENERATED_PROFILES
];
