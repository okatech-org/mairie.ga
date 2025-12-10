/**
 * Génère un PDF officiel pour une délibération municipale
 * Utilise le format tripartite conforme à la charte graphique
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Deliberation, DeliberationResult } from '@/services/deliberation-service';

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

const resultLabels: Record<DeliberationResult, string> = {
    'ADOPTED': 'ADOPTÉE',
    'REJECTED': 'REJETÉE',
    'POSTPONED': 'AJOURNÉE',
    'WITHDRAWN': 'RETIRÉE'
};

const resultColors: Record<DeliberationResult, string> = {
    'ADOPTED': '#16a34a',
    'REJECTED': '#dc2626',
    'POSTPONED': '#f59e0b',
    'WITHDRAWN': '#6b7280'
};

/**
 * Génère un PDF pour une délibération municipale
 */
export async function generateDeliberationPDF(deliberation: Deliberation): Promise<{ blob: Blob; url: string; filename: string }> {
    initializeFonts();

    const dateSession = new Date(deliberation.sessionDate).toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'long', 
        year: 'numeric' 
    });

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
                    { text: 'CONSEIL MUNICIPAL', style: 'headerLeftBold', alignment: 'center' },
                    { text: '', margin: [0, 8, 0, 0] },
                    { text: deliberation.numero, style: 'reference', alignment: 'center' }
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
        { text: 'DÉLIBÉRATION', style: 'documentTitle', decoration: 'underline', margin: [0, 0, 0, 15] },
        { text: deliberation.title.toUpperCase(), alignment: 'center', style: 'subject', margin: [0, 0, 0, 20] },
        { text: `Séance du ${dateSession}`, alignment: 'center', style: 'sessionDate', margin: [0, 0, 0, 20] },
    ];

    // Rapporteur si présent
    if (deliberation.rapporteur) {
        content.push({ text: `Rapporteur : ${deliberation.rapporteur}`, style: 'bodyText', bold: true, margin: [0, 0, 0, 15] });
    }

    // Visa réglementaire
    content.push(
        { text: 'LE CONSEIL MUNICIPAL DE LIBREVILLE,', style: 'bodyText', bold: true, alignment: 'center', margin: [0, 0, 0, 15] },
        { text: 'Vu la Constitution ;', style: 'listItem', margin: [20, 0, 0, 5] },
        { text: 'Vu la loi organique relative à la décentralisation ;', style: 'listItem', margin: [20, 0, 0, 5] },
        { text: 'Vu le Code des collectivités locales ;', style: 'listItem', margin: [20, 0, 0, 5] },
        { text: 'Après en avoir délibéré ;', style: 'listItem', margin: [20, 0, 0, 15] }
    );

    // Ajouter le contenu de la délibération
    if (deliberation.content) {
        content.push({ text: 'DÉLIBÈRE :', style: 'bodyText', bold: true, alignment: 'center', margin: [0, 10, 0, 15] });
        content.push(...parseContent(deliberation.content));
    }

    // Résultat du vote
    if (deliberation.resultat) {
        content.push({ text: '', margin: [0, 20, 0, 0] });
        content.push({
            table: {
                widths: ['*'],
                body: [[
                    {
                        text: `La présente délibération est ${resultLabels[deliberation.resultat]}`,
                        alignment: 'center',
                        bold: true,
                        fontSize: 14,
                        color: resultColors[deliberation.resultat],
                        margin: [10, 15, 10, 15]
                    }
                ]]
            },
            layout: {
                hLineWidth: () => 2,
                vLineWidth: () => 2,
                hLineColor: () => resultColors[deliberation.resultat],
                vLineColor: () => resultColors[deliberation.resultat]
            },
            margin: [0, 0, 0, 20]
        });
    }

    // Votes détaillés
    if (deliberation.votesPour !== undefined || deliberation.votesContre !== undefined || deliberation.abstentions !== undefined) {
        content.push({ text: 'Résultats du vote :', style: 'h3', margin: [0, 10, 0, 10] });
        
        const voteTable: any = {
            table: {
                widths: ['*', '*', '*'],
                body: [
                    [
                        { text: 'POUR', alignment: 'center', bold: true, fillColor: '#dcfce7', color: '#16a34a' },
                        { text: 'CONTRE', alignment: 'center', bold: true, fillColor: '#fee2e2', color: '#dc2626' },
                        { text: 'ABSTENTIONS', alignment: 'center', bold: true, fillColor: '#fef3c7', color: '#d97706' }
                    ],
                    [
                        { text: String(deliberation.votesPour || 0), alignment: 'center', fontSize: 18, bold: true },
                        { text: String(deliberation.votesContre || 0), alignment: 'center', fontSize: 18, bold: true },
                        { text: String(deliberation.abstentions || 0), alignment: 'center', fontSize: 18, bold: true }
                    ]
                ]
            },
            layout: 'lightHorizontalLines',
            margin: [0, 0, 0, 20]
        };
        content.push(voteTable);
    }

    // Signature
    content.push({ text: '', margin: [0, 20, 0, 0] });
    content.push({ text: `Fait et délibéré en séance publique, le ${dateSession}`, alignment: 'center', style: 'bodyText', margin: [0, 0, 0, 20] });
    content.push({ text: 'Le Maire de la Commune de Libreville,', alignment: 'right', style: 'signatureTitle', margin: [0, 0, 0, 5] });
    content.push({ text: 'Président du Conseil Municipal', alignment: 'right', style: 'signatureSubtitle', margin: [0, 0, 0, 40] });

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
            sessionDate: { fontSize: 11, italics: true, color: '#666666' },
            h1: { fontSize: 14, bold: true, color: '#1e3a8a' },
            h2: { fontSize: 12, bold: true, color: '#1e3a8a' },
            h3: { fontSize: 11, bold: true, color: '#333333' },
            bodyText: { fontSize: 11, lineHeight: 1.4 },
            bodyBold: { fontSize: 11, bold: true, lineHeight: 1.4 },
            listItem: { fontSize: 11, lineHeight: 1.3 },
            signatureTitle: { fontSize: 11, italics: true },
            signatureSubtitle: { fontSize: 10, color: '#666666' },
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
                const filename = `deliberation_${deliberation.numero.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
                resolve({ blob, url, filename });
            });
        } catch (error) {
            reject(error);
        }
    });
}
