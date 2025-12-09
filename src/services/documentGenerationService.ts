/**
 * Document Generation Service
 * Génère des documents administratifs officiels pour la Mairie de Libreville
 * Basé sur la charte graphique municipale gabonaise
 */

import pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

// Initialize PDFMake fonts
let fontsInitialized = false;
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
        }
    }
}

// Helper to convert image URL to Base64
async function getBase64ImageFromURL(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('Image load timeout')), 5000);
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
                    resolve(canvas.toDataURL('image/png'));
                } else {
                    reject(new Error('Canvas context null'));
                }
            } catch (e) { reject(e); }
        };
        img.onerror = () => { clearTimeout(timeoutId); reject(new Error('Image load error')); };
        img.src = url;
    });
}

/**
 * Document Templates for Municipal Documents
 */
export const DOCUMENT_TEMPLATES = {
    communique: 'COMMUNIQUÉ',
    note_service: 'NOTE DE SERVICE',
    lettre: 'LETTRE',
    arrete: 'ARRÊTÉ',
    deliberation: 'DÉLIBÉRATION',
    rapport: 'RAPPORT',
    attestation: 'ATTESTATION',
    certificat: 'CERTIFICAT',
    convocation: 'CONVOCATION',
    courrier: 'COURRIER OFFICIEL'
} as const;

export type DocumentTemplate = keyof typeof DOCUMENT_TEMPLATES;

/**
 * Municipal Document Configuration
 */
interface MunicipalDocumentConfig {
    province: string;
    commune: string;
    cabinet: string;
    republic: string;
    motto: string;
    signature_title: string;
    signature_name: string;
    footer_address: string;
    footer_email: string;
    logo_url: string;
}

const DEFAULT_MUNICIPAL_CONFIG: MunicipalDocumentConfig = {
    province: 'PROVINCE DE L\'ESTUAIRE',
    commune: 'COMMUNE DE LIBREVILLE',
    cabinet: 'CABINET DU MAIRE',
    republic: 'RÉPUBLIQUE GABONAISE',
    motto: 'Union - Travail - Justice',
    signature_title: 'Le Maire de la Commune de Libreville',
    signature_name: '', // Will be filled dynamically
    footer_address: 'BP : 44 Boulevard Triomphal/LBV',
    footer_email: 'E-mail : mairiedelibreville@gmail.com',
    logo_url: '/assets/logo_libreville.png'
};

export interface GenerateDocumentParams {
    title: string;
    content: string;
    template: DocumentTemplate;
    format: 'pdf' | 'docx';
    reference?: string;
    object?: string;
    recipient?: string;
    recipientOrg?: string;
    contentPoints?: string[];
    signatureAuthority?: string;
    signatureName?: string;
    ampliations?: string[];
    config?: Partial<MunicipalDocumentConfig>;
    onProgress?: (progress: number, status: string) => void;
}

export interface GeneratedDocument {
    blob: Blob;
    fileName: string;
    documentId: string;
    format: 'pdf' | 'docx';
}

class DocumentGenerationService {
    private config: MunicipalDocumentConfig = DEFAULT_MUNICIPAL_CONFIG;
    private logoBase64: string | null = null;

    /**
     * Load the municipal logo
     */
    private async loadLogo(): Promise<void> {
        if (this.logoBase64) return;
        try {
            this.logoBase64 = await getBase64ImageFromURL(this.config.logo_url);
        } catch (e) {
            console.warn('Could not load municipal logo:', e);
        }
    }

    /**
     * Generate reference number
     */
    private generateReference(): string {
        const year = new Date().getFullYear();
        const num = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
        return `N° ${num}/PE/CL/CAB-DC`;
    }

    /**
     * Format current date in French
     */
    private formatDate(): string {
        return new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    /**
     * Build the tripartite header (Left: Admin hierarchy | Center: Logo | Right: Republic)
     */
    private buildHeader(reference?: string): any {
        const leftColumn = {
            width: 'auto',
            stack: [
                { text: this.config.province, style: 'headerLeft', alignment: 'center' },
                { text: this.config.commune, style: 'headerLeft', alignment: 'center' },
                { text: this.config.cabinet, style: 'headerLeftBold', alignment: 'center' },
                { text: '', margin: [0, 5, 0, 0] },
                { text: reference || this.generateReference(), style: 'reference', alignment: 'center' }
            ]
        };

        const centerColumn = {
            width: 80,
            stack: this.logoBase64 ? [
                { image: this.logoBase64, width: 60, alignment: 'center' }
            ] : [
                { text: '[LOGO]', alignment: 'center', color: '#999' }
            ]
        };

        const rightColumn = {
            width: 'auto',
            stack: [
                { text: this.config.republic, style: 'headerRightBold', alignment: 'center' },
                { text: this.config.motto, style: 'headerRightItalic', alignment: 'center' }
            ]
        };

        return {
            columns: [leftColumn, centerColumn, rightColumn],
            columnGap: 20,
            margin: [0, 0, 0, 30]
        };
    }

    /**
     * Build signature block
     */
    private buildSignature(signatureTitle?: string, signatureName?: string): any[] {
        return [
            { text: '\n\n' },
            { text: `Fait à Libreville, le ${this.formatDate()}`, alignment: 'right', style: 'bodyText' },
            { text: '\n' },
            { text: signatureTitle || this.config.signature_title + ',', alignment: 'right', style: 'signatureTitle' },
            { text: '\n\n\n' }, // Space for signature
            { text: signatureName || this.config.signature_name, alignment: 'right', style: 'signatureName' }
        ];
    }

    /**
     * Build ampliations block (for Note de Service)
     */
    private buildAmpliations(ampliations?: string[]): any[] {
        if (!ampliations || ampliations.length === 0) return [];
        return [
            { text: '\n\n' },
            { text: 'Ampliations :', style: 'ampliationsTitle' },
            {
                ul: ampliations.map(a => ({ text: a, style: 'ampliationsItem' })),
                margin: [20, 5, 0, 0]
            }
        ];
    }

    /**
     * Build footer
     */
    private buildFooter(): any {
        return (currentPage: number, pageCount: number) => ({
            stack: [
                { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#cccccc' }] },
                {
                    text: `${this.config.footer_address}\n${this.config.footer_email}`,
                    alignment: 'center',
                    style: 'footer',
                    margin: [40, 10, 40, 0]
                }
            ],
            margin: [0, 10, 0, 20]
        });
    }

    /**
     * Generate COMMUNIQUÉ
     */
    private buildCommunique(params: GenerateDocumentParams): any[] {
        const content: any[] = [
            this.buildHeader(params.reference),
            { text: 'COMMUNIQUÉ', style: 'documentTitle', decoration: 'underline' },
            { text: '\n' }
        ];

        // Content paragraphs
        if (params.contentPoints && params.contentPoints.length > 0) {
            params.contentPoints.forEach(point => {
                content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
            });
        } else if (params.content) {
            content.push({ text: params.content, style: 'bodyText', alignment: 'justify' });
        }

        content.push(...this.buildSignature(params.signatureAuthority, params.signatureName));
        return content;
    }

    /**
     * Generate NOTE DE SERVICE
     */
    private buildNoteService(params: GenerateDocumentParams): any[] {
        const content: any[] = [
            this.buildHeader(params.reference),
            { text: 'NOTE DE SERVICE', style: 'documentTitle', decoration: 'underline' },
            { text: '\n' },
            { text: [{ text: 'Objet : ', bold: true }, params.object || params.title], style: 'objectLine' },
            { text: '\n' }
        ];

        // Content
        if (params.contentPoints && params.contentPoints.length > 0) {
            params.contentPoints.forEach(point => {
                content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
            });
        } else if (params.content) {
            content.push({ text: params.content, style: 'bodyText', alignment: 'justify' });
        }

        // Signature
        content.push(...this.buildSignature(params.signatureAuthority, params.signatureName));

        // Ampliations
        content.push(...this.buildAmpliations(params.ampliations || [
            'Madame et Messieurs les Adjoints au Maire',
            'Monsieur le Secrétaire Général',
            'Mesdames et Messieurs les Directeurs Généraux',
            'Intéressés',
            'Affichage'
        ]));

        return content;
    }

    /**
     * Generate LETTRE / COURRIER
     */
    private buildLettre(params: GenerateDocumentParams): any[] {
        const content: any[] = [
            this.buildHeader(params.reference),
            { text: '\n' },
            { text: `Libreville, le ${this.formatDate()}`, alignment: 'right', style: 'dateLine' },
            { text: '\n' }
        ];

        // Recipient
        if (params.recipient) {
            content.push({
                stack: [
                    { text: `À l'attention de ${params.recipient}`, bold: true },
                    params.recipientOrg ? { text: params.recipientOrg, italics: true } : {}
                ],
                margin: [0, 0, 0, 15]
            });
        }

        // Object
        if (params.object || params.title) {
            content.push({
                text: [{ text: 'Objet : ', bold: true }, params.object || params.title],
                style: 'objectLine',
                margin: [0, 0, 0, 15]
            });
        }

        // Salutation
        content.push({ text: 'Monsieur/Madame,', margin: [0, 0, 0, 10] });

        // Body
        if (params.contentPoints && params.contentPoints.length > 0) {
            params.contentPoints.forEach((point, index) => {
                content.push({
                    text: point,
                    style: 'bodyText',
                    alignment: 'justify',
                    margin: [0, 5, 0, 5]
                });
            });
        } else if (params.content) {
            content.push({ text: params.content, style: 'bodyText', alignment: 'justify' });
        }

        // Closing
        content.push({ text: '\n' });
        content.push({
            text: 'Veuillez agréer, Monsieur/Madame, l\'expression de ma haute considération.',
            style: 'bodyText'
        });

        content.push(...this.buildSignature(params.signatureAuthority, params.signatureName));
        return content;
    }

    /**
     * Generate ATTESTATION / CERTIFICAT
     */
    private buildAttestation(params: GenerateDocumentParams): any[] {
        const content: any[] = [
            this.buildHeader(params.reference),
            { text: params.template === 'certificat' ? 'CERTIFICAT' : 'ATTESTATION', style: 'documentTitle', decoration: 'underline' },
            { text: '\n\n' },
            { text: 'Je soussigné, Maire de la Commune de Libreville,', style: 'bodyText' },
            { text: '\n' }
        ];

        // Body
        if (params.contentPoints && params.contentPoints.length > 0) {
            params.contentPoints.forEach(point => {
                content.push({ text: point, style: 'bodyText', alignment: 'justify', margin: [0, 5, 0, 5] });
            });
        } else if (params.content) {
            content.push({ text: params.content, style: 'bodyText', alignment: 'justify' });
        }

        content.push({ text: '\n' });
        content.push({
            text: 'En foi de quoi, la présente attestation est délivrée pour servir et valoir ce que de droit.',
            style: 'bodyText',
            italics: true
        });

        content.push(...this.buildSignature(params.signatureAuthority, params.signatureName));
        return content;
    }

    /**
     * Main document generation method
     */
    async generateDocument(params: GenerateDocumentParams): Promise<GeneratedDocument> {
        initializeFonts();
        await this.loadLogo();

        // Merge custom config
        if (params.config) {
            this.config = { ...DEFAULT_MUNICIPAL_CONFIG, ...params.config };
        }

        params.onProgress?.(10, 'Préparation du document...');

        // Select template builder
        let content: any[];
        switch (params.template) {
            case 'communique':
                content = this.buildCommunique(params);
                break;
            case 'note_service':
                content = this.buildNoteService(params);
                break;
            case 'lettre':
            case 'courrier':
                content = this.buildLettre(params);
                break;
            case 'attestation':
            case 'certificat':
                content = this.buildAttestation(params);
                break;
            default:
                content = this.buildLettre(params);
        }

        params.onProgress?.(50, 'Génération du PDF...');

        const documentDefinition = {
            pageSize: 'A4',
            pageMargins: [60, 40, 60, 80],
            content: content,
            footer: this.buildFooter(),
            styles: {
                headerLeft: { fontSize: 9, font: 'Roboto' },
                headerLeftBold: { fontSize: 9, bold: true, font: 'Roboto' },
                headerRightBold: { fontSize: 11, bold: true, font: 'Roboto' },
                headerRightItalic: { fontSize: 9, italics: true, font: 'Roboto' },
                reference: { fontSize: 10, color: '#000080', font: 'Roboto' }, // Blue like stamp
                documentTitle: { fontSize: 16, bold: true, alignment: 'center', margin: [0, 20, 0, 20], font: 'Roboto' },
                objectLine: { fontSize: 12, margin: [0, 5, 0, 10], font: 'Roboto' },
                dateLine: { fontSize: 11, font: 'Roboto' },
                bodyText: { fontSize: 12, lineHeight: 1.4, font: 'Times' },
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

        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => reject(new Error('PDF generation timeout')), 15000);

            try {
                params.onProgress?.(70, 'Finalisation...');
                const pdfDocGenerator = pdfMake.createPdf(documentDefinition);

                pdfDocGenerator.getBlob((blob) => {
                    clearTimeout(timeoutId);
                    params.onProgress?.(100, 'Terminé');

                    const fileName = `${DOCUMENT_TEMPLATES[params.template] || 'Document'}_${Date.now()}.pdf`;
                    const documentId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                    resolve({
                        blob,
                        fileName,
                        documentId,
                        format: 'pdf'
                    });
                });
            } catch (e) {
                clearTimeout(timeoutId);
                reject(e);
            }
        });
    }
}

export const documentGenerationService = new DocumentGenerationService();
