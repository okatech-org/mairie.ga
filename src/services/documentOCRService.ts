/**
 * Document OCR Service
 * Supports multiple providers:
 * 1. Gemini Vision (via Secure Edge Function) - DEFAULT
 * 2. OpenAI Vision (Client-side) - FALLBACK/OPTION
 */

import { supabase } from '@/integrations/supabase/client';

// Document types we can analyze
export type DocumentType =
    | 'cni'                 // Carte Nationale d'Identité
    | 'passport'            // Passeport
    | 'birth_certificate'   // Acte de naissance
    | 'residence_proof'     // Justificatif de domicile
    | 'family_record'       // Livret de famille
    | 'other';              // Autre document

// Extracted data structure
export interface ExtractedData {
    lastName?: string;
    firstName?: string;
    dateOfBirth?: string;           // YYYY-MM-DD format
    placeOfBirth?: string;
    nationality?: string;
    address?: string;
    city?: string;
    postalCode?: string;
    fatherName?: string;
    fatherFirstName?: string;
    motherName?: string;
    motherFirstName?: string;
    documentNumber?: string;        // For passport/CNI
    expiryDate?: string;            // For passport/CNI
    issueDate?: string;
    maritalStatus?: string;
    profession?: string;
    phone?: string;
    email?: string;
}

// Analysis result
export interface DocumentAnalysis {
    documentType: DocumentType;
    confidence: number;             // 0.0 to 1.0
    extractedData: ExtractedData;
    uncertainFields: string[];      // Fields with low confidence
    rawText?: string;               // Raw text for debugging
    error?: string;
}

// Field priority by document type
const FIELD_PRIORITY: Record<string, DocumentType[]> = {
    address: ['residence_proof', 'cni', 'passport'],
    city: ['residence_proof', 'cni', 'passport'],
    postalCode: ['residence_proof', 'cni', 'passport'],
    lastName: ['cni', 'passport', 'birth_certificate'],
    firstName: ['cni', 'passport', 'birth_certificate'],
    dateOfBirth: ['birth_certificate', 'cni', 'passport'],
    placeOfBirth: ['birth_certificate', 'cni', 'passport'],
    fatherName: ['birth_certificate', 'family_record'],
    fatherFirstName: ['birth_certificate', 'family_record'],
    motherName: ['birth_certificate', 'family_record'],
    motherFirstName: ['birth_certificate', 'family_record'],
    nationality: ['passport', 'cni'],
    documentNumber: ['passport', 'cni'],
    expiryDate: ['passport', 'cni'],
};

// OCR Provider types
export type OCRProvider = 'openai' | 'gemini';

// API endpoints
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Current provider (can be configured)
let currentProvider: OCRProvider = 'gemini';

/**
 * Set the OCR provider
 */
export function setOCRProvider(provider: OCRProvider): void {
    currentProvider = provider;
    console.log(`[DocumentOCR] Provider set to: ${provider}`);
}

/**
 * Get the current OCR provider
 */
export function getOCRProvider(): OCRProvider {
    return currentProvider;
}

/**
 * Convert File to base64 (raw for Gemini Edge, data URL for OpenAI)
 */
async function fileToBase64(file: File, raw: boolean = false): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            if (raw) {
                resolve(result.split(',')[1]);
            } else {
                resolve(result);
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Analyze a single document using the configured OCR provider
 */
export async function analyzeDocument(
    file: File,
    documentType?: DocumentType,
    options?: {
        provider?: OCRProvider;
        openaiKey?: string;
    }
): Promise<DocumentAnalysis> {
    const provider = options?.provider || currentProvider;

    if (provider === 'gemini') {
        return analyzeWithGeminiEdge(file, documentType);
    } else {
        return analyzeWithOpenAI(file, documentType, options?.openaiKey);
    }
}

/**
 * Analyze document using Gemini via Secure Edge Function
 */
async function analyzeWithGeminiEdge(
    file: File,
    documentType?: DocumentType
): Promise<DocumentAnalysis> {
    try {
        console.log(`[DocumentOCR:Gemini] Analyzing document: ${file.name}`);

        const imageBase64 = await fileToBase64(file, true); // Raw base64
        const mimeType = file.type || 'image/jpeg';

        const { data, error } = await supabase.functions.invoke('document-ocr', {
            body: {
                imageBase64,
                mimeType,
                documentType
            }
        });

        if (error) throw new Error(error.message || 'Erreur Edge Function');
        if (data.error) throw new Error(data.error);

        return data as DocumentAnalysis;

    } catch (error: any) {
        console.error('[DocumentOCR:Gemini] Analysis error:', error);
        return createErrorAnalysis(documentType, error.message);
    }
}

/**
 * Analyze document using OpenAI Vision API (Client-side)
 */
async function analyzeWithOpenAI(
    file: File,
    documentType?: DocumentType,
    apiKey?: string
): Promise<DocumentAnalysis> {
    try {
        const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY;
        if (!key) {
            throw new Error('Clé API OpenAI non configurée (VITE_OPENAI_API_KEY)');
        }

        const base64Image = await fileToBase64(file, false); // Data URL

        const response = await fetch(OPENAI_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            { type: 'text', text: getExtractionPrompt(documentType) },
                            { type: 'image_url', image_url: { url: base64Image, detail: 'high' } }
                        ]
                    }
                ],
                max_tokens: 2000,
                temperature: 0.1
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
        }

        const result = await response.json();
        const content = result.choices[0]?.message?.content;

        return parseAndCleanAnalysis(content, documentType);

    } catch (error: any) {
        console.error('[DocumentOCR:OpenAI] Analysis error:', error);
        return createErrorAnalysis(documentType, error.message);
    }
}

/**
 * Analyze multiple documents and consolidate data
 */
export async function analyzeMultipleDocuments(
    files: { file: File; suggestedType?: DocumentType }[],
    options?: {
        provider?: OCRProvider;
        openaiKey?: string;
    }
): Promise<{
    analyses: DocumentAnalysis[];
    consolidatedData: ExtractedData;
    uncertainFields: string[];
    conflicts: { field: string; values: { value: string; source: DocumentType }[] }[];
}> {
    // Analyze all documents in parallel
    const analyses = await Promise.all(
        files.map(({ file, suggestedType }) => analyzeDocument(file, suggestedType, options))
    );

    // Consolidate data with priority rules
    const consolidatedData: ExtractedData = {};
    const uncertainFields = new Set<string>();
    const conflicts: { field: string; values: { value: string; source: DocumentType }[] }[] = [];
    const fieldValues: Record<string, { value: string; source: DocumentType; confidence: number }[]> = {};

    // Collect all values for each field
    for (const analysis of analyses) {
        if (analysis.error || !analysis.extractedData) continue;

        for (const [field, value] of Object.entries(analysis.extractedData)) {
            if (value && value !== 'null') {
                if (!fieldValues[field]) {
                    fieldValues[field] = [];
                }
                fieldValues[field].push({
                    value: value as string,
                    source: analysis.documentType,
                    confidence: analysis.confidence
                });
            }
        }

        // Collect uncertain fields
        for (const field of analysis.uncertainFields || []) {
            uncertainFields.add(field);
        }
    }

    // Resolve conflicts and build consolidated data
    for (const [field, values] of Object.entries(fieldValues)) {
        if (values.length === 0) continue;

        // Check for conflicts (different values)
        const uniqueValues = [...new Set(values.map(v => v.value.toUpperCase()))];

        if (uniqueValues.length > 1) {
            // Conflict detected - use priority rules
            const priority = FIELD_PRIORITY[field] || [];
            let resolved = false;

            for (const docType of priority) {
                const match = values.find(v => v.source === docType);
                if (match) {
                    (consolidatedData as any)[field] = match.value;
                    resolved = true;
                    break;
                }
            }

            // If no priority match, use highest confidence
            if (!resolved) {
                const sorted = values.sort((a, b) => b.confidence - a.confidence);
                (consolidatedData as any)[field] = sorted[0].value;
            }

            // Record the conflict for potential user review
            conflicts.push({
                field,
                values: values.map(v => ({ value: v.value, source: v.source }))
            });
        } else {
            // No conflict - use the value
            (consolidatedData as any)[field] = values[0].value;
        }
    }

    return {
        analyses,
        consolidatedData,
        uncertainFields: Array.from(uncertainFields),
        conflicts
    };
}

/**
 * Check if two names are similar (fuzzy matching for handwriting errors)
 */
export function detectSimilarNames(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;

    const n1 = name1.toUpperCase().trim();
    const n2 = name2.toUpperCase().trim();

    if (n1 === n2) return true;
    if (n1.includes(n2) || n2.includes(n1)) return true;

    const distance = levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity > 0.8;
}

/**
 * Levenshtein distance
 */
function levenshteinDistance(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (s1[i - 1] === s2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    return dp[m][n];
}

/**
 * Get missing required fields
 */
export function getMissingRegistrationFields(data: ExtractedData): string[] {
    const requiredFields = [
        'lastName', 'firstName', 'dateOfBirth', 'placeOfBirth', 'address', 'city'
    ];
    return requiredFields.filter(field => !(data as any)[field]);
}

/**
 * Detect document type from filename
 */
export function detectDocumentType(filename: string): DocumentType | undefined {
    const lower = filename.toLowerCase();
    if (lower.includes('cni') || lower.includes('identite') || lower.includes('identity')) return 'cni';
    if (lower.includes('passeport') || lower.includes('passport')) return 'passport';
    if (lower.includes('naissance') || lower.includes('birth') || lower.includes('acte')) return 'birth_certificate';
    if (lower.includes('domicile') || lower.includes('facture') || lower.includes('quittance') || lower.includes('edf')) return 'residence_proof';
    if (lower.includes('livret') || lower.includes('famille') || lower.includes('family')) return 'family_record';
    return undefined;
}

// Helpers
function getExtractionPrompt(documentType?: DocumentType): string {
    const basePrompt = `Tu es un expert OCR spécialisé dans l'extraction de données de documents administratifs africains/gabonais.
Analyse cette image de document et extrais TOUTES les informations visibles de manière structurée.
IMPORTANT:
- Les noms de famille sont généralement en MAJUSCULES
- Les prénoms ont la première lettre en majuscule
- Pour l'écriture manuscrite, fais de ton mieux pour déchiffrer
- Si un champ est illisible ou incertain, marque-le dans uncertainFields
- Date de naissance au format YYYY-MM-DD
- Indique ton niveau de confiance global (0.0 à 1.0)
Réponds UNIQUEMENT en JSON valide.`;

    if (documentType) {
        return basePrompt + `\nCe document est un(e) ${documentType}.`;
    }
    return basePrompt;
}

function parseAndCleanAnalysis(content: string | undefined, documentType?: DocumentType): DocumentAnalysis {
    if (!content) throw new Error('Réponse vide');
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }
    const analysis = JSON.parse(jsonString);
    // Add cleanup logic here if needed (names formatting etc from previous step)
    return analysis;
}

function createErrorAnalysis(documentType?: DocumentType, errorMessage?: string): DocumentAnalysis {
    return {
        documentType: documentType || 'other',
        confidence: 0,
        extractedData: {},
        uncertainFields: [],
        error: errorMessage
    };
}