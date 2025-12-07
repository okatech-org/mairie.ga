import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Document types
type DocumentType = 'cni' | 'passport' | 'birth_certificate' | 'residence_proof' | 'family_record' | 'other';

// Extraction prompt
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

// Format names correctly
function formatTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(/[\s-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(str.includes('-') ? '-' : ' ')
    .trim();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      throw new Error('Service OCR non configuré');
    }

    const { imageBase64, mimeType, documentType } = await req.json();

    if (!imageBase64) {
      throw new Error('Image manquante');
    }

    console.log(`[document-ocr] Analyzing document, type hint: ${documentType || 'auto'}`);

    // Call Gemini Vision API
    const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
                  mime_type: mimeType || 'image/jpeg',
                  data: imageBase64
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
      const errorText = await response.text();
      console.error('[document-ocr] Gemini API error:', response.status, errorText);
      throw new Error(`Erreur API Gemini: ${response.status}`);
    }

    const result = await response.json();
    const content = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('Réponse vide de l\'API');
    }

    // Parse JSON response
    let jsonString = content.trim();
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    const analysis = JSON.parse(jsonString);

    // Clean and format extracted data
    if (analysis.extractedData) {
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

    console.log(`[document-ocr] Analysis complete, confidence: ${analysis.confidence}`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error('[document-ocr] Error:', errorMessage);
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      documentType: 'other',
      confidence: 0,
      extractedData: {},
      uncertainFields: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});