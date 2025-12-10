/**
 * Génère un PDF officiel pour un arrêté municipal
 * Utilise le format tripartite conforme à la charte graphique
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Arrete, ArreteType } from '@/services/arrete-service';

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
                }
            };
            fontsInitialized = true;
        } else {
            console.error('Failed to find PDFMake VFS.');
        }
    }
}

const typeLabels: Record<ArreteType, string> = {
    'MUNICIPAL': 'ARRÊTÉ MUNICIPAL',
    'INDIVIDUEL': 'ARRÊTÉ INDIVIDUEL',
    'REGLEMENTAIRE': 'ARRÊTÉ RÉGLEMENTAIRE',
    'TEMPORAIRE': 'ARRÊTÉ TEMPORAIRE'
};

/**
 * Génère un PDF pour un arrêté municipal
 */
export async function generateArretePDF(arrete: Arrete): Promise<{ blob: Blob; url: string; filename: string }> {
    initializeFonts();

    const dateSignature = arrete.dateSignature 
        ? new Date(arrete.dateSignature).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Charger le logo
    let logoBase64: string | null = null;
    try {
        logoBase64 = await getBase64ImageFromURL('/assets/logo_libreville.png');
    } catch (e) {
        console.warn('Could not load municipal logo:', e);
    }

    // === CONSTRUCTION DU HEADER TRIPARTITE ===
    const header: any = {
        columns: [
            {
                width: '*',
                stack: [
                    { text: 'PROVINCE DE L\'ESTUAIRE', style: 'headerLeft', alignment: 'center' },
                    { text: 'COMMUNE DE LIBREVILLE', style: 'headerLeft', alignment: 'center' },
                    { text: 'CABINET DU MAIRE', style: 'headerLeftBold', alignment: 'center' },
                    { text: '', margin: [0, 8, 0, 0] },
                    { text: arrete.numero, style: 'reference', alignment: 'center' }
                ]
            },
            {
                width: 100,
                stack: logoBase64 ? [
                    { image: logoBase64, width: 65, alignment: 'center', margin: [0, 0, 0, 0] }
                ] : [
                    { text: '', margin: [0, 20, 0, 20] }
                ]
            },
            {
                width: '*',
                stack: [
                    { text: 'RÉPUBLIQUE GABONAISE', style: 'headerRightBold', alignment: 'center' },
                    { text: 'Union - Travail - Justice', style: 'headerRightItalic', alignment: 'center' }
                ]
            }
        ],
        columnGap: 15,
        margin: [0, 0, 0, 30]
    };

    // Parse le contenu markdown en sections
    const parseContent = (content: string): any[] => {
        if (!content) return [];
        
        const lines = content.split('\n');
        const elements: any[] = [];
        
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) {
                elements.push({ text: '', margin: [0, 5, 0, 0] });
                return;
            }
            
            if (trimmed.startsWith('### ')) {
                elements.push({ text: trimmed.substring(4), style: 'h3', margin: [0, 10, 0, 5] });
            } else if (trimmed.startsWith('## ')) {
                elements.push({ text: trimmed.substring(3), style: 'h2', margin: [0, 15, 0, 8] });
            } else if (trimmed.startsWith('# ')) {
                elements.push({ text: trimmed.substring(2), style: 'h1', margin: [0, 15, 0, 10] });
            } else if (trimmed.startsWith('- ')) {
                elements.push({ text: '• ' + trimmed.substring(2), style: 'listItem', margin: [20, 3, 0, 3] });
            } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                elements.push({ text: trimmed.slice(2, -2), style: 'bodyBold', margin: [0, 5, 0, 5] });
            } else {
                // Handle inline bold
                const parts = trimmed.split(/\*\*(.+?)\*\*/g);
                if (parts.length > 1) {
                    const textArray = parts.map((part, index) => 
                        index % 2 === 1 ? { text: part, bold: true } : { text: part }
                    ).filter(p => p.text);
                    elements.push({ text: textArray, style: 'bodyText', alignment: 'justify', margin: [0, 3, 0, 3] });
                } else {
                    elements.push({ text: trimmed, style: 'bodyText', alignment: 'justify', margin: [0, 3, 0, 3] });
                }
            }
        });
        
        return elements;
    };

    // Contenu du document
    const content: any[] = [
        header,
        { text: typeLabels[arrete.type], style: 'documentTitle', decoration: 'underline', margin: [0, 0, 0, 15] },
        { text: arrete.title.toUpperCase(), alignment: 'center', style: 'subject', margin: [0, 0, 0, 20] },
        { text: 'LE MAIRE DE LA COMMUNE DE LIBREVILLE,', style: 'bodyText', bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
        { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
        { text: 'Vu la loi organique relative à la décentralisation ;', style: 'listItem', margin: [20, 0, 0, 5] },
        { text: 'Vu le Code des collectivités locales ;', style: 'listItem', margin: [20, 0, 0, 15] },
    ];

    // Ajouter le contenu de l'arrêté
    if (arrete.content) {
        content.push({ text: 'ARRÊTE :', style: 'bodyText', bold: true, alignment: 'center', margin: [0, 10, 0, 15] });
        content.push(...parseContent(arrete.content));
    }

    // Date et signature
    content.push({ text: '', margin: [0, 20, 0, 0] });
    content.push({ text: `Fait à Libreville, le ${dateSignature}`, alignment: 'center', style: 'bodyText', margin: [0, 0, 0, 20] });
    content.push({ text: 'Le Maire de la Commune de Libreville,', alignment: 'right', style: 'signatureTitle', margin: [0, 0, 0, 40] });
    if (arrete.signataire) {
        content.push({ text: arrete.signataire, alignment: 'right', style: 'signatureName' });
    }

    // Dates d'effet
    if (arrete.dateEffet || arrete.dateFin) {
        content.push({ text: '', margin: [0, 30, 0, 0] });
        const effectInfo: string[] = [];
        if (arrete.dateEffet) {
            effectInfo.push(`Date d'entrée en vigueur : ${new Date(arrete.dateEffet).toLocaleDateString('fr-FR')}`);
        }
        if (arrete.dateFin) {
            effectInfo.push(`Date de fin d'application : ${new Date(arrete.dateFin).toLocaleDateString('fr-FR')}`);
        }
        content.push({ text: effectInfo.join('\n'), style: 'footer', alignment: 'left', margin: [0, 0, 0, 0] });
    }

    const documentDefinition: any = {
        pageSize: 'A4',
        pageMargins: [40, 40, 40, 60],
        content,
        footer: (currentPage: number, pageCount: number) => ({
            stack: [
                { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    text: `BP : 44 Boulevard Triomphal/LBV | E-mail : libreville@mairie.ga`,
                    alignment: 'center',
                    style: 'footerText',
                    margin: [40, 8, 40, 0]
                },
                {
                    text: `Page ${currentPage} / ${pageCount}`,
                    alignment: 'center',
                    style: 'pageNumber',
                    margin: [0, 5, 0, 0]
                }
            ]
        }),
        styles: {
            headerLeft: { fontSize: 9, color: '#333333' },
            headerLeftBold: { fontSize: 9, bold: true, color: '#1e3a8a' },
            headerRightBold: { fontSize: 10, bold: true, color: '#1e3a8a' },
            headerRightItalic: { fontSize: 9, italics: true, color: '#333333' },
            reference: { fontSize: 9, bold: true, color: '#333333' },
            documentTitle: { fontSize: 16, bold: true, alignment: 'center', color: '#1e3a8a' },
            subject: { fontSize: 12, bold: true, color: '#333333' },
            h1: { fontSize: 14, bold: true, color: '#1e3a8a' },
            h2: { fontSize: 12, bold: true, color: '#1e3a8a' },
            h3: { fontSize: 11, bold: true, color: '#333333' },
            bodyText: { fontSize: 11, lineHeight: 1.4 },
            bodyBold: { fontSize: 11, bold: true, lineHeight: 1.4 },
            listItem: { fontSize: 11, lineHeight: 1.3 },
            signatureTitle: { fontSize: 11, italics: true },
            signatureName: { fontSize: 12, bold: true },
            footer: { fontSize: 9, color: '#666666' },
            footerText: { fontSize: 8, color: '#666666' },
            pageNumber: { fontSize: 8, color: '#999999' }
        },
        defaultStyle: {
            font: 'Roboto'
        }
    };

    return new Promise((resolve, reject) => {
        try {
            const pdfDocGenerator = pdfMake.createPdf(documentDefinition);
            pdfDocGenerator.getBlob((blob: Blob) => {
                const url = URL.createObjectURL(blob);
                const filename = `arrete_${arrete.numero.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                resolve({ blob, url, filename });
            });
        } catch (error) {
            reject(error);
        }
    });
}
