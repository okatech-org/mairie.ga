/**
 * Service de génération de documents mock réalistes
 * Version optimisée avec génération LAZY des PDFs
 * Les PDFs sont générés uniquement quand l'utilisateur les consulte
 */

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize pdfMake fonts
if (typeof window !== 'undefined') {
    // @ts-ignore - pdfMake types don't include vfs property correctly
    (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs || pdfFonts;
}

// Types
export interface MockDocument {
    id: string;
    name: string;
    type: 'pdf' | 'doc' | 'image' | 'other';
    size: string;
    date: string;
    url?: string;
    blob?: Blob;
    content?: string;
    // Pour la génération lazy
    generatorType?: 'admin' | 'report' | 'deliberation' | 'convention';
    generatorParams?: any;
}

export interface MockFolder {
    id: string;
    name: string;
    sender: {
        name: string;
        organization: string;
    };
    date: string;
    comment: string;
    documents: MockDocument[];
    isUrgent?: boolean;
    isRead: boolean;
    status?: 'draft' | 'pending' | 'sent' | 'archived';
}

// Cache pour les PDFs générés
const pdfCache: Map<string, { url: string; blob: Blob }> = new Map();

// ============= GÉNÉRATEURS DE PDF =============

async function generateAdminPDF(
    title: string,
    senderOrg: string,
    recipientOrg: string,
    date: string,
    content: string[],
    reference?: string
): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [50, 60, 50, 60],
            content: [
                {
                    columns: [{
                        width: '*',
                        stack: [
                            { text: 'RÉPUBLIQUE GABONAISE', style: 'header', alignment: 'center' },
                            { text: 'Union - Travail - Justice', style: 'motto', alignment: 'center' },
                            { text: '───────', alignment: 'center', margin: [0, 5, 0, 10] },
                            { text: senderOrg.toUpperCase(), style: 'organization', alignment: 'center' },
                        ]
                    }]
                },
                {
                    columns: [
                        { text: reference ? `Réf: ${reference}` : '', style: 'reference' },
                        { text: `Libreville, le ${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, alignment: 'right', style: 'date' }
                    ],
                    margin: [0, 20, 0, 30]
                },
                { text: `À l'attention de:\n${recipientOrg}`, style: 'recipient', margin: [300, 0, 0, 20] },
                { text: title, style: 'title', alignment: 'center', margin: [0, 20, 0, 30] },
                ...content.map(paragraph => ({ text: paragraph, style: 'body', margin: [0, 0, 0, 15] })),
                {
                    text: [
                        { text: '\n\n\nLe Responsable,\n\n\n', style: 'signature' },
                        { text: '________________________', style: 'signatureLine' }
                    ],
                    alignment: 'right',
                    margin: [200, 30, 0, 0]
                }
            ],
            styles: {
                header: { fontSize: 14, bold: true },
                motto: { fontSize: 10, italics: true },
                organization: { fontSize: 11, bold: true },
                reference: { fontSize: 10 },
                date: { fontSize: 10 },
                recipient: { fontSize: 10 },
                title: { fontSize: 14, bold: true, decoration: 'underline' },
                body: { fontSize: 11, lineHeight: 1.5, alignment: 'justify' },
                signature: { fontSize: 11 },
                signatureLine: { fontSize: 11 }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
        });
    });
}

async function generateReportPDF(
    title: string,
    organization: string,
    date: string,
    sections: { title: string; content: string }[]
): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [50, 60, 50, 60],
            content: [
                { text: organization.toUpperCase(), style: 'organization', alignment: 'center', margin: [0, 0, 0, 20] },
                { text: title, style: 'title', alignment: 'center', margin: [0, 0, 0, 30] },
                { text: `Période: ${date}`, alignment: 'center', style: 'date', margin: [0, 0, 0, 30] },
                ...sections.flatMap(section => [
                    { text: section.title, style: 'sectionTitle', margin: [0, 20, 0, 10] },
                    { text: section.content, style: 'body', margin: [0, 0, 0, 15] }
                ]),
                {
                    style: 'tableExample',
                    margin: [0, 20, 0, 20],
                    table: {
                        headerRows: 1,
                        widths: ['*', 'auto', 'auto'],
                        body: [
                            [{ text: 'Indicateur', style: 'tableHeader' }, { text: 'Valeur', style: 'tableHeader' }, { text: 'Évolution', style: 'tableHeader' }],
                            ['Actes délivrés', '1,245', '+12%'],
                            ['Demandes traitées', '2,890', '+8%'],
                            ['Délai moyen (jours)', '3.2', '-15%'],
                            ['Satisfaction usagers', '94%', '+2%']
                        ]
                    }
                },
                { text: `Document généré le ${new Date().toLocaleDateString('fr-FR')}`, style: 'footer', alignment: 'center', margin: [0, 40, 0, 0] }
            ],
            styles: {
                organization: { fontSize: 14, bold: true },
                title: { fontSize: 16, bold: true },
                date: { fontSize: 11, italics: true },
                sectionTitle: { fontSize: 12, bold: true, color: '#1a365d' },
                body: { fontSize: 10, lineHeight: 1.5, alignment: 'justify' },
                tableHeader: { bold: true, fontSize: 10, fillColor: '#e2e8f0' },
                footer: { fontSize: 9, italics: true, color: '#666' }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
        });
    });
}

async function generateDeliberationPDF(
    number: string,
    title: string,
    date: string,
    articles: string[]
): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [50, 60, 50, 60],
            content: [
                {
                    columns: [{
                        width: '*',
                        stack: [
                            { text: 'RÉPUBLIQUE GABONAISE', style: 'header', alignment: 'center' },
                            { text: 'Union - Travail - Justice', style: 'motto', alignment: 'center' },
                            { text: '───────', alignment: 'center', margin: [0, 5, 0, 5] },
                            { text: 'MAIRIE DE LIBREVILLE', style: 'mairie', alignment: 'center' },
                            { text: 'CONSEIL MUNICIPAL', style: 'conseil', alignment: 'center' },
                        ]
                    }]
                },
                { text: `DÉLIBÉRATION N° ${number}`, style: 'numeroDeliberation', alignment: 'center', margin: [0, 30, 0, 10] },
                { text: title, style: 'title', alignment: 'center', margin: [0, 0, 0, 30] },
                { text: `Séance du ${new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`, alignment: 'center', style: 'seance', margin: [0, 0, 0, 30] },
                { text: 'Le Conseil Municipal de la Commune de Libreville, légalement convoqué et réuni en session ordinaire,', style: 'preambule', margin: [0, 0, 0, 20] },
                { text: 'VU la Constitution de la République Gabonaise ;\nVU la loi organique relative aux collectivités locales ;\nVU le Code Général des Collectivités Locales ;\nAPRÈS en avoir délibéré :', style: 'visas', margin: [0, 0, 0, 30] },
                ...articles.map((article, index) => ({ text: `ARTICLE ${index + 1} : ${article}`, style: 'article', margin: [0, 0, 0, 15] })),
                { text: 'La présente délibération a été adoptée à l\'unanimité des membres présents.', style: 'adoption', margin: [0, 30, 0, 30] },
                {
                    columns: [
                        { text: 'Le Secrétaire de Séance,\n\n\n________________________', alignment: 'left' },
                        { text: 'Le Maire de Libreville,\n\n\n________________________', alignment: 'right' }
                    ],
                    margin: [0, 20, 0, 0]
                }
            ],
            styles: {
                header: { fontSize: 12, bold: true },
                motto: { fontSize: 9, italics: true },
                mairie: { fontSize: 11, bold: true },
                conseil: { fontSize: 10 },
                numeroDeliberation: { fontSize: 14, bold: true },
                title: { fontSize: 12, bold: true },
                seance: { fontSize: 10, italics: true },
                preambule: { fontSize: 10, italics: true },
                visas: { fontSize: 10 },
                article: { fontSize: 10, lineHeight: 1.5 },
                adoption: { fontSize: 10, italics: true }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
        });
    });
}

async function generateConventionPDF(
    title: string,
    parties: string[],
    articles: { title: string; content: string }[]
): Promise<{ blob: Blob; url: string }> {
    return new Promise((resolve) => {
        const docDefinition: any = {
            pageSize: 'A4',
            pageMargins: [50, 60, 50, 60],
            content: [
                { text: 'CONVENTION', style: 'mainTitle', alignment: 'center', margin: [0, 0, 0, 10] },
                { text: title, style: 'subtitle', alignment: 'center', margin: [0, 0, 0, 30] },
                { text: 'ENTRE LES SOUSSIGNÉS :', style: 'partiesHeader', margin: [0, 0, 0, 15] },
                ...parties.map((party, index) => ({ text: `${index + 1}. ${party}`, style: 'party', margin: [20, 0, 0, 10] })),
                { text: 'IL A ÉTÉ CONVENU CE QUI SUIT :', style: 'partiesHeader', alignment: 'center', margin: [0, 30, 0, 30] },
                ...articles.flatMap(article => [
                    { text: article.title, style: 'articleTitle', margin: [0, 15, 0, 10] },
                    { text: article.content, style: 'articleContent', margin: [0, 0, 0, 15] }
                ]),
                { text: 'Fait à Libreville, le ' + new Date().toLocaleDateString('fr-FR'), alignment: 'center', margin: [0, 40, 0, 30] },
                { text: 'En autant d\'exemplaires que de parties, chacune reconnaissant avoir reçu le sien.', style: 'exemplaires', alignment: 'center', margin: [0, 0, 0, 40] },
                {
                    columns: parties.map((_, index) => ({ text: `Partie ${index + 1}\n\n\n________________________`, alignment: 'center' }))
                }
            ],
            styles: {
                mainTitle: { fontSize: 16, bold: true },
                subtitle: { fontSize: 12, bold: true },
                partiesHeader: { fontSize: 11, bold: true },
                party: { fontSize: 10 },
                articleTitle: { fontSize: 11, bold: true },
                articleContent: { fontSize: 10, lineHeight: 1.5, alignment: 'justify' },
                exemplaires: { fontSize: 9, italics: true }
            }
        };

        const pdfDoc = pdfMake.createPdf(docDefinition);
        pdfDoc.getBlob((blob: Blob) => {
            const url = URL.createObjectURL(blob);
            resolve({ blob, url });
        });
    });
}

// ============= DONNÉES MOCK (sans génération PDF) =============

const MOCK_FOLDERS_DATA: MockFolder[] = [
    {
        id: 'folder-1',
        name: 'Permis de construire - Zone Industrielle',
        sender: { name: 'M. Ndong', organization: 'Mairie de Port-Gentil' },
        date: '2024-12-07',
        comment: 'Suite à notre entretien téléphonique, veuillez trouver ci-joint le dossier complet pour le permis de construire du lot 234.',
        isUrgent: true,
        isRead: false,
        status: 'pending',
        documents: [
            {
                id: 'd1', name: 'Demande_Permis.pdf', type: 'pdf', size: '2.4 MB', date: '2024-12-07',
                generatorType: 'admin',
                generatorParams: {
                    title: 'DEMANDE DE PERMIS DE CONSTRUIRE',
                    senderOrg: 'Mairie de Port-Gentil',
                    recipientOrg: 'Mairie Centrale de Libreville',
                    date: '2024-12-07',
                    content: [
                        'Monsieur le Maire,',
                        'J\'ai l\'honneur de solliciter de votre haute bienveillance l\'octroi d\'un permis de construire pour un projet immobilier situé dans la Zone Industrielle de Libreville, Lot 234.',
                        'Le projet consiste en la construction d\'un bâtiment à usage commercial d\'une superficie de 2,500 m² sur un terrain de 5,000 m².',
                        'Vous trouverez ci-joint l\'ensemble des pièces justificatives requises.',
                        'Dans l\'attente d\'une suite favorable, je vous prie d\'agréer, Monsieur le Maire, l\'expression de ma haute considération.'
                    ],
                    reference: 'PC-2024-1234'
                }
            },
            {
                id: 'd2', name: 'Plan_Masse.pdf', type: 'pdf', size: '5.1 MB', date: '2024-12-07',
                generatorType: 'admin',
                generatorParams: {
                    title: 'PLAN DE MASSE - DESCRIPTIF TECHNIQUE',
                    senderOrg: 'Cabinet d\'Architecture OBAME & Associés',
                    recipientOrg: 'Direction de l\'Urbanisme',
                    date: '2024-12-07',
                    content: [
                        'Surface totale du terrain : 5,000 m²',
                        'Surface constructible : 2,500 m²',
                        'Coefficient d\'occupation des sols (COS) : 0.5',
                        'Hauteur maximale : 12 mètres (R+2)',
                        'Espaces verts : 1,000 m² (20%)',
                        'Parking : 50 places',
                        'Ce plan a été établi conformément aux normes d\'urbanisme en vigueur.'
                    ],
                    reference: 'ARCH-2024-567'
                }
            },
        ],
    },
    {
        id: 'folder-2',
        name: 'Délibération n°2024-456 - Budget Annexe',
        sender: { name: 'Secrétariat Général', organization: 'Préfecture de l\'Estuaire' },
        date: '2024-12-06',
        comment: 'Pour validation et signature avant le conseil municipal du 15 décembre.',
        isRead: false,
        status: 'pending',
        documents: [
            {
                id: 'd5', name: 'Deliberation_2024-456.pdf', type: 'pdf', size: '1.8 MB', date: '2024-12-06',
                generatorType: 'deliberation',
                generatorParams: {
                    number: '2024-456',
                    title: 'Portant adoption du budget annexe de l\'exercice 2025',
                    date: '2024-12-06',
                    articles: [
                        'Le budget annexe de la Commune de Libreville pour l\'exercice 2025 est arrêté en équilibre à la somme de QUINZE MILLIARDS (15.000.000.000) de Francs CFA.',
                        'Les crédits de fonctionnement sont fixés à DIX MILLIARDS (10.000.000.000) Francs CFA.',
                        'Les crédits d\'investissement sont fixés à CINQ MILLIARDS (5.000.000.000) Francs CFA.',
                        'Le Maire est autorisé à procéder aux virements de crédits dans la limite de 5%.',
                        'La présente délibération sera transmise au Préfet pour contrôle de légalité.'
                    ]
                }
            },
            {
                id: 'd6', name: 'Annexe_Budget.pdf', type: 'pdf', size: '3.2 MB', date: '2024-12-06',
                generatorType: 'report',
                generatorParams: {
                    title: 'ANNEXE BUDGÉTAIRE - EXERCICE 2025',
                    organization: 'Direction des Finances - Mairie de Libreville',
                    date: 'Exercice 2025',
                    sections: [
                        { title: '1. RECETTES DE FONCTIONNEMENT', content: 'Les recettes prévues s\'élèvent à 10 milliards FCFA, répartis entre taxes locales (40%), dotations État (35%), produits services (15%) et autres (10%).' },
                        { title: '2. DÉPENSES DE FONCTIONNEMENT', content: 'Charges de personnel (45%), charges générales (25%), gestion courante (20%), autres charges (10%).' },
                        { title: '3. PROGRAMME D\'INVESTISSEMENT', content: 'Réhabilitation écoles (1.5 Mds), réseau assainissement (1.2 Mds), marchés (800 M), éclairage public (500 M).' }
                    ]
                }
            },
        ],
    },
    {
        id: 'folder-3',
        name: 'Rapport Trimestriel État Civil Q4',
        sender: { name: 'Chef de Service', organization: 'État Civil - Libreville' },
        date: '2024-12-05',
        comment: 'Rapport trimestriel des activités du service état civil pour le quatrième trimestre 2024.',
        isRead: true,
        status: 'sent',
        documents: [
            {
                id: 'd8', name: 'Rapport_Q4_2024.pdf', type: 'pdf', size: '4.5 MB', date: '2024-12-05',
                generatorType: 'report',
                generatorParams: {
                    title: 'RAPPORT D\'ACTIVITÉ TRIMESTRIEL',
                    organization: 'Service de l\'État Civil - Mairie de Libreville',
                    date: 'Quatrième Trimestre 2024',
                    sections: [
                        { title: '1. SYNTHÈSE GÉNÉRALE', content: 'Hausse de 15% des demandes d\'actes. Période de rentrée scolaire et préparatifs de fin d\'année.' },
                        { title: '2. ACTES DÉLIVRÉS', content: '12,450 actes : naissances (42%), mariages (31%), décès (17%), autres (10%). Délai moyen : 3.2 jours.' },
                        { title: '3. MODERNISATION', content: '65% des archives numérisées. 2,340 demandes en ligne (19% du total).' },
                        { title: '4. PERSPECTIVES', content: 'Objectif 80% numérisation et délai de 2 jours pour Q1 2025.' }
                    ]
                }
            },
        ],
    },
    {
        id: 'folder-4',
        name: 'Convention Intercommunale Transport',
        sender: { name: 'Direction Générale', organization: 'Communauté Urbaine' },
        date: '2024-12-04',
        comment: 'Projet de convention pour le réseau de transport intercommunal.',
        isRead: true,
        status: 'archived',
        documents: [
            {
                id: 'd10', name: 'Convention_Transport.pdf', type: 'pdf', size: '2.8 MB', date: '2024-12-04',
                generatorType: 'convention',
                generatorParams: {
                    title: 'Relative au Réseau de Transport Intercommunal du Grand Libreville',
                    parties: [
                        'La Commune de Libreville, représentée par son Maire',
                        'La Communauté Urbaine du Grand Libreville, représentée par son Président',
                        'La Société de Transport Urbain du Gabon (STUG)'
                    ],
                    articles: [
                        { title: 'ARTICLE 1 - OBJET', content: 'Définir les modalités de coopération pour le développement du transport public.' },
                        { title: 'ARTICLE 2 - PÉRIMÈTRE', content: 'Communes de Libreville, Owendo, Akanda et Ntoum (850,000 habitants).' },
                        { title: 'ARTICLE 3 - ENGAGEMENTS', content: 'Mise à disposition des emprises, financement 40%, facilitation administrative.' },
                        { title: 'ARTICLE 4 - DURÉE', content: 'Convention de 10 ans, renouvelable par tacite reconduction.' },
                        { title: 'ARTICLE 5 - FINANCEMENT', content: 'Budget 45 milliards FCFA sur 5 ans : État (30%), Communes (40%), Privés (30%).' }
                    ]
                }
            },
        ],
    },
];

// ============= API PUBLIQUE =============

/**
 * Récupère les dossiers de correspondance (sans générer les PDFs)
 */
export async function getCorrespondanceFolders(): Promise<MockFolder[]> {
    // Retourne immédiatement les données sans génération PDF
    return [...MOCK_FOLDERS_DATA];
}

/**
 * Génère un PDF à la demande pour un document spécifique
 */
export async function generateDocumentPDF(doc: MockDocument): Promise<{ url: string; blob: Blob }> {
    // Vérifier le cache
    if (pdfCache.has(doc.id)) {
        console.log('📄 [MockDocService] PDF en cache:', doc.name);
        return pdfCache.get(doc.id)!;
    }

    console.log('📄 [MockDocService] Génération PDF:', doc.name);

    let result: { url: string; blob: Blob };

    switch (doc.generatorType) {
        case 'admin':
            result = await generateAdminPDF(
                doc.generatorParams.title,
                doc.generatorParams.senderOrg,
                doc.generatorParams.recipientOrg,
                doc.generatorParams.date,
                doc.generatorParams.content,
                doc.generatorParams.reference
            );
            break;

        case 'report':
            result = await generateReportPDF(
                doc.generatorParams.title,
                doc.generatorParams.organization,
                doc.generatorParams.date,
                doc.generatorParams.sections
            );
            break;

        case 'deliberation':
            result = await generateDeliberationPDF(
                doc.generatorParams.number,
                doc.generatorParams.title,
                doc.generatorParams.date,
                doc.generatorParams.articles
            );
            break;

        case 'convention':
            result = await generateConventionPDF(
                doc.generatorParams.title,
                doc.generatorParams.parties,
                doc.generatorParams.articles
            );
            break;

        default:
            // Générer un PDF générique avec contenu contextualisé
            // Utiliser le contenu passé en paramètre ou générer un contenu basé sur le nom
            const defaultContent = doc.generatorParams?.content || [
                `Ce document fait référence à : ${doc.name}.`,
                'Pour plus de détails, veuillez consulter les pièces jointes ou contacter le service émetteur.',
                `Document généré le ${new Date().toLocaleDateString('fr-FR')}.`
            ];
            result = await generateAdminPDF(
                doc.generatorParams?.title || doc.name,
                doc.generatorParams?.senderOrg || 'Mairie de Libreville',
                doc.generatorParams?.recipientOrg || 'Destinataire',
                doc.generatorParams?.date || doc.date || new Date().toISOString(),
                defaultContent
            );
    }

    // Mettre en cache
    pdfCache.set(doc.id, result);

    return result;
}

/**
 * Vider le cache des PDFs
 */
export function clearDocumentCache(): void {
    pdfCache.forEach(({ url }) => URL.revokeObjectURL(url));
    pdfCache.clear();
}
