/**
 * Document OCR Service
 * Uses OpenAI Vision API to extract structured data from identity documents
 */

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
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Current provider (can be configured)
let currentProvider: OCRProvider = 'gemini'; // Default to Gemini as requested

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
 * Convert File to base64 data URL
 */
async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get extraction prompt based on document type
 */
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

Réponds UNIQUEMENT en JSON valide avec cette structure exacte:
{
    "documentType": "cni|passport|birth_certificate|residence_proof|family_record|other",
    "confidence": 0.0-1.0,
    "extractedData": {
        "lastName": "NOM en majuscules ou null",
        "firstName": "Prénom ou null",
        "dateOfBirth": "YYYY-MM-DD ou null",
        "placeOfBirth": "Ville/Pays ou null",
        "nationality": "Nationalité ou null",
        "address": "Adresse complète ou null",
        "city": "Ville ou null",
        "postalCode": "Code postal ou null",
        "fatherName": "Nom du père ou null",
        "fatherFirstName": "Prénom du père ou null",
        "motherName": "Nom de la mère ou null",
        "motherFirstName": "Prénom de la mère ou null",
        "documentNumber": "Numéro du document ou null",
        "expiryDate": "YYYY-MM-DD ou null",
        "issueDate": "YYYY-MM-DD ou null",
        "maritalStatus": "SINGLE|MARRIED|DIVORCED|WIDOWED ou null",
        "profession": "Profession ou null"
    },
    "uncertainFields": ["liste des champs avec incertitude"],
    "rawText": "Texte brut extrait si disponible"
}`;

    if (documentType) {
        const typeHints: Record<DocumentType, string> = {
            cni: "\nCe document est une Carte Nationale d'Identité. Cherche: nom, prénom, date/lieu naissance, adresse, numéro CNI, date d'expiration.",
            passport: "\nCe document est un Passeport. Cherche: nom, prénom, date/lieu naissance, nationalité, numéro passeport, date d'expiration.",
            birth_certificate: "\nCe document est un Acte de Naissance. Cherche: nom, prénom, date/lieu naissance, noms des parents. Note: peut être manuscrit.",
            residence_proof: "\nCe document est un Justificatif de Domicile (facture, quittance). Cherche: nom, adresse complète, ville, code postal.",
            family_record: "\nCe document est un Livret de Famille. Cherche: noms des époux, enfants, dates de naissance, noms des parents.",
            other: "\nType de document inconnu. Extrais toutes les informations d'identité visibles."
        };
        return basePrompt + typeHints[documentType];
    }

    return basePrompt;
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
        geminiKey?: string;
    }
): Promise<DocumentAnalysis> {
    const provider = options?.provider || currentProvider;

    if (provider === 'gemini') {
        return analyzeWithGemini(file, documentType, options?.geminiKey);
    } else {
        return analyzeWithOpenAI(file, documentType, options?.openaiKey);
    }
}

/**
 * Analyze document using OpenAI Vision API
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

        const base64Image = await fileToBase64(file);

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
 * Analyze document using Google Gemini Vision API
 */
async function analyzeWithGemini(
    file: File,
    documentType?: DocumentType,
    apiKey?: string
): Promise<DocumentAnalysis> {
    try {
        const key = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
        if (!key) {
            throw new Error('Clé API Gemini non configurée (VITE_GEMINI_API_KEY)');
        }

        // Convert file to base64 (without data URL prefix for Gemini)
        const base64Full = await fileToBase64(file);
        const base64Data = base64Full.split(',')[1]; // Remove "data:image/...;base64," prefix
        const mimeType = file.type || 'image/jpeg';

        const response = await fetch(`${GEMINI_API_URL}?key=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: getExtractionPrompt(documentType) },
                            {
                                inline_data: {
                                    mime_type: mimeType,
                                    data: base64Data
                                }
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000
                }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

        return parseAndCleanAnalysis(content, documentType);

    } catch (error: any) {
        console.error('[DocumentOCR:Gemini] Analysis error:', error);
        return createErrorAnalysis(documentType, error.message);
    }
}

/**
 * Parse API response and clean extracted data
 */
function parseAndCleanAnalysis(content: string | undefined, documentType?: DocumentType): DocumentAnalysis {
    if (!content) {
        throw new Error('Réponse vide de l\'API');
    }

    // Handle potential markdown code blocks
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const analysis: DocumentAnalysis = JSON.parse(jsonString);

    // Validate and clean data
    if (analysis.extractedData) {
        // Format names correctly
        if (analysis.extractedData.lastName) {
            analysis.extractedData.lastName = analysis.extractedData.lastName.toUpperCase().trim();
        }
        if (analysis.extractedData.firstName) {
            analysis.extractedData.firstName = formatTitleCase(analysis.extractedData.firstName);
        }
        if (analysis.extractedData.fatherName) {
            analysis.extractedData.fatherName = analysis.extractedData.fatherName.toUpperCase().trim();
        }
        if (analysis.extractedData.motherName) {
            analysis.extractedData.motherName = analysis.extractedData.motherName.toUpperCase().trim();
        }
        if (analysis.extractedData.fatherFirstName) {
            analysis.extractedData.fatherFirstName = formatTitleCase(analysis.extractedData.fatherFirstName);
        }
        if (analysis.extractedData.motherFirstName) {
            analysis.extractedData.motherFirstName = formatTitleCase(analysis.extractedData.motherFirstName);
        }
    }

    return analysis;
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
 * Format string to Title Case
 */
function formatTitleCase(str: string): string {
    return str
        .toLowerCase()
        .split(/[\s-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(str.includes('-') ? '-' : ' ')
        .trim();
}

/**
 * Analyze multiple documents and consolidate data
 */
export async function analyzeMultipleDocuments(
    files: { file: File; suggestedType?: DocumentType }[],
    options?: {
        provider?: OCRProvider;
        openaiKey?: string;
        geminiKey?: string;
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

    return requiredFields.filter(field => !(data as any)[field]);
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
