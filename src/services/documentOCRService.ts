/**
 * Document OCR Service
 * Uses Edge Function with Gemini Vision API to extract structured data from identity documents
 * SECURE: API keys are stored server-side, not exposed to client
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

/**
 * Convert File to base64 (without data URL prefix)
 */
async function fileToBase64Raw(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Analyze a single document using the secure Edge Function
 */
export async function analyzeDocument(
    file: File,
    documentType?: DocumentType
): Promise<DocumentAnalysis> {
    try {
        console.log(`[DocumentOCR] Analyzing document: ${file.name}, type hint: ${documentType || 'auto'}`);
        
        // Convert file to base64
        const imageBase64 = await fileToBase64Raw(file);
        const mimeType = file.type || 'image/jpeg';

        // Call the secure Edge Function
        const { data, error } = await supabase.functions.invoke('document-ocr', {
            body: {
                imageBase64,
                mimeType,
                documentType
            }
        });

        if (error) {
            console.error('[DocumentOCR] Edge function error:', error);
            throw new Error(error.message || 'Erreur du service OCR');
        }

        if (data.error) {
            console.error('[DocumentOCR] Analysis error:', data.error);
            return createErrorAnalysis(documentType, data.error);
        }

        console.log(`[DocumentOCR] Analysis complete, confidence: ${data.confidence}`);
        return data as DocumentAnalysis;

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error('[DocumentOCR] Analysis error:', errorMessage);
        return createErrorAnalysis(documentType, errorMessage);
    }
}

/**
 * Create error analysis result
 */
function createErrorAnalysis(documentType?: DocumentType, errorMessage?: string): DocumentAnalysis {
    return {
        documentType: documentType || 'other',
        confidence: 0,
        extractedData: {},
        uncertainFields: [],
        error: errorMessage
    };
}

/**
 * Analyze multiple documents and consolidate data
 */
export async function analyzeMultipleDocuments(
    files: { file: File; suggestedType?: DocumentType }[]
): Promise<{
    analyses: DocumentAnalysis[];
    consolidatedData: ExtractedData;
    uncertainFields: string[];
    conflicts: { field: string; values: { value: string; source: DocumentType }[] }[];
}> {
    // Analyze all documents in parallel
    const analyses = await Promise.all(
        files.map(({ file, suggestedType }) => analyzeDocument(file, suggestedType))
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
                    (consolidatedData as Record<string, string>)[field] = match.value;
                    resolved = true;
                    break;
                }
            }

            // If no priority match, use highest confidence
            if (!resolved) {
                const sorted = values.sort((a, b) => b.confidence - a.confidence);
                (consolidatedData as Record<string, string>)[field] = sorted[0].value;
            }

            // Record the conflict for potential user review
            conflicts.push({
                field,
                values: values.map(v => ({ value: v.value, source: v.source }))
            });
        } else {
            // No conflict - use the value
            (consolidatedData as Record<string, string>)[field] = values[0].value;
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

    // Exact match
    if (n1 === n2) return true;

    // One contains the other
    if (n1.includes(n2) || n2.includes(n1)) return true;

    // Levenshtein distance (simple implementation)
    const distance = levenshteinDistance(n1, n2);
    const maxLength = Math.max(n1.length, n2.length);
    const similarity = 1 - (distance / maxLength);

    return similarity > 0.8; // 80% similarity threshold
}

/**
 * Levenshtein distance for fuzzy string matching
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
 * Get missing required fields for registration
 */
export function getMissingRegistrationFields(data: ExtractedData): string[] {
    const requiredFields = [
        'lastName',
        'firstName',
        'dateOfBirth',
        'placeOfBirth',
        'address',
        'city'
    ];

    return requiredFields.filter(field => !(data as Record<string, unknown>)[field]);
}

/**
 * Detect document type from filename or content hints
 */
export function detectDocumentType(filename: string): DocumentType | undefined {
    const lower = filename.toLowerCase();

    if (lower.includes('cni') || lower.includes('identite') || lower.includes('identity')) {
        return 'cni';
    }
    if (lower.includes('passeport') || lower.includes('passport')) {
        return 'passport';
    }
    if (lower.includes('naissance') || lower.includes('birth') || lower.includes('acte')) {
        return 'birth_certificate';
    }
    if (lower.includes('domicile') || lower.includes('facture') || lower.includes('quittance') || lower.includes('edf')) {
        return 'residence_proof';
    }
    if (lower.includes('livret') || lower.includes('famille') || lower.includes('family')) {
        return 'family_record';
    }

    return undefined;
}