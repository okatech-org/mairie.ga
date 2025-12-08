import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `Tu es un analyseur d'émotions expert. Analyse le message suivant et retourne UNIQUEMENT l'émotion dominante parmi ces 8 options:
- joy (joie, bonheur, satisfaction, enthousiasme)
- sadness (tristesse, déception, mélancolie)
- anger (colère, frustration, irritation)
- fear (peur, anxiété, inquiétude)
- surprise (étonnement, stupéfaction)
- disgust (dégoût, aversion)
- trust (confiance, assurance, sécurité)
- neutral (neutre, factuel, sans émotion particulière)

Réponds UNIQUEMENT avec un JSON valide au format: {"emotion": "nom_emotion", "intensity": 0.0-1.0}
L'intensité représente la force de l'émotion détectée (0.0 = très faible, 1.0 = très forte).`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Contexte de la conversation: ${context || "Aucun"}\n\nMessage à analyser: "${message}"` }
        ],
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded", emotion: "neutral", intensity: 0.5 }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required", emotion: "neutral", intensity: 0.5 }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI gateway error", emotion: "neutral", intensity: 0.5 }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '{"emotion": "neutral", "intensity": 0.5}';
    
    // Parse the JSON response
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const emotionData = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(emotionData), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseError) {
      console.error("Parse error:", parseError, "Content:", content);
    }

    // Fallback to neutral if parsing fails
    return new Response(JSON.stringify({ emotion: "neutral", intensity: 0.5 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("analyze-emotion error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      emotion: "neutral",
      intensity: 0.5 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
