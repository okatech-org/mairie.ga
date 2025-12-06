import { LucideIcon, FileText, Building2, Coins, Heart, FileCheck, ScrollText, Home, Users, Landmark, TreePine, Truck, ShieldCheck, Stamp, CreditCard, Baby, Heart as HeartIcon, Skull, BookOpen, Scale, FileSearch, MapPin, Hammer, Store, Beer, Receipt, HelpCircle, BadgeCheck, ClipboardList } from 'lucide-react';

// Catégories de services municipaux
export enum ServiceCategory {
    ETAT_CIVIL = 'ETAT_CIVIL',
    URBANISME = 'URBANISME',
    FISCALITE = 'FISCALITE',
    AFFAIRES_SOCIALES = 'AFFAIRES_SOCIALES',
    LEGALISATION = 'LEGALISATION',
    ENTREPRISES = 'ENTREPRISES',
    ENVIRONNEMENT = 'ENVIRONNEMENT',
    VOIRIE = 'VOIRIE'
}

// Types de services municipaux
export type MunicipalServiceType =
    // État Civil
    | 'ACTE_NAISSANCE'
    | 'ACTE_NAISSANCE_COPIE'
    | 'ACTE_MARIAGE'
    | 'ACTE_DECES'
    | 'CERTIFICAT_VIE'
    | 'CERTIFICAT_RESIDENCE'
    | 'CERTIFICAT_CELIBAT'
    | 'CERTIFICAT_NON_DIVORCE'
    | 'LIVRET_FAMILLE'
    | 'DECLARATION_NAISSANCE'
    | 'DECLARATION_DECES'
    | 'TRANSCRIPTION_JUGEMENT'
    // Urbanisme
    | 'PERMIS_CONSTRUIRE'
    | 'CERTIFICAT_URBANISME'
    | 'AUTORISATION_LOTISSEMENT'
    | 'PERMIS_DEMOLIR'
    | 'CERTIFICAT_CONFORMITE'
    | 'AUTORISATION_TRAVAUX'
    // Fiscalité
    | 'PATENTE'
    | 'TAXE_FONCIERE'
    | 'TAXE_HABITATION'
    | 'REDEVANCE_OCCUPATION'
    | 'TAXE_ENSEIGNES'
    // Affaires Sociales
    | 'CERTIFICAT_INDIGENCE'
    | 'AIDE_SOCIALE'
    | 'CARTE_HANDICAPE'
    | 'AIDE_FUNERAIRE'
    // Légalisation
    | 'LEGALISATION_SIGNATURE'
    | 'COPIE_CONFORME'
    | 'CERTIFICATION_DOCUMENTS'
    | 'ATTESTATION_DOMICILE'
    // Entreprises
    | 'AUTORISATION_COMMERCE'
    | 'LICENCE_VENTE_ALCOOL'
    | 'AGREMENT_MARCHE_PUBLIC'
    | 'AUTORISATION_ENSEIGNE'
    | 'AUTORISATION_TERRASSE'
    // Environnement & Voirie
    | 'AUTORISATION_ABATTAGE'
    | 'AUTORISATION_OCCUPATION_VOIE';

export interface MunicipalServiceInfo {
    id: MunicipalServiceType;
    name: string;
    description: string;
    category: ServiceCategory;
    icon: LucideIcon;
    color: string;
    requiredDocuments: string[];
    processingDays: number;
    price: number; // en FCFA
    priceRange?: { min: number; max: number };
    forPersonneMorale?: boolean;
    forCitoyen?: boolean;
    forEtranger?: boolean;
}

export const MUNICIPAL_SERVICE_CATALOG: Record<MunicipalServiceType, MunicipalServiceInfo> = {
    // ========== ÉTAT CIVIL ==========
    ACTE_NAISSANCE: {
        id: 'ACTE_NAISSANCE',
        name: 'Acte de Naissance',
        description: 'Établissement d\'un acte de naissance',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Baby,
        color: 'text-blue-600',
        requiredDocuments: ['Certificat de naissance', 'CNI parents', 'Livret de famille'],
        processingDays: 3,
        price: 1000,
        forCitoyen: true,
        forEtranger: true
    },
    ACTE_NAISSANCE_COPIE: {
        id: 'ACTE_NAISSANCE_COPIE',
        name: 'Copie d\'Acte de Naissance',
        description: 'Copie intégrale ou extrait d\'acte de naissance',
        category: ServiceCategory.ETAT_CIVIL,
        icon: FileText,
        color: 'text-blue-500',
        requiredDocuments: ['CNI demandeur', 'Numéro acte original'],
        processingDays: 1,
        price: 500,
        forCitoyen: true,
        forEtranger: true
    },
    ACTE_MARIAGE: {
        id: 'ACTE_MARIAGE',
        name: 'Acte de Mariage',
        description: 'Célébration et établissement d\'acte de mariage',
        category: ServiceCategory.ETAT_CIVIL,
        icon: HeartIcon,
        color: 'text-pink-600',
        requiredDocuments: ['CNI époux', 'Actes naissance', 'Certificats célibat', 'Certificats résidence', 'Publication bans'],
        processingDays: 30,
        price: 25000,
        forCitoyen: true,
        forEtranger: true
    },
    ACTE_DECES: {
        id: 'ACTE_DECES',
        name: 'Acte de Décès',
        description: 'Établissement d\'un acte de décès',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Skull,
        color: 'text-gray-600',
        requiredDocuments: ['Certificat médical décès', 'CNI défunt', 'CNI déclarant', 'Livret famille'],
        processingDays: 1,
        price: 0,
        forCitoyen: true,
        forEtranger: true
    },
    CERTIFICAT_VIE: {
        id: 'CERTIFICAT_VIE',
        name: 'Certificat de Vie',
        description: 'Attestation prouvant que la personne est en vie',
        category: ServiceCategory.ETAT_CIVIL,
        icon: HeartIcon,
        color: 'text-green-600',
        requiredDocuments: ['CNI', 'Présence physique obligatoire'],
        processingDays: 1,
        price: 1000,
        forCitoyen: true,
        forEtranger: true
    },
    CERTIFICAT_RESIDENCE: {
        id: 'CERTIFICAT_RESIDENCE',
        name: 'Certificat de Résidence',
        description: 'Attestation de domicile dans la commune',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Home,
        color: 'text-teal-600',
        requiredDocuments: ['CNI', 'Justificatif domicile', 'Facture eau/électricité'],
        processingDays: 2,
        price: 2000,
        forCitoyen: true,
        forEtranger: true
    },
    CERTIFICAT_CELIBAT: {
        id: 'CERTIFICAT_CELIBAT',
        name: 'Certificat de Célibat',
        description: 'Attestation de non-mariage',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Users,
        color: 'text-purple-600',
        requiredDocuments: ['CNI', 'Acte de naissance', 'Déclaration sur l\'honneur'],
        processingDays: 3,
        price: 2000,
        forCitoyen: true,
        forEtranger: true
    },
    CERTIFICAT_NON_DIVORCE: {
        id: 'CERTIFICAT_NON_DIVORCE',
        name: 'Certificat de Non-Divorce',
        description: 'Attestation d\'absence de divorce',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Scale,
        color: 'text-indigo-600',
        requiredDocuments: ['CNI', 'Acte de mariage', 'Déclaration sur l\'honneur'],
        processingDays: 5,
        price: 3000,
        forCitoyen: true
    },
    LIVRET_FAMILLE: {
        id: 'LIVRET_FAMILLE',
        name: 'Livret de Famille',
        description: 'Établissement ou duplicata du livret de famille',
        category: ServiceCategory.ETAT_CIVIL,
        icon: BookOpen,
        color: 'text-amber-600',
        requiredDocuments: ['Acte mariage', 'CNI époux', 'Actes naissance enfants'],
        processingDays: 7,
        price: 5000,
        forCitoyen: true
    },
    DECLARATION_NAISSANCE: {
        id: 'DECLARATION_NAISSANCE',
        name: 'Déclaration de Naissance',
        description: 'Déclaration officielle d\'une naissance',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Baby,
        color: 'text-cyan-600',
        requiredDocuments: ['Certificat accouchement', 'CNI parents', 'Livret famille'],
        processingDays: 1,
        price: 0,
        forCitoyen: true,
        forEtranger: true
    },
    DECLARATION_DECES: {
        id: 'DECLARATION_DECES',
        name: 'Déclaration de Décès',
        description: 'Déclaration officielle d\'un décès',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Skull,
        color: 'text-slate-600',
        requiredDocuments: ['Certificat médical décès', 'CNI déclarant'],
        processingDays: 1,
        price: 0,
        forCitoyen: true,
        forEtranger: true
    },
    TRANSCRIPTION_JUGEMENT: {
        id: 'TRANSCRIPTION_JUGEMENT',
        name: 'Transcription de Jugement',
        description: 'Transcription d\'un jugement dans les registres',
        category: ServiceCategory.ETAT_CIVIL,
        icon: Scale,
        color: 'text-rose-600',
        requiredDocuments: ['Jugement original', 'CNI demandeur', 'Acte concerné'],
        processingDays: 15,
        price: 5000,
        forCitoyen: true
    },

    // ========== URBANISME ==========
    PERMIS_CONSTRUIRE: {
        id: 'PERMIS_CONSTRUIRE',
        name: 'Permis de Construire',
        description: 'Autorisation de construction',
        category: ServiceCategory.URBANISME,
        icon: Building2,
        color: 'text-orange-600',
        requiredDocuments: ['Titre foncier', 'Plans architecte', 'Étude sol', 'Devis travaux', 'CNI propriétaire'],
        processingDays: 60,
        price: 50000,
        priceRange: { min: 50000, max: 500000 },
        forCitoyen: true,
        forPersonneMorale: true
    },
    CERTIFICAT_URBANISME: {
        id: 'CERTIFICAT_URBANISME',
        name: 'Certificat d\'Urbanisme',
        description: 'Information sur les règles d\'urbanisme applicables',
        category: ServiceCategory.URBANISME,
        icon: MapPin,
        color: 'text-lime-600',
        requiredDocuments: ['Plan cadastral', 'Titre foncier', 'Demande écrite'],
        processingDays: 30,
        price: 15000,
        forCitoyen: true,
        forPersonneMorale: true
    },
    AUTORISATION_LOTISSEMENT: {
        id: 'AUTORISATION_LOTISSEMENT',
        name: 'Autorisation de Lotissement',
        description: 'Autorisation de division de terrain',
        category: ServiceCategory.URBANISME,
        icon: Landmark,
        color: 'text-emerald-600',
        requiredDocuments: ['Titre foncier', 'Plan lotissement', 'Étude impact', 'Projet VRD'],
        processingDays: 90,
        price: 100000,
        priceRange: { min: 100000, max: 1000000 },
        forCitoyen: true,
        forPersonneMorale: true
    },
    PERMIS_DEMOLIR: {
        id: 'PERMIS_DEMOLIR',
        name: 'Permis de Démolir',
        description: 'Autorisation de démolition',
        category: ServiceCategory.URBANISME,
        icon: Hammer,
        color: 'text-red-600',
        requiredDocuments: ['Titre foncier', 'Plans existants', 'Motivation démolition', 'CNI'],
        processingDays: 30,
        price: 25000,
        forCitoyen: true,
        forPersonneMorale: true
    },
    CERTIFICAT_CONFORMITE: {
        id: 'CERTIFICAT_CONFORMITE',
        name: 'Certificat de Conformité',
        description: 'Attestation de conformité des travaux',
        category: ServiceCategory.URBANISME,
        icon: BadgeCheck,
        color: 'text-green-600',
        requiredDocuments: ['Permis construire', 'Plans récolement', 'Attestation architecte'],
        processingDays: 15,
        price: 20000,
        forCitoyen: true,
        forPersonneMorale: true
    },
    AUTORISATION_TRAVAUX: {
        id: 'AUTORISATION_TRAVAUX',
        name: 'Autorisation de Travaux',
        description: 'Autorisation pour travaux mineurs',
        category: ServiceCategory.URBANISME,
        icon: Hammer,
        color: 'text-yellow-600',
        requiredDocuments: ['CNI', 'Description travaux', 'Plans'],
        processingDays: 15,
        price: 10000,
        forCitoyen: true,
        forPersonneMorale: true
    },

    // ========== FISCALITÉ ==========
    PATENTE: {
        id: 'PATENTE',
        name: 'Patente Commerciale',
        description: 'Taxe professionnelle pour activité commerciale',
        category: ServiceCategory.FISCALITE,
        icon: Store,
        color: 'text-amber-600',
        requiredDocuments: ['Registre commerce', 'CNI gérant', 'Bail local', 'Statuts société'],
        processingDays: 7,
        price: 50000,
        priceRange: { min: 50000, max: 500000 },
        forPersonneMorale: true,
        forCitoyen: true
    },
    TAXE_FONCIERE: {
        id: 'TAXE_FONCIERE',
        name: 'Taxe Foncière',
        description: 'Impôt sur les propriétés bâties et non bâties',
        category: ServiceCategory.FISCALITE,
        icon: Landmark,
        color: 'text-stone-600',
        requiredDocuments: ['Titre foncier', 'CNI propriétaire', 'Déclaration foncière'],
        processingDays: 5,
        price: 25000,
        priceRange: { min: 25000, max: 250000 },
        forCitoyen: true,
        forPersonneMorale: true
    },
    TAXE_HABITATION: {
        id: 'TAXE_HABITATION',
        name: 'Taxe d\'Habitation',
        description: 'Taxe sur l\'occupation d\'un logement',
        category: ServiceCategory.FISCALITE,
        icon: Home,
        color: 'text-violet-600',
        requiredDocuments: ['CNI', 'Justificatif domicile', 'Bail'],
        processingDays: 5,
        price: 15000,
        priceRange: { min: 15000, max: 100000 },
        forCitoyen: true
    },
    REDEVANCE_OCCUPATION: {
        id: 'REDEVANCE_OCCUPATION',
        name: 'Redevance Occupation Domaine',
        description: 'Redevance pour occupation du domaine public',
        category: ServiceCategory.FISCALITE,
        icon: MapPin,
        color: 'text-fuchsia-600',
        requiredDocuments: ['Demande écrite', 'Plan occupation', 'CNI/Registre commerce'],
        processingDays: 15,
        price: 30000,
        priceRange: { min: 30000, max: 300000 },
        forCitoyen: true,
        forPersonneMorale: true
    },
    TAXE_ENSEIGNES: {
        id: 'TAXE_ENSEIGNES',
        name: 'Taxe sur les Enseignes',
        description: 'Taxe sur la publicité et les enseignes',
        category: ServiceCategory.FISCALITE,
        icon: Receipt,
        color: 'text-sky-600',
        requiredDocuments: ['Demande écrite', 'Photos enseigne', 'Registre commerce'],
        processingDays: 10,
        price: 20000,
        priceRange: { min: 20000, max: 200000 },
        forPersonneMorale: true
    },

    // ========== AFFAIRES SOCIALES ==========
    CERTIFICAT_INDIGENCE: {
        id: 'CERTIFICAT_INDIGENCE',
        name: 'Certificat d\'Indigence',
        description: 'Attestation de situation précaire',
        category: ServiceCategory.AFFAIRES_SOCIALES,
        icon: Heart,
        color: 'text-red-500',
        requiredDocuments: ['CNI', 'Enquête sociale', 'Attestation chef quartier'],
        processingDays: 7,
        price: 0,
        forCitoyen: true
    },
    AIDE_SOCIALE: {
        id: 'AIDE_SOCIALE',
        name: 'Aide Sociale',
        description: 'Demande d\'aide sociale municipale',
        category: ServiceCategory.AFFAIRES_SOCIALES,
        icon: HelpCircle,
        color: 'text-pink-500',
        requiredDocuments: ['CNI', 'Certificat indigence', 'Justificatif situation'],
        processingDays: 30,
        price: 0,
        forCitoyen: true
    },
    CARTE_HANDICAPE: {
        id: 'CARTE_HANDICAPE',
        name: 'Carte de Handicapé',
        description: 'Carte d\'invalidité pour personnes handicapées',
        category: ServiceCategory.AFFAIRES_SOCIALES,
        icon: ShieldCheck,
        color: 'text-blue-500',
        requiredDocuments: ['CNI', 'Certificat médical', 'Photos identité'],
        processingDays: 30,
        price: 0,
        forCitoyen: true
    },
    AIDE_FUNERAIRE: {
        id: 'AIDE_FUNERAIRE',
        name: 'Aide Funéraire',
        description: 'Aide pour les frais funéraires',
        category: ServiceCategory.AFFAIRES_SOCIALES,
        icon: Skull,
        color: 'text-gray-500',
        requiredDocuments: ['Acte décès', 'Certificat indigence', 'Devis pompes funèbres'],
        processingDays: 3,
        price: 0,
        forCitoyen: true
    },

    // ========== LÉGALISATION ==========
    LEGALISATION_SIGNATURE: {
        id: 'LEGALISATION_SIGNATURE',
        name: 'Légalisation de Signature',
        description: 'Authentification d\'une signature',
        category: ServiceCategory.LEGALISATION,
        icon: Stamp,
        color: 'text-purple-600',
        requiredDocuments: ['CNI', 'Document à légaliser', 'Présence physique'],
        processingDays: 1,
        price: 1000,
        forCitoyen: true,
        forEtranger: true,
        forPersonneMorale: true
    },
    COPIE_CONFORME: {
        id: 'COPIE_CONFORME',
        name: 'Copie Conforme',
        description: 'Certification conforme d\'un document',
        category: ServiceCategory.LEGALISATION,
        icon: FileCheck,
        color: 'text-indigo-600',
        requiredDocuments: ['CNI', 'Document original', 'Copie à certifier'],
        processingDays: 1,
        price: 500,
        forCitoyen: true,
        forEtranger: true,
        forPersonneMorale: true
    },
    CERTIFICATION_DOCUMENTS: {
        id: 'CERTIFICATION_DOCUMENTS',
        name: 'Certification de Documents',
        description: 'Certification officielle de documents',
        category: ServiceCategory.LEGALISATION,
        icon: BadgeCheck,
        color: 'text-teal-600',
        requiredDocuments: ['CNI', 'Documents originaux'],
        processingDays: 2,
        price: 2000,
        forCitoyen: true,
        forEtranger: true,
        forPersonneMorale: true
    },
    ATTESTATION_DOMICILE: {
        id: 'ATTESTATION_DOMICILE',
        name: 'Attestation de Domicile',
        description: 'Attestation officielle de domiciliation',
        category: ServiceCategory.LEGALISATION,
        icon: Home,
        color: 'text-cyan-600',
        requiredDocuments: ['CNI', 'Justificatif domicile', 'Facture récente'],
        processingDays: 2,
        price: 1500,
        forCitoyen: true,
        forEtranger: true
    },

    // ========== ENTREPRISES ==========
    AUTORISATION_COMMERCE: {
        id: 'AUTORISATION_COMMERCE',
        name: 'Autorisation de Commerce',
        description: 'Autorisation d\'exercer une activité commerciale',
        category: ServiceCategory.ENTREPRISES,
        icon: Store,
        color: 'text-emerald-600',
        requiredDocuments: ['Registre commerce', 'CNI gérant', 'Bail commercial', 'Plan local'],
        processingDays: 15,
        price: 35000,
        forPersonneMorale: true,
        forCitoyen: true
    },
    LICENCE_VENTE_ALCOOL: {
        id: 'LICENCE_VENTE_ALCOOL',
        name: 'Licence Vente d\'Alcool',
        description: 'Autorisation de vente de boissons alcoolisées',
        category: ServiceCategory.ENTREPRISES,
        icon: Beer,
        color: 'text-amber-700',
        requiredDocuments: ['Registre commerce', 'Casier judiciaire', 'Certificat hygiène', 'Plan local'],
        processingDays: 30,
        price: 100000,
        forPersonneMorale: true
    },
    AGREMENT_MARCHE_PUBLIC: {
        id: 'AGREMENT_MARCHE_PUBLIC',
        name: 'Agrément Marchés Publics',
        description: 'Agrément pour soumissionner aux marchés publics',
        category: ServiceCategory.ENTREPRISES,
        icon: ClipboardList,
        color: 'text-blue-700',
        requiredDocuments: ['Registre commerce', 'Attestation fiscale', 'Attestation CNSS', 'Références'],
        processingDays: 45,
        price: 75000,
        forPersonneMorale: true
    },
    AUTORISATION_ENSEIGNE: {
        id: 'AUTORISATION_ENSEIGNE',
        name: 'Autorisation d\'Enseigne',
        description: 'Autorisation d\'installation d\'enseigne publicitaire',
        category: ServiceCategory.ENTREPRISES,
        icon: Store,
        color: 'text-orange-600',
        requiredDocuments: ['Demande écrite', 'Maquette enseigne', 'Plan implantation', 'Registre commerce'],
        processingDays: 15,
        price: 25000,
        forPersonneMorale: true
    },
    AUTORISATION_TERRASSE: {
        id: 'AUTORISATION_TERRASSE',
        name: 'Autorisation de Terrasse',
        description: 'Autorisation d\'occupation pour terrasse commerciale',
        category: ServiceCategory.ENTREPRISES,
        icon: Landmark,
        color: 'text-lime-700',
        requiredDocuments: ['Demande écrite', 'Plan terrasse', 'Registre commerce', 'Assurance'],
        processingDays: 15,
        price: 30000,
        priceRange: { min: 30000, max: 150000 },
        forPersonneMorale: true
    },

    // ========== ENVIRONNEMENT & VOIRIE ==========
    AUTORISATION_ABATTAGE: {
        id: 'AUTORISATION_ABATTAGE',
        name: 'Autorisation d\'Abattage d\'Arbres',
        description: 'Autorisation pour abattre des arbres',
        category: ServiceCategory.ENVIRONNEMENT,
        icon: TreePine,
        color: 'text-green-700',
        requiredDocuments: ['Demande écrite', 'Titre foncier', 'Motif abattage', 'Photos arbres'],
        processingDays: 15,
        price: 10000,
        forCitoyen: true,
        forPersonneMorale: true
    },
    AUTORISATION_OCCUPATION_VOIE: {
        id: 'AUTORISATION_OCCUPATION_VOIE',
        name: 'Occupation de la Voie Publique',
        description: 'Autorisation temporaire d\'occupation de la voie publique',
        category: ServiceCategory.VOIRIE,
        icon: Truck,
        color: 'text-slate-700',
        requiredDocuments: ['Demande écrite', 'Plan occupation', 'Durée prévue', 'Assurance'],
        processingDays: 7,
        price: 15000,
        priceRange: { min: 15000, max: 100000 },
        forCitoyen: true,
        forPersonneMorale: true
    }
};

// Helper functions
export const getServicesByCategory = (category: ServiceCategory): MunicipalServiceInfo[] => {
    return Object.values(MUNICIPAL_SERVICE_CATALOG).filter(s => s.category === category);
};

export const getServicesForUserType = (type: 'citoyen' | 'etranger' | 'entreprise'): MunicipalServiceInfo[] => {
    return Object.values(MUNICIPAL_SERVICE_CATALOG).filter(s => {
        if (type === 'citoyen') return s.forCitoyen;
        if (type === 'etranger') return s.forEtranger;
        if (type === 'entreprise') return s.forPersonneMorale;
        return false;
    });
};

export const getCategoryLabel = (category: ServiceCategory): string => {
    const labels: Record<ServiceCategory, string> = {
        [ServiceCategory.ETAT_CIVIL]: 'État Civil',
        [ServiceCategory.URBANISME]: 'Urbanisme',
        [ServiceCategory.FISCALITE]: 'Fiscalité Locale',
        [ServiceCategory.AFFAIRES_SOCIALES]: 'Affaires Sociales',
        [ServiceCategory.LEGALISATION]: 'Légalisation',
        [ServiceCategory.ENTREPRISES]: 'Entreprises',
        [ServiceCategory.ENVIRONNEMENT]: 'Environnement',
        [ServiceCategory.VOIRIE]: 'Voirie & Transport'
    };
    return labels[category];
};

export const getCategoryIcon = (category: ServiceCategory): LucideIcon => {
    const icons: Record<ServiceCategory, LucideIcon> = {
        [ServiceCategory.ETAT_CIVIL]: ScrollText,
        [ServiceCategory.URBANISME]: Building2,
        [ServiceCategory.FISCALITE]: Coins,
        [ServiceCategory.AFFAIRES_SOCIALES]: Heart,
        [ServiceCategory.LEGALISATION]: Stamp,
        [ServiceCategory.ENTREPRISES]: Store,
        [ServiceCategory.ENVIRONNEMENT]: TreePine,
        [ServiceCategory.VOIRIE]: Truck
    };
    return icons[category];
};

// Legacy compatibility
export type ServiceType = MunicipalServiceType;
export const SERVICE_CATALOG = MUNICIPAL_SERVICE_CATALOG;
