import { Organization, OrganizationType } from '@/types/organization';

// Réseau des Mairies du Gabon par Province
export const MAIRIES_GABON: Organization[] = [
    // ========== ESTUAIRE ==========
    {
        id: 'estuaire-libreville-centrale',
        name: 'Mairie Centrale de Libreville',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Libreville', 'Estuaire'],
        population: 850000,
        maire_name: 'M. le Maire de Libreville',
        contact_email: 'mairie.libreville@gabon.ga',
        contact_phone: '+241 01 72 00 00',
        address: 'Boulevard Triomphal Omar Bongo, Libreville',
        website: 'https://libreville.ga',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'ACTE_DECES', 'PERMIS_CONSTRUIRE', 'PATENTE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-1er',
        name: 'Mairie du 1er Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['1er Arrondissement', 'Nombakélé', 'Louis'],
        population: 120000,
        maire_name: 'M. le Maire du 1er',
        contact_email: 'mairie.1er@libreville.ga',
        contact_phone: '+241 01 72 01 01',
        address: 'Quartier Louis, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-2eme',
        name: 'Mairie du 2ème Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['2ème Arrondissement', 'Akébé', 'Nzeng-Ayong'],
        population: 180000,
        maire_name: 'M. le Maire du 2ème',
        contact_email: 'mairie.2eme@libreville.ga',
        contact_phone: '+241 01 72 02 02',
        address: 'Nzeng-Ayong, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-3eme',
        name: 'Mairie du 3ème Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['3ème Arrondissement', 'Mindoubé', 'Alibandeng'],
        population: 150000,
        maire_name: 'M. le Maire du 3ème',
        contact_email: 'mairie.3eme@libreville.ga',
        contact_phone: '+241 01 72 03 03',
        address: 'Mindoubé, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-4eme',
        name: 'Mairie du 4ème Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['4ème Arrondissement', 'Lalala', 'Sibang'],
        population: 140000,
        maire_name: 'M. le Maire du 4ème',
        contact_email: 'mairie.4eme@libreville.ga',
        contact_phone: '+241 01 72 04 04',
        address: 'Lalala, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-5eme',
        name: 'Mairie du 5ème Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['5ème Arrondissement', 'Pk', 'Ntoum'],
        population: 160000,
        maire_name: 'M. le Maire du 5ème',
        contact_email: 'mairie.5eme@libreville.ga',
        contact_phone: '+241 01 72 05 05',
        address: 'PK8, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-libreville-6eme',
        name: 'Mairie du 6ème Arrondissement',
        type: OrganizationType.MAIRIE_ARRONDISSEMENT,
        province: 'Estuaire',
        departement: 'Libreville',
        city: 'Libreville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['6ème Arrondissement', 'Owendo'],
        population: 100000,
        maire_name: 'M. le Maire du 6ème',
        contact_email: 'mairie.6eme@libreville.ga',
        contact_phone: '+241 01 72 06 06',
        address: 'Owendo, Libreville',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'LEGALISATION_SIGNATURE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-owendo',
        name: 'Mairie d\'Owendo',
        type: OrganizationType.MAIRIE_COMMUNE,
        province: 'Estuaire',
        departement: 'Komo-Mondah',
        city: 'Owendo',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Owendo', 'Zone Industrielle'],
        population: 80000,
        maire_name: 'M. le Maire d\'Owendo',
        contact_email: 'mairie.owendo@gabon.ga',
        contact_phone: '+241 01 70 50 00',
        address: 'Centre-ville, Owendo',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'PATENTE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'estuaire-ntoum',
        name: 'Mairie de Ntoum',
        type: OrganizationType.MAIRIE_COMMUNE,
        province: 'Estuaire',
        departement: 'Komo-Mondah',
        city: 'Ntoum',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Ntoum', 'Kango'],
        population: 25000,
        maire_name: 'M. le Maire de Ntoum',
        contact_email: 'mairie.ntoum@gabon.ga',
        contact_phone: '+241 01 71 00 00',
        address: 'Centre-ville, Ntoum',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== HAUT-OGOOUÉ ==========
    {
        id: 'haut-ogoue-franceville',
        name: 'Mairie de Franceville',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Haut-Ogooué',
        departement: 'Mpassa',
        city: 'Franceville',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Franceville', 'Mpassa'],
        population: 110000,
        maire_name: 'M. le Maire de Franceville',
        contact_email: 'mairie.franceville@gabon.ga',
        contact_phone: '+241 01 67 70 00',
        address: 'Centre-ville, Franceville',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'PERMIS_CONSTRUIRE', 'PATENTE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'haut-ogoue-moanda',
        name: 'Mairie de Moanda',
        type: OrganizationType.MAIRIE_COMMUNE,
        province: 'Haut-Ogooué',
        departement: 'Lebombi-Leyou',
        city: 'Moanda',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Moanda', 'Mounana'],
        population: 45000,
        maire_name: 'M. le Maire de Moanda',
        contact_email: 'mairie.moanda@gabon.ga',
        contact_phone: '+241 01 66 10 00',
        address: 'Centre-ville, Moanda',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE', 'PATENTE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== MOYEN-OGOOUÉ ==========
    {
        id: 'moyen-ogoue-lambarene',
        name: 'Mairie de Lambaréné',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Moyen-Ogooué',
        departement: 'Ogooué et Lacs',
        city: 'Lambaréné',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Lambaréné', 'Ogooué et Lacs'],
        population: 40000,
        maire_name: 'M. le Maire de Lambaréné',
        contact_email: 'mairie.lambarene@gabon.ga',
        contact_phone: '+241 01 58 10 00',
        address: 'Centre-ville, Lambaréné',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== NGOUNIÉ ==========
    {
        id: 'ngounie-mouila',
        name: 'Mairie de Mouila',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Ngounié',
        departement: 'Douya-Onoye',
        city: 'Mouila',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Mouila', 'Douya-Onoye'],
        population: 30000,
        maire_name: 'M. le Maire de Mouila',
        contact_email: 'mairie.mouila@gabon.ga',
        contact_phone: '+241 01 86 10 00',
        address: 'Centre-ville, Mouila',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== NYANGA ==========
    {
        id: 'nyanga-tchibanga',
        name: 'Mairie de Tchibanga',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Nyanga',
        departement: 'Basse-Banio',
        city: 'Tchibanga',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Tchibanga', 'Basse-Banio'],
        population: 25000,
        maire_name: 'M. le Maire de Tchibanga',
        contact_email: 'mairie.tchibanga@gabon.ga',
        contact_phone: '+241 01 83 10 00',
        address: 'Centre-ville, Tchibanga',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== OGOOUÉ-IVINDO ==========
    {
        id: 'ogoue-ivindo-makokou',
        name: 'Mairie de Makokou',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Ogooué-Ivindo',
        departement: 'Ivindo',
        city: 'Makokou',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Makokou', 'Ivindo'],
        population: 20000,
        maire_name: 'M. le Maire de Makokou',
        contact_email: 'mairie.makokou@gabon.ga',
        contact_phone: '+241 01 66 30 00',
        address: 'Centre-ville, Makokou',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== OGOOUÉ-LOLO ==========
    {
        id: 'ogoue-lolo-koulamoutou',
        name: 'Mairie de Koulamoutou',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Ogooué-Lolo',
        departement: 'Lolo-Bouenguidi',
        city: 'Koulamoutou',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Koulamoutou', 'Lolo-Bouenguidi'],
        population: 20000,
        maire_name: 'M. le Maire de Koulamoutou',
        contact_email: 'mairie.koulamoutou@gabon.ga',
        contact_phone: '+241 01 68 10 00',
        address: 'Centre-ville, Koulamoutou',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== OGOOUÉ-MARITIME ==========
    {
        id: 'ogoue-maritime-port-gentil',
        name: 'Mairie de Port-Gentil',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Ogooué-Maritime',
        departement: 'Bendjé',
        city: 'Port-Gentil',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Port-Gentil', 'Bendjé'],
        population: 150000,
        maire_name: 'M. le Maire de Port-Gentil',
        contact_email: 'mairie.portgentil@gabon.ga',
        contact_phone: '+241 01 55 10 00',
        address: 'Centre-ville, Port-Gentil',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'PERMIS_CONSTRUIRE', 'PATENTE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },

    // ========== WOLEU-NTEM ==========
    {
        id: 'woleu-ntem-oyem',
        name: 'Mairie d\'Oyem',
        type: OrganizationType.MAIRIE_CENTRALE,
        province: 'Woleu-Ntem',
        departement: 'Woleu',
        city: 'Oyem',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Oyem', 'Woleu'],
        population: 60000,
        maire_name: 'M. le Maire d\'Oyem',
        contact_email: 'mairie.oyem@gabon.ga',
        contact_phone: '+241 01 98 60 00',
        address: 'Centre-ville, Oyem',
        enabled_services: ['ACTE_NAISSANCE', 'ACTE_MARIAGE', 'PERMIS_CONSTRUIRE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 'woleu-ntem-bitam',
        name: 'Mairie de Bitam',
        type: OrganizationType.MAIRIE_COMMUNE,
        province: 'Woleu-Ntem',
        departement: 'Ntem',
        city: 'Bitam',
        country: 'Gabon',
        country_code: 'GA',
        jurisdiction: ['Bitam', 'Ntem'],
        population: 15000,
        maire_name: 'M. le Maire de Bitam',
        contact_email: 'mairie.bitam@gabon.ga',
        contact_phone: '+241 01 98 20 00',
        address: 'Centre-ville, Bitam',
        enabled_services: ['ACTE_NAISSANCE', 'CERTIFICAT_RESIDENCE'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Helper functions
export const getMairiesByProvince = (province: string): Organization[] => {
    return MAIRIES_GABON.filter(m => m.province === province);
};

export const getMairieById = (id: string): Organization | undefined => {
    return MAIRIES_GABON.find(m => m.id === id);
};

export const getArrondissementsLibreville = (): Organization[] => {
    return MAIRIES_GABON.filter(m => 
        m.type === OrganizationType.MAIRIE_ARRONDISSEMENT && 
        m.city === 'Libreville'
    );
};

export const getChefLieuxProvinces = (): Organization[] => {
    return MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_CENTRALE);
};

// Statistics
export const getNetworkStats = () => ({
    totalMairies: MAIRIES_GABON.length,
    mairieCentrales: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_CENTRALE).length,
    arrondissements: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_ARRONDISSEMENT).length,
    communes: MAIRIES_GABON.filter(m => m.type === OrganizationType.MAIRIE_COMMUNE).length,
    populationTotale: MAIRIES_GABON.reduce((sum, m) => sum + (m.population || 0), 0),
    provinces: [...new Set(MAIRIES_GABON.map(m => m.province))].length
});
