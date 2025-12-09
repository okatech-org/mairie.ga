import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Flag pour initialisation unique
let fontsInitialized = false;

// Initialisation des fonts
function initializeFonts() {
    if (!fontsInitialized) {
        let vfs: any = undefined;

        if (pdfFonts && Object.keys(pdfFonts).some(k => k.endsWith('.ttf'))) {
            vfs = pdfFonts;
        } else if ((pdfFonts as any).default && Object.keys((pdfFonts as any).default).some((k: string) => k.endsWith('.ttf'))) {
            vfs = (pdfFonts as any).default;
        } else {
            vfs = (pdfFonts as any).pdfMake?.vfs
                || (pdfFonts as any).vfs
                || (pdfFonts as any).default?.pdfMake?.vfs
                || (pdfFonts as any).default?.vfs
                || (window as any).pdfMake?.vfs;
        }

        if (vfs) {
            (pdfMake as any).vfs = vfs;
            (pdfMake as any).fonts = {
                Roboto: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                },
                Times: {
                    normal: 'Roboto-Regular.ttf',
                    bold: 'Roboto-Medium.ttf',
                    italics: 'Roboto-Italic.ttf',
                    bolditalics: 'Roboto-MediumItalic.ttf'
                }
            };
            fontsInitialized = true;
        } else {
            console.error('CRITICAL: Failed to find PDFMake VFS');
        }
    }
}

// Helper pour convertir une image URL en Base64
async function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error(`Image load timeout for ${url}`));
        }, 5000);

        const img = new Image();
        img.setAttribute('crossOrigin', 'anonymous');
        img.onload = () => {
            clearTimeout(timeoutId);
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } else {
                    reject(new Error('Canvas context is null'));
                }
            } catch (e) {
                reject(e);
            }
        };
        img.onerror = error => {
            clearTimeout(timeoutId);
            reject(error);
        };
        img.src = url;
    });
}

// === TYPES ===

export type MunicipalDocumentType = 
    | 'communique'
    | 'note_service'
    | 'arrete'
    | 'decision'
    | 'convocation'
    | 'attestation'
    | 'lettre';

export interface MunicipalDocumentData {
    type: MunicipalDocumentType;
    reference: string;
    objet?: string;
    contenu: string[];
    signataire: {
        fonction: string;
        nom: string;
    };
    date?: string;
    lieu?: string;
    ampliations?: string[];
    destinataire?: string;
    province?: string;
    commune?: string;
    service?: string;
    logoUrl?: string;
}

export interface MunicipalDocumentSettings {
    province: string;
    commune: string;
    service: string;
    republique: string;
    devise: string;
    logoUrl: string;
    contactBP: string;
    contactEmail: string;
    contactTel?: string;
    maireName?: string;
}

// === PARAMÈTRES PAR DÉFAUT (Mairie de Libreville) ===

const DEFAULT_MUNICIPAL_SETTINGS: MunicipalDocumentSettings = {
    province: "PROVINCE DE L'ESTUAIRE",
    commune: "COMMUNE DE LIBREVILLE",
    service: "CABINET DU MAIRE",
    republique: "REPUBLIQUE GABONAISE",
    devise: "Union - Travail - Justice",
    logoUrl: "/assets/logos/logo_mairie_libreville.png",
    contactBP: "BP : 44 Boulevard Triomphal/LBV",
    contactEmail: "mairiedelibreville@gmail.com",
    maireName: "Eugène MBA"
};

// === COULEURS ===
const COLORS = {
    primary: '#1a365d',      // Bleu foncé
    stampBlue: '#0000AA',    // Bleu style tampon
    text: '#000000',
    muted: '#666666',
    accent: '#009E60'        // Vert Gabon
};

/**
 * Génère un document municipal officiel conforme à la charte graphique
 * de la Mairie de Libreville
 */
export async function generateMunicipalDocument(
    data: MunicipalDocumentData,
    settings: Partial<MunicipalDocumentSettings> = {}
): Promise<Blob> {
    initializeFonts();

    const config = { ...DEFAULT_MUNICIPAL_SETTINGS, ...settings };
    
    const currentDate = data.date || new Date().toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
    
    const lieu = data.lieu || 'Libreville';

    // Charger le logo
    let logoBase64: string | null = null;
    try {
        const logoUrl = data.logoUrl || config.logoUrl;
        if (logoUrl) {
            logoBase64 = await getBase64ImageFromURL(logoUrl);
        }
    } catch (e) {
        console.warn('Impossible de charger le logo municipal:', e);
    }

    // === EN-TÊTE TRIPARTITE ===
    const headerTable = {
        table: {
            widths: ['35%', '30%', '35%'],
            body: [
                [
                    // GAUCHE - Hiérarchie administrative
                    {
                        stack: [
                            { text: data.province || config.province, fontSize: 9, alignment: 'center', margin: [0, 0, 0, 2] },
                            { text: data.commune || config.commune, fontSize: 9, alignment: 'center', margin: [0, 0, 0, 2] },
                            { text: data.service || config.service, fontSize: 9, bold: true, alignment: 'center', margin: [0, 0, 0, 8] },
                            { text: '--------', fontSize: 8, alignment: 'center', color: COLORS.muted },
                            { text: `N° ${data.reference}`, fontSize: 10, color: COLORS.stampBlue, alignment: 'center', margin: [0, 8, 0, 0] }
                        ],
                        border: [false, false, false, false]
                    },
                    // CENTRE - Logo
                    {
                        stack: [
                            logoBase64 
                                ? { image: logoBase64, width: 65, alignment: 'center', margin: [0, 0, 0, 5] }
                                : { text: '[ARMOIRIES]', fontSize: 10, alignment: 'center', color: COLORS.muted }
                        ],
                        border: [false, false, false, false]
                    },
                    // DROITE - République
                    {
                        stack: [
                            { text: config.republique, fontSize: 11, bold: true, alignment: 'center', margin: [0, 0, 0, 2] },
                            { text: config.devise, fontSize: 9, italics: true, alignment: 'center', margin: [0, 0, 0, 5] },
                            { text: '--------', fontSize: 8, alignment: 'center', color: COLORS.muted }
                        ],
                        border: [false, false, false, false]
                    }
                ]
            ]
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 25] as [number, number, number, number]
    };

    // === TITRE DU DOCUMENT ===
    const documentTitle = getDocumentTitle(data.type);
    const titleSection = {
        text: documentTitle,
        fontSize: 16,
        bold: true,
        decoration: 'underline' as const,
        alignment: 'center' as const,
        margin: [0, 10, 0, 20] as [number, number, number, number]
    };

    // === OBJET (pour notes de service) ===
    const objetSection = data.objet ? {
        columns: [
            { text: 'Objet : ', bold: true, fontSize: 11, width: 'auto' },
            { text: data.objet, fontSize: 11, italics: true }
        ],
        margin: [0, 0, 0, 15] as [number, number, number, number]
    } : null;

    // === CORPS DU TEXTE ===
    const bodyContent = data.contenu.map(paragraph => ({
        text: paragraph,
        fontSize: 11,
        alignment: 'justify' as const,
        lineHeight: 1.4,
        margin: [0, 0, 0, 10] as [number, number, number, number],
        preserveLeadingSpaces: true
    }));

    // === DATE ET SIGNATURE (alignés à droite) ===
    const signatureSection = {
        stack: [
            { text: `Fait à ${lieu}, le ${currentDate}`, fontSize: 11, alignment: 'right' as const, margin: [0, 30, 0, 15] },
            { text: data.signataire.fonction, fontSize: 11, bold: true, alignment: 'right' as const, margin: [0, 0, 0, 5] },
            { text: '', margin: [0, 40, 0, 0] }, // Espace pour signature manuscrite
            { text: data.signataire.nom, fontSize: 11, bold: true, alignment: 'right' as const, decoration: 'underline' as const }
        ],
        margin: [0, 20, 0, 0] as [number, number, number, number]
    };

    // === SECTION AMPLIATIONS (en bas à gauche) ===
    const ampliationsSection = data.ampliations && data.ampliations.length > 0 ? {
        stack: [
            { text: 'Ampliations :', fontSize: 9, bold: true, decoration: 'underline' as const, margin: [0, 0, 0, 5] },
            ...data.ampliations.map(amp => ({
                text: `- ${amp}`,
                fontSize: 8,
                margin: [5, 0, 0, 2] as [number, number, number, number]
            }))
        ],
        margin: [0, 40, 0, 0] as [number, number, number, number]
    } : null;

    // === PIED DE PAGE ===
    const footerContent = (currentPage: number, pageCount: number) => ({
        stack: [
            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: COLORS.muted }] },
            { 
                text: `${config.contactBP}\nE-mail : ${config.contactEmail}${config.contactTel ? `\nTél : ${config.contactTel}` : ''}`, 
                fontSize: 8, 
                alignment: 'center' as const,
                color: COLORS.muted,
                margin: [0, 5, 0, 0]
            }
        ],
        margin: [40, 0, 40, 20]
    });

    // === CONSTRUCTION DU DOCUMENT ===
    const content: any[] = [
        headerTable,
        titleSection
    ];

    // Ajouter l'objet si présent
    if (objetSection) {
        content.push(objetSection);
    }

    // Ajouter le corps du texte
    content.push(...bodyContent);

    // Section signature et ampliations côte à côte
    if (ampliationsSection) {
        content.push({
            columns: [
                { width: '50%', ...ampliationsSection },
                { width: '50%', ...signatureSection }
            ],
            margin: [0, 20, 0, 0]
        });
    } else {
        content.push(signatureSection);
    }

    const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [50, 40, 50, 70],
        footer: footerContent,
        content: content,
        defaultStyle: {
            font: 'Times'
        },
        styles: {
            header: { fontSize: 14, bold: true },
            normal: { fontSize: 11, lineHeight: 1.3 }
        }
    };

    // Générer le PDF
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
            reject(new Error('PDF generation timeout'));
        }, 15000);

        try {
            const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
            pdfDocGenerator.getBlob((blob) => {
                clearTimeout(timeoutId);
                resolve(blob);
            });
        } catch (e) {
            clearTimeout(timeoutId);
            reject(e);
        }
    });
}

/**
 * Retourne le titre du document selon son type
 */
function getDocumentTitle(type: MunicipalDocumentType): string {
    const titles: Record<MunicipalDocumentType, string> = {
        'communique': 'COMMUNIQUÉ',
        'note_service': 'NOTE DE SERVICE',
        'arrete': 'ARRÊTÉ',
        'decision': 'DÉCISION',
        'convocation': 'CONVOCATION',
        'attestation': 'ATTESTATION',
        'lettre': 'CORRESPONDANCE'
    };
    return titles[type] || 'DOCUMENT OFFICIEL';
}

/**
 * Génère un document et retourne les informations de téléchargement
 */
export async function generateMunicipalDocumentWithURL(
    data: MunicipalDocumentData,
    settings?: Partial<MunicipalDocumentSettings>
): Promise<{ blob: Blob; url: string; filename: string }> {
    const blob = await generateMunicipalDocument(data, settings);
    const url = URL.createObjectURL(blob);
    
    const safeName = data.signataire.nom.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const filename = `${data.type}_${data.reference.replace(/\//g, '-')}_${safeName}.pdf`;
    
    return { blob, url, filename };
}

/**
 * Télécharge directement le document généré
 */
export async function downloadMunicipalDocument(
    data: MunicipalDocumentData,
    settings?: Partial<MunicipalDocumentSettings>
): Promise<void> {
    const { url, filename } = await generateMunicipalDocumentWithURL(data, settings);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// === TEMPLATES PRÉ-CONFIGURÉS ===

export const MUNICIPAL_TEMPLATES = {
    /**
     * Template Communiqué (style image 1)
     */
    communique: (
        reference: string,
        contenu: string[],
        signataire: { fonction: string; nom: string },
        date?: string
    ): MunicipalDocumentData => ({
        type: 'communique',
        reference,
        contenu,
        signataire,
        date
    }),

    /**
     * Template Note de Service avec Ampliations (style image 2)
     */
    noteService: (
        reference: string,
        objet: string,
        contenu: string[],
        signataire: { fonction: string; nom: string },
        ampliations?: string[],
        date?: string
    ): MunicipalDocumentData => ({
        type: 'note_service',
        reference,
        objet,
        contenu,
        signataire,
        ampliations: ampliations || [
            'Madame et Messieurs les Adjoints au Maire',
            'Monsieur le Secrétaire Général',
            'Mesdames et Messieurs les Directeurs Généraux',
            'Intéressés',
            'Affichage'
        ],
        date
    }),

    /**
     * Template Arrêté Municipal
     */
    arrete: (
        reference: string,
        objet: string,
        articles: string[],
        signataire: { fonction: string; nom: string },
        ampliations?: string[],
        date?: string
    ): MunicipalDocumentData => ({
        type: 'arrete',
        reference,
        objet,
        contenu: [
            'Le Maire de la Commune de Libreville,',
            '',
            'Vu la Constitution ;',
            'Vu la Loi Organique relative à la décentralisation ;',
            'Vu le Code Général des Collectivités Locales ;',
            '',
            'ARRÊTE :',
            '',
            ...articles.map((art, i) => `Article ${i + 1}. – ${art}`)
        ],
        signataire,
        ampliations,
        date
    })
};

// Export du service
export const municipalDocumentService = {
    generate: generateMunicipalDocument,
    generateWithURL: generateMunicipalDocumentWithURL,
    download: downloadMunicipalDocument,
    templates: MUNICIPAL_TEMPLATES,
    defaultSettings: DEFAULT_MUNICIPAL_SETTINGS
};

export default municipalDocumentService;
