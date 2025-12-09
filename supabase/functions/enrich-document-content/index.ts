// supabase/functions/enrich-document-content/index.ts
// Edge Function to enrich document content using GPT

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface EnrichRequest {
    documentType: string; // 'note_service' | 'lettre' | 'communique' | 'attestation' | etc.
    subject: string;
    userInput?: string; // Optional user-provided content to improve
    recipient?: string;
    recipientOrg?: string;
    language?: string; // default: 'fr'
}

interface EnrichResponse {
    success: boolean;
    contentPoints: string[];
    closingPhrase?: string;
    error?: string;
}

serve(async (req) => {
    // Handle CORS
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body: EnrichRequest = await req.json();
        const { documentType, subject, userInput, recipient, recipientOrg, language = 'fr' } = body;

        if (!subject) {
            return new Response(
                JSON.stringify({ success: false, error: "Subject is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
        if (!OPENAI_API_KEY) {
            return new Response(
                JSON.stringify({ success: false, error: "OpenAI API key not configured" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Build the prompt based on document type
        const documentTypeLabel = getDocumentTypeLabel(documentType);
        const prompt = buildPrompt(documentTypeLabel, subject, userInput, recipient, recipientOrg, language);

        // Call OpenAI API
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "system",
                        content: `Tu es un rédacteur administratif expert pour la Mairie de Libreville au Gabon. 
Tu écris des documents officiels en français administratif soutenu, avec un style formel et professionnel.
Tu dois toujours:
- Utiliser le vouvoiement
- Employer un vocabulaire administratif approprié
- Structurer le contenu en paragraphes clairs
- Éviter les répétitions et les formulations génériques
- Adapter le ton au type de document (note de service = directif, lettre = cordial, communiqué = informatif)
- Retourner EXACTEMENT le format JSON demandé sans markdown ni backticks`
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenAI API error:", errorText);
            return new Response(
                JSON.stringify({ success: false, error: "AI generation failed" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (!content) {
            return new Response(
                JSON.stringify({ success: false, error: "No content generated" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Parse the AI response (expecting JSON)
        let parsedContent: { paragraphs: string[]; closing?: string };
        try {
            // Remove potential markdown code blocks
            const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
            parsedContent = JSON.parse(cleanContent);
        } catch (e) {
            // Fallback: treat as plain text and split by paragraphs
            console.warn("Could not parse AI response as JSON, using fallback:", e);
            const paragraphs = content.split('\n\n').filter((p: string) => p.trim().length > 0);
            parsedContent = { paragraphs, closing: undefined };
        }

        const result: EnrichResponse = {
            success: true,
            contentPoints: parsedContent.paragraphs || [content],
            closingPhrase: parsedContent.closing
        };

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Error:", error);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});

function getDocumentTypeLabel(type: string): string {
    const labels: Record<string, string> = {
        'note_service': 'Note de Service',
        'lettre': 'Lettre Officielle',
        'courrier': 'Courrier Officiel',
        'communique': 'Communiqué',
        'attestation': 'Attestation',
        'certificat': 'Certificat',
        'arrete': 'Arrêté Municipal',
        'deliberation': 'Délibération',
        'convocation': 'Convocation',
        'rapport': 'Rapport'
    };
    return labels[type] || 'Document Officiel';
}

function buildPrompt(
    documentType: string,
    subject: string,
    userInput?: string,
    recipient?: string,
    recipientOrg?: string,
    language: string = 'fr'
): string {
    let context = `Rédige le contenu d'un(e) **${documentType}** avec l'objet suivant: "${subject}"`;

    if (recipient) {
        context += `\n\nDestinataire: ${recipient}`;
        if (recipientOrg) {
            context += ` (${recipientOrg})`;
        }
    }

    if (userInput && userInput.trim().length > 0) {
        context += `\n\nL'utilisateur a fourni ces indications: "${userInput}"
Améliore et développe ce contenu en le rendant plus professionnel et complet.`;
    }

    // Type-specific instructions
    const typeInstructions: Record<string, string> = {
        'Note de Service': `
Pour une Note de Service:
- Commence par rappeler l'importance du sujet
- Développe les attendus avec des points précis
- Termine par les consignes d'application
- Le ton doit être directif mais respectueux`,

        'Lettre Officielle': `
Pour une Lettre Officielle:
- Commence par une formule d'introduction appropriée
- Développe le motif de la lettre
- Exprime clairement les attentes ou informations
- Reste cordial mais professionnel`,

        'Communiqué': `
Pour un Communiqué:
- Soit direct et informatif
- Inclus le contexte, les faits, et les implications
- Termine par les prochaines étapes si applicable`,

        'Attestation': `
Pour une Attestation:
- Soit factuel et précis
- Énonce clairement ce qui est attesté
- Utilise des formulations officielles`
    };

    const instruction = typeInstructions[documentType] || '';
    context += instruction;

    context += `

Retourne ta réponse UNIQUEMENT en JSON valide (sans backticks ni markdown) avec cette structure exacte:
{
    "paragraphs": ["paragraphe 1", "paragraphe 2", "paragraphe 3"],
    "closing": "phrase de clôture adaptée au document"
}

Les paragraphes doivent être complets et bien rédigés. 
Génère 2 à 4 paragraphes selon la complexité du sujet.`;

    return context;
}
