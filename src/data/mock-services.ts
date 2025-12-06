import { ConsularService } from "@/types/services";

export const MOCK_SERVICES: ConsularService[] = [
    // PASSEPORTS
    {
        id: 'passport-ordinary',
        name: 'Passeport Ordinaire',
        description: 'Délivrance et renouvellement de passeports biométriques pour les citoyens.',
        is_active: true,
        requirements: ['Acte de naissance', 'Ancien passeport', 'Photo d\'identité', 'Justificatif de domicile'],
        price: 85,
        currency: 'EUR'
    },
    {
        id: 'passport-emergency',
        name: 'Passeport d\'Urgence',
        description: 'Délivrance exceptionnelle de passeport pour motif impérieux.',
        is_active: true,
        requirements: ['Justificatif de l\'urgence', 'Ancien passeport', 'Photo d\'identité'],
        price: 120,
        currency: 'EUR'
    },
    {
        id: 'laissez-passer',
        name: 'Laissez-Passer',
        description: 'Document de voyage provisoire pour retour au pays.',
        is_active: true,
        requirements: ['Déclaration de perte/vol', 'Photo d\'identité', 'Billet d\'avion'],
        price: 30,
        currency: 'EUR'
    },

    // VISAS
    {
        id: 'visa-tourist',
        name: 'Visa Tourisme',
        description: 'Visa court séjour pour les visiteurs étrangers.',
        is_active: true,
        requirements: ['Passeport valide', 'Photo', 'Réservation d\'hôtel', 'Billet d\'avion'],
        price: 60,
        currency: 'EUR'
    },
    {
        id: 'visa-business',
        name: 'Visa Affaires',
        description: 'Visa pour les voyages d\'affaires et missions professionnelles.',
        is_active: true,
        requirements: ['Lettre d\'invitation', 'Ordre de mission', 'Passeport', 'Photo'],
        price: 90,
        currency: 'EUR'
    },
    {
        id: 'visa-long-stay',
        name: 'Visa Long Séjour',
        description: 'Visa pour études, travail ou regroupement familial.',
        is_active: true,
        requirements: ['Justificatif de motif', 'Passeport', 'Assurance', 'Ressources'],
        price: 99,
        currency: 'EUR'
    },

    // ETAT CIVIL
    {
        id: 'civil-birth',
        name: 'Transcription Naissance',
        description: 'Enregistrement des naissances survenues à l\'étranger.',
        is_active: true,
        requirements: ['Acte de naissance local', 'Pièces d\'identité des parents'],
        price: 15,
        currency: 'EUR'
    },
    {
        id: 'civil-marriage',
        name: 'Transcription Mariage',
        description: 'Enregistrement des mariages célébrés à l\'étranger.',
        is_active: true,
        requirements: ['Acte de mariage local', 'Certificats de capacité'],
        price: 20,
        currency: 'EUR'
    },
    {
        id: 'civil-death',
        name: 'Transcription Décès',
        description: 'Enregistrement des décès survenus à l\'étranger.',
        is_active: true,
        requirements: ['Acte de décès local', 'Passeport du défunt'],
        price: 0,
        currency: 'EUR'
    },
    {
        id: 'civil-cert-capacity',
        name: 'Certificat de Capacité à Mariage',
        description: 'Document requis pour se marier à l\'étranger.',
        is_active: true,
        requirements: ['Acte de naissance', 'Justificatif de domicile', 'Pièce d\'identité'],
        price: 25,
        currency: 'EUR'
    },

    // ADMINISTRATIF
    {
        id: 'legalization',
        name: 'Légalisation de Documents',
        description: 'Certification de l\'authenticité de documents officiels.',
        is_active: true,
        requirements: ['Document original', 'Copie'],
        price: 10,
        currency: 'EUR'
    },
    {
        id: 'certified-copy',
        name: 'Copie Certifiée Conforme',
        description: 'Certification de conformité de copies de documents.',
        is_active: true,
        requirements: ['Original', 'Copie à certifier'],
        price: 5,
        currency: 'EUR'
    },
    {
        id: 'consular-card',
        name: 'Carte Consulaire',
        description: 'Immatriculation des citoyens résidant dans la juridiction.',
        is_active: true,
        requirements: ['Passeport', 'Justificatif de domicile', 'Photo'],
        price: 15,
        currency: 'EUR'
    },
    {
        id: 'certificate-residence',
        name: 'Certificat de Résidence',
        description: 'Attestation de résidence pour démarches administratives.',
        is_active: true,
        requirements: ['Carte Consulaire', 'Justificatif de domicile récent'],
        price: 10,
        currency: 'EUR'
    },
    {
        id: 'certificate-change-residence',
        name: 'Certificat de Déménagement',
        description: 'Pour exonération douanière lors du retour définitif.',
        is_active: true,
        requirements: ['Inventaire', 'Billet d\'avion', 'Justificatif de fin de séjour'],
        price: 45,
        currency: 'EUR'
    },
    {
        id: 'power-attorney',
        name: 'Procuration',
        description: 'Légalisation de signature pour procuration.',
        is_active: true,
        requirements: ['Présence du signataire', 'Pièce d\'identité', 'Texte de la procuration'],
        price: 20,
        currency: 'EUR'
    }
];
