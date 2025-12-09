/**
 * Municipal Document Skills pour iAsted
 * 
 * Ce module permet à l'IA vocale de générer des documents municipaux
 * conformes à la charte graphique de la Mairie de Libreville.
 */

import { 
    municipalDocumentService,
    MunicipalDocumentData,
    MunicipalDocumentType,
    MunicipalDocumentSettings
} from '@/services/municipalDocumentService';

// Types pour les commandes vocales
export interface VoiceDocumentCommand {
    type: 'generate_document';
    documentType: MunicipalDocumentType;
    content: string;
    subject?: string;
    reference?: string;
}

export interface DocumentGenerationResult {
    success: boolean;
    documentUrl?: string;
    filename?: string;
    error?: string;
    feedback: string;
}

// Mapping des termes vocaux vers les types de documents
const VOICE_TO_DOCUMENT_TYPE: Record<string, MunicipalDocumentType> = {
    'communiqué': 'communique',
    'communique': 'communique',
    'note de service': 'note_service',
    'note': 'note_service',
    'arrêté': 'arrete',
    'arrete': 'arrete',
    'arrêté municipal': 'arrete',
    'décision': 'decision',
    'decision': 'decision',
    'convocation': 'convocation',
    'attestation': 'attestation',
    'lettre': 'lettre',
    'correspondance': 'lettre'
};

/**
 * Parse une commande vocale pour identifier le type de document
 */
export function parseVoiceCommand(voiceText: string): {
    documentType: MunicipalDocumentType | null;
    subject: string | null;
    content: string;
} {
    const lowerText = voiceText.toLowerCase();
    
    // Identifier le type de document
    let documentType: MunicipalDocumentType | null = null;
    for (const [key, value] of Object.entries(VOICE_TO_DOCUMENT_TYPE)) {
        if (lowerText.includes(key)) {
            documentType = value;
            break;
        }
    }

    // Extraire l'objet si mentionné
    let subject: string | null = null;
    const objetMatch = voiceText.match(/(?:objet|concernant|à propos de|sur)\s*:?\s*(.+?)(?:\.|,|$)/i);
    if (objetMatch) {
        subject = objetMatch[1].trim();
    }

    // Le reste est le contenu
    let content = voiceText;
    if (subject) {
        content = content.replace(objetMatch![0], '').trim();
    }

    return { documentType, subject, content };
}

/**
 * Génère un numéro de référence automatique
 */
export function generateReference(type: MunicipalDocumentType): string {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    
    const prefixes: Record<MunicipalDocumentType, string> = {
        'communique': 'COM',
        'note_service': 'NS',
        'arrete': 'ARR',
        'decision': 'DEC',
        'convocation': 'CONV',
        'attestation': 'ATT',
        'lettre': 'LET'
    };

    return `${randomNum}/PE/CL/CAB-${prefixes[type] || 'DOC'}`;
}

/**
 * Skill principal pour la génération de documents par commande vocale
 */
export class MunicipalDocumentSkill {
    private defaultSignataire = {
        fonction: 'Le Maire de la Commune de Libreville',
        nom: 'Eugène MBA'
    };

    private settings?: Partial<MunicipalDocumentSettings>;

    constructor(settings?: Partial<MunicipalDocumentSettings>) {
        this.settings = settings;
    }

    /**
     * Configure le signataire par défaut
     */
    setDefaultSignataire(fonction: string, nom: string) {
        this.defaultSignataire = { fonction, nom };
    }

    /**
     * Génère un document à partir d'une commande vocale
     */
    async generateFromVoice(voiceText: string): Promise<DocumentGenerationResult> {
        try {
            const { documentType, subject, content } = parseVoiceCommand(voiceText);

            if (!documentType) {
                return {
                    success: false,
                    error: 'Type de document non reconnu',
                    feedback: "Je n'ai pas compris le type de document souhaité. Veuillez préciser : communiqué, note de service, arrêté, décision, convocation, attestation ou lettre."
                };
            }

            const reference = generateReference(documentType);
            const paragraphs = this.formatContentToParagraphs(content);

            const documentData: MunicipalDocumentData = {
                type: documentType,
                reference,
                objet: subject || undefined,
                contenu: paragraphs,
                signataire: this.defaultSignataire,
                ampliations: documentType === 'note_service' ? [
                    'Madame et Messieurs les Adjoints au Maire',
                    'Monsieur le Secrétaire Général',
                    'Mesdames et Messieurs les Directeurs Généraux',
                    'Intéressés',
                    'Affichage'
                ] : undefined
            };

            const result = await municipalDocumentService.generateWithURL(documentData, this.settings);

            return {
                success: true,
                documentUrl: result.url,
                filename: result.filename,
                feedback: `Document ${this.getDocumentTypeName(documentType)} généré avec succès. Référence : ${reference}`
            };

        } catch (error) {
            console.error('Erreur génération document:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                feedback: "Une erreur est survenue lors de la génération du document. Veuillez réessayer."
            };
        }
    }

    /**
     * Génère un communiqué
     */
    async generateCommunique(
        content: string[],
        reference?: string
    ): Promise<DocumentGenerationResult> {
        try {
            const ref = reference || generateReference('communique');
            const documentData = municipalDocumentService.templates.communique(
                ref,
                content,
                this.defaultSignataire
            );

            const result = await municipalDocumentService.generateWithURL(documentData, this.settings);

            return {
                success: true,
                documentUrl: result.url,
                filename: result.filename,
                feedback: `Communiqué N° ${ref} généré avec succès.`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                feedback: "Erreur lors de la génération du communiqué."
            };
        }
    }

    /**
     * Génère une note de service avec ampliations
     */
    async generateNoteService(
        objet: string,
        content: string[],
        ampliations?: string[],
        reference?: string
    ): Promise<DocumentGenerationResult> {
        try {
            const ref = reference || generateReference('note_service');
            const documentData = municipalDocumentService.templates.noteService(
                ref,
                objet,
                content,
                this.defaultSignataire,
                ampliations
            );

            const result = await municipalDocumentService.generateWithURL(documentData, this.settings);

            return {
                success: true,
                documentUrl: result.url,
                filename: result.filename,
                feedback: `Note de Service N° ${ref} générée avec succès.`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                feedback: "Erreur lors de la génération de la note de service."
            };
        }
    }

    /**
     * Génère un arrêté municipal
     */
    async generateArrete(
        objet: string,
        articles: string[],
        ampliations?: string[],
        reference?: string
    ): Promise<DocumentGenerationResult> {
        try {
            const ref = reference || generateReference('arrete');
            const documentData = municipalDocumentService.templates.arrete(
                ref,
                objet,
                articles,
                this.defaultSignataire,
                ampliations
            );

            const result = await municipalDocumentService.generateWithURL(documentData, this.settings);

            return {
                success: true,
                documentUrl: result.url,
                filename: result.filename,
                feedback: `Arrêté Municipal N° ${ref} généré avec succès.`
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue',
                feedback: "Erreur lors de la génération de l'arrêté."
            };
        }
    }

    /**
     * Formate le contenu vocal en paragraphes
     */
    private formatContentToParagraphs(content: string): string[] {
        // Séparer par phrases ou points
        const sentences = content
            .split(/(?<=[.!?])\s+/)
            .filter(s => s.trim().length > 0)
            .map(s => s.trim());

        // Grouper les phrases courtes
        const paragraphs: string[] = [];
        let currentParagraph = '';

        for (const sentence of sentences) {
            if (currentParagraph.length + sentence.length > 300) {
                if (currentParagraph) {
                    paragraphs.push(currentParagraph.trim());
                }
                currentParagraph = sentence;
            } else {
                currentParagraph += (currentParagraph ? ' ' : '') + sentence;
            }
        }

        if (currentParagraph) {
            paragraphs.push(currentParagraph.trim());
        }

        return paragraphs.length > 0 ? paragraphs : [content];
    }

    /**
     * Retourne le nom lisible du type de document
     */
    private getDocumentTypeName(type: MunicipalDocumentType): string {
        const names: Record<MunicipalDocumentType, string> = {
            'communique': 'Communiqué',
            'note_service': 'Note de Service',
            'arrete': 'Arrêté Municipal',
            'decision': 'Décision',
            'convocation': 'Convocation',
            'attestation': 'Attestation',
            'lettre': 'Lettre'
        };
        return names[type] || 'Document';
    }
}

// Instance singleton exportée
export const municipalDocumentSkill = new MunicipalDocumentSkill();

export default municipalDocumentSkill;
