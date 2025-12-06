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
    created_at: string;
    updated_at: string;
    organization?: {
        name: string;
        settings?: any;
    };
}

export const MOCK_PROFILES: MockProfile[] = [
    {
        id: "user-1",
        user_id: "user-1-uuid",
        first_name: "Jean-Pierre",
        last_name: "Ondo Mba",
        email: "jp.ondomba@mairie-libreville.ga",
        role: "maire",
        organization_id: "mairie-libreville",
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
        organization_id: "mairie-libreville",
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
        email: "paul.moussavou@gmail.com",
        role: "citizen",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];
