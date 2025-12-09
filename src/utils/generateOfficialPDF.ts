/**
 * Génère des documents PDF officiels pour la Mairie de Libreville
 * Respecte la charte graphique municipale gabonaise
 * 
 * Structure du Header (Tripartite) :
 * - Gauche: PROVINCE DE L'ESTUAIRE / COMMUNE DE LIBREVILLE / CABINET DU MAIRE + N° Référence
 * - Centre: Logo/Armoiries de Libreville
 * - Droite: RÉPUBLIQUE GABONAISE / Union - Travail - Justice
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { supabase } from '@/integrations/supabase/client';

// Flag pour s'assurer qu'on initialise qu'une seule fois
let fontsInitialized = false;

// Helper pour convertir une image URL en Base64 avec timeout
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

// Fonction pour initialiser les fonts de manière lazy
function initializeFonts() {
    if (!fontsInitialized) {
        console.log('Initializing PDFMake fonts...');

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
            console.log('PDFMake VFS assigned successfully.');

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
            console.error('CRITICAL: Failed to find PDFMake VFS.');
        }
    }
}

// Types de documents municipaux
export interface DocumentData {
    type: 'lettre' | 'communique' | 'note_service' | 'arrete' | 'deliberation' | 'rapport' | 'attestation' | 'certificat' | 'convocation' | 'note' | 'decret' | 'circulaire' | 'nomination';
    recipient?: string;
    recipientOrg?: string;
    subject: string;
    object?: string;
    content_points?: string[];
    signature_authority?: string;
    signature_name?: string;
    reference?: string;
    date?: string;
    serviceContext?: string;
    ampliations?: string[];
}

interface MunicipalSettings {
    province: string;
    commune: string;
    cabinet: string;
    republic: string;
    motto: string;
    signature_default_title: string;
    footer_address: string;
    footer_email: string;
    logo_url: string;
    primary_color: string;
}

const DEFAULT_MUNICIPAL_SETTINGS: MunicipalSettings = {
    province: 'PROVINCE DE L\'ESTUAIRE',
    commune: 'COMMUNE DE LIBREVILLE',
    cabinet: 'CABINET DU MAIRE',
    republic: 'RÉPUBLIQUE GABONAISE',
    motto: 'Union - Travail - Justice',
    signature_default_title: 'Le Maire de la Commune de Libreville',
    footer_address: 'BP : 44 Boulevard Triomphal/LBV',
    footer_email: 'E-mail : libreville@mairie.ga',
    logo_url: '/assets/logo_libreville.png',
    primary_color: '#1e3a8a'
};

async function fetchMunicipalSettings(serviceRole: string): Promise<MunicipalSettings> {
    try {
        const { data } = await supabase
            .from('service_document_settings' as any)
            .select('*')
            .eq('service_role', serviceRole)
            .single();

        if (data) {
            const s = data as any;
            return {
                province: s.province || DEFAULT_MUNICIPAL_SETTINGS.province,
                commune: s.commune || DEFAULT_MUNICIPAL_SETTINGS.commune,
                cabinet: s.cabinet || DEFAULT_MUNICIPAL_SETTINGS.cabinet,
                republic: s.republic || DEFAULT_MUNICIPAL_SETTINGS.republic,
                motto: s.motto || DEFAULT_MUNICIPAL_SETTINGS.motto,
                signature_default_title: s.signature_title || DEFAULT_MUNICIPAL_SETTINGS.signature_default_title,
                footer_address: s.footer_address || DEFAULT_MUNICIPAL_SETTINGS.footer_address,
                footer_email: s.footer_email || DEFAULT_MUNICIPAL_SETTINGS.footer_email,
                logo_url: s.logo_url || DEFAULT_MUNICIPAL_SETTINGS.logo_url,
                primary_color: s.primary_color || DEFAULT_MUNICIPAL_SETTINGS.primary_color
            };
        }
    } catch (e) {
        console.warn('Using default municipal settings');
    }
    return DEFAULT_MUNICIPAL_SETTINGS;
}

/**
 * Génère un document officiel PDF pour la Mairie de Libreville
 * Utilise le format tripartite en-tête conforme à la charte graphique
 */
export async function generateOfficialPDF(data: DocumentData): Promise<Blob> {
    initializeFonts();

    const serviceRole = data.serviceContext || 'maire';
    const settings = await fetchMunicipalSettings(serviceRole);

    const currentDate = data.date || new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const referenceNum = data.reference || `N° ${Math.floor(Math.random() * 99999).toString().padStart(5, '0')}/PE/CL/CAB-DC`;

    // Charger le logo
    let logoBase64: string | null = null;
    try {
        if (settings.logo_url) {
            logoBase64 = await getBase64ImageFromURL(settings.logo_url);
        }
    } catch (e) {
        console.warn('Could not load municipal logo:', e);
    }

    // === CONSTRUCTION DU HEADER TRIPARTITE ===
    const buildHeader = (): any => ({
        columns: [
            // GAUCHE: Hiérarchie administrative
            {
                width: '*',
                stack: [
                    { text: settings.province, style: 'headerLeft', alignment: 'center' },
                    { text: settings.commune, style: 'headerLeft', alignment: 'center' },
                    { text: settings.cabinet, style: 'headerLeftBold', alignment: 'center' },
                    { text: '', margin: [0, 8, 0, 0] },
                    { text: referenceNum, style: 'reference', alignment: 'center' }
                ]
            },
            // CENTRE: Logo/Armoiries
            {
                width: 100,
                stack: logoBase64 ? [
                    { image: logoBase64, width: 65, alignment: 'center', margin: [0, 0, 0, 0] }
                ] : [
                    { text: '', margin: [0, 20, 0, 20] }
                ]
            },
            // DROITE: République
            {
                width: '*',
                stack: [
                    { text: settings.republic, style: 'headerRightBold', alignment: 'center' },
                    { text: settings.motto, style: 'headerRightItalic', alignment: 'center' }
                ]
            }
        ],
        columnGap: 15,
        margin: [0, 0, 0, 25]
    });

    // === CONSTRUCTION DU FOOTER ===
    const buildFooter = () => (currentPage: number, pageCount: number) => ({
        stack: [
            { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }] },
            {
                text: `${settings.footer_address}\n${settings.footer_email}`,
                alignment: 'center',
                style: 'footer',
                margin: [40, 8, 40, 0]
            }
        ]
    });

    // === CONTENU SELON LE TYPE ===
    let content: any[] = [buildHeader()];

    switch (data.type) {
        case 'communique':
            content.push({ text: 'COMMUNIQUÉ', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'right', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title + ',', alignment: 'right', style: 'signatureTitle' });
            content.push({ text: '\n\n\n' });
            content.push({ text: data.signature_name || '', alignment: 'right', style: 'signatureName' });
            break;

        case 'note_service':
        case 'note':
            content.push({ text: 'NOTE DE SERVICE', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n' });
            content.push({ text: [{ text: 'Objet : ', bold: true }, data.object || data.subject], style: 'objectLine' });
            content.push({ text: '\n' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: '\n' });
            content.push({ text: 'J\'attache du prix à la stricte application de la présente Note de Service.', style: 'bodyText', italics: true });
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'right', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title + ',', alignment: 'right', style: 'signatureTitle' });
            content.push({ text: '\n\n\n' });
            content.push({ text: data.signature_name || '', alignment: 'right', style: 'signatureName' });
            // Ampliations
            if (data.ampliations && data.ampliations.length > 0) {
                content.push({ text: '\n\nAmpliations :', style: 'ampliationsTitle' });
                content.push({ ul: data.ampliations.map(a => ({ text: a, style: 'ampliationsItem' })), margin: [20, 5, 0, 0] });
            }
            break;

        case 'lettre':
        case 'circulaire':
            content.push({ text: `Libreville, le ${currentDate}`, alignment: 'right', style: 'dateLine', margin: [0, 0, 0, 15] });
            if (data.recipient) {
                content.push({
                    stack: [
                        { text: `À l'attention de ${data.recipient}`, bold: true },
                        data.recipientOrg ? { text: data.recipientOrg, italics: true } : {}
                    ],
                    margin: [0, 0, 0, 15]
                });
            }
            content.push({ text: [{ text: 'Objet : ', bold: true }, data.subject], style: 'objectLine', margin: [0, 0, 0, 15] });
            content.push({ text: 'Monsieur/Madame,', margin: [0, 0, 0, 10] });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: '\nVeuillez agréer, Monsieur/Madame, l\'expression de ma haute considération.', style: 'bodyText' });
            content.push({ text: '\n\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'right', style: 'signatureTitle' });
            content.push({ text: '\n\n\n' });
            content.push({ text: data.signature_name || '', alignment: 'right', style: 'signatureName' });
            break;

        case 'attestation':
        case 'certificat':
            content.push({ text: data.type === 'certificat' ? 'CERTIFICAT' : 'ATTESTATION', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n\n' });
            content.push({ text: 'Je soussigné, Maire de la Commune de Libreville, atteste que :', style: 'bodyText' });
            content.push({ text: '\n' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: '\n' });
            content.push({ text: 'En foi de quoi, la présente attestation est délivrée pour servir et valoir ce que de droit.', style: 'bodyText', italics: true });
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'right', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'right', style: 'signatureTitle' });
            content.push({ text: '\n\n\n' });
            content.push({ text: data.signature_name || '', alignment: 'right', style: 'signatureName' });
            break;

        case 'arrete':
        case 'decret':
        case 'deliberation':
            content.push({ text: data.type === 'deliberation' ? 'DÉLIBÉRATION' : (data.type === 'decret' ? 'DÉCRET' : 'ARRÊTÉ'), style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n' });
            content.push({ text: (data.subject || '').toUpperCase(), alignment: 'center', style: 'bodyText', bold: true });
            content.push({ text: '\n' });
            content.push({ text: 'LE MAIRE DE LA COMMUNE DE LIBREVILLE,', style: 'bodyText', bold: true, alignment: 'center' });
            content.push({ text: '\n' });
            content.push({ text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] });
            content.push({ text: 'Vu la loi organique relative à l\'administration territoriale ;', style: 'listItem', margin: [20, 0, 0, 5] });
            content.push({ text: '\n' });
            content.push({ text: 'ARRÊTE :', style: 'bodyText', bold: true, alignment: 'center' });
            content.push({ text: '\n' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach((point, index) => {
                    content.push({
                        text: point.startsWith('Article') ? point : `Article ${index + 1}. ${point}`,
                        style: 'listItem',
                        margin: [0, 8, 0, 8],
                        bold: true
                    });
                });
            }
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'center', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'center', style: 'signatureTitle' });
            break;

        case 'rapport':
            content.push({ text: 'RAPPORT', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: data.subject.toUpperCase(), alignment: 'center', style: 'bodyText', bold: true, margin: [0, 10, 0, 10] });
            content.push({ text: `Date : ${currentDate}`, style: 'dateLine' });
            if (data.recipient) {
                content.push({ text: `Destinataire : ${data.recipient}`, style: 'dateLine' });
            }
            content.push({ text: '\n' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 10, 0, 10] });
                });
            }
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'right', style: 'signatureTitle' });
            break;

        case 'convocation':
            content.push({ text: 'CONVOCATION', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n' });
            if (data.recipient) {
                content.push({ text: `À l'attention de : ${data.recipient}`, style: 'bodyText', bold: true });
            }
            content.push({ text: [{ text: 'Objet : ', bold: true }, data.subject], style: 'objectLine', margin: [0, 10, 0, 10] });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'right', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'right', style: 'signatureTitle' });
            break;

        case 'nomination':
            content.push({ text: 'ARRÊTÉ DE NOMINATION', style: 'documentTitle', decoration: 'underline' });
            content.push({ text: '\n' });
            content.push({ text: 'LE MAIRE DE LA COMMUNE DE LIBREVILLE,', style: 'bodyText', bold: true, alignment: 'center' });
            content.push({ text: '\n' });
            content.push({ text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] });
            content.push({ text: '\n' });
            content.push({ text: 'ARRÊTE :', style: 'bodyText', bold: true, alignment: 'center' });
            content.push({ text: '\n' });
            content.push({ text: `Article 1. ${data.recipient || ''} est nommé(e) ${data.subject}.`, style: 'bodyText', bold: true });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach((point, index) => {
                    content.push({
                        text: `Article ${index + 2}. ${point}`,
                        style: 'listItem',
                        margin: [0, 8, 0, 8]
                    });
                });
            }
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'center', style: 'bodyText' });
            content.push({ text: '\n' });
            content.push({ text: data.signature_authority || settings.signature_default_title, alignment: 'center', style: 'signatureTitle' });
            break;

        default:
            // Format lettre par défaut
            content.push({ text: data.subject, style: 'documentTitle' });
            if (data.content_points && data.content_points.length > 0) {
                data.content_points.forEach(point => {
                    content.push({ text: point, style: 'bodyText', margin: [0, 5, 0, 5] });
                });
            }
            content.push({ text: `\n\nFait à Libreville, le ${currentDate}`, alignment: 'right' });
    }

    // === DOCUMENT DEFINITION ===
    const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [60, 40, 60, 80],
        content: content,
        footer: buildFooter(),
        styles: {
            headerLeft: { fontSize: 9, font: 'Roboto' },
            headerLeftBold: { fontSize: 9, bold: true, font: 'Roboto' },
            headerRightBold: { fontSize: 11, bold: true, font: 'Roboto' },
            headerRightItalic: { fontSize: 9, italics: true, font: 'Roboto' },
            reference: { fontSize: 10, color: '#000080', font: 'Roboto' },
            documentTitle: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 15, 0, 15], font: 'Roboto' },
            objectLine: { fontSize: 12, margin: [0, 5, 0, 10], font: 'Roboto' },
            dateLine: { fontSize: 11, font: 'Roboto' },
            bodyText: { fontSize: 12, lineHeight: 1.4, font: 'Times' },
            listItem: { fontSize: 12, lineHeight: 1.4, font: 'Times' },
            signatureTitle: { fontSize: 12, bold: true, font: 'Roboto' },
            signatureName: { fontSize: 12, bold: true, font: 'Roboto' },
            ampliationsTitle: { fontSize: 10, bold: true, font: 'Roboto' },
            ampliationsItem: { fontSize: 9, font: 'Roboto' },
            footer: { fontSize: 9, color: '#666666', font: 'Roboto' }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };

    // Générer le PDF
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('PDF generation timeout')), 15000);

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
 * Génère un PDF et retourne une URL de téléchargement
 */
export async function generateOfficialPDFWithURL(data: DocumentData): Promise<{ blob: Blob; url: string; filename: string }> {
    const blob = await generateOfficialPDF(data);
    const url = URL.createObjectURL(blob);

    const typeLabels: Record<string, string> = {
        communique: 'Communique',
        note_service: 'Note_Service',
        lettre: 'Lettre',
        arrete: 'Arrete',
        deliberation: 'Deliberation',
        rapport: 'Rapport',
        attestation: 'Attestation',
        certificat: 'Certificat',
        convocation: 'Convocation'
    };

    const safeSubject = (data.subject || 'document').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').substring(0, 30);
    const filename = `${typeLabels[data.type] || 'Document'}_${safeSubject}_${new Date().getTime()}.pdf`;

    return { blob, url, filename };
}
