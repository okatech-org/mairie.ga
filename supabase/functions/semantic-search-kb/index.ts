import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SemanticSearchRequest {
  query: string;
  limit?: number;
  category?: string;
  includeKeywords?: boolean;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, limit = 10, category, includeKeywords = true }: SemanticSearchRequest = await req.json();

    if (!query || typeof query !== "string") {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Database not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Generate embedding for the query using Lovable AI
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Embedding API error:", embeddingResponse.status, errorText);
      
      // Fallback to text search if embedding fails
      console.log("Falling back to text search");
      return await performTextSearch(supabase, query, limit, category, corsHeaders);
    }

    const embeddingData = await embeddingResponse.json();
    const embedding = embeddingData.data?.[0]?.embedding;

    if (!embedding) {
      console.log("No embedding returned, falling back to text search");
      return await performTextSearch(supabase, query, limit, category, corsHeaders);
    }

    // Perform semantic search using pgvector
    let semanticQuery = supabase.rpc("match_knowledge_base", {
      query_embedding: embedding,
      match_threshold: 0.5,
      match_count: limit,
    });

    const { data: semanticResults, error: semanticError } = await semanticQuery;

    if (semanticError) {
      console.error("Semantic search error:", semanticError);
      // Fallback to text search
      return await performTextSearch(supabase, query, limit, category, corsHeaders);
    }

    // If no semantic results, fall back to text search
    if (!semanticResults || semanticResults.length === 0) {
      return await performTextSearch(supabase, query, limit, category, corsHeaders);
    }

    // Filter by category if provided
    let finalResults = semanticResults;
    if (category) {
      finalResults = semanticResults.filter((r: any) => r.category === category);
    }

    // Enhance results with keyword matching if enabled
    if (includeKeywords) {
      const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      finalResults = finalResults.map((result: any) => {
        const keywordMatches = (result.keywords || []).filter((kw: string) =>
          queryWords.some(qw => kw.toLowerCase().includes(qw) || qw.includes(kw.toLowerCase()))
        );
        return {
          ...result,
          keywordMatches,
          relevanceBoost: keywordMatches.length * 0.1,
        };
      });

      // Re-sort by combined score
      finalResults.sort((a: any, b: any) => 
        (b.similarity + (b.relevanceBoost || 0)) - (a.similarity + (a.relevanceBoost || 0))
      );
    }

    return new Response(
      JSON.stringify({
        results: finalResults,
        searchType: "semantic",
        query,
        totalResults: finalResults.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Semantic search error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Search failed",
        results: [],
        searchType: "error"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function performTextSearch(
  supabase: any,
  query: string,
  limit: number,
  category: string | undefined,
  corsHeaders: Record<string, string>
) {
  try {
    let textQuery = supabase
      .from("knowledge_base")
      .select("*")
      .eq("status", "PUBLISHED")
      .eq("is_active", true)
      .or(`title.ilike.%${query}%,content.ilike.%${query}%,keywords.cs.{${query}}`)
      .order("priority", { ascending: false })
      .order("view_count", { ascending: false })
      .limit(limit);

    if (category) {
      textQuery = textQuery.eq("category", category);
    }

    const { data, error } = await textQuery;

    if (error) {
      console.error("Text search error:", error);
      return new Response(
        JSON.stringify({ error: "Search failed", results: [], searchType: "error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        results: data || [],
        searchType: "text",
        query,
        totalResults: (data || []).length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Text search exception:", err);
    return new Response(
      JSON.stringify({ error: "Search failed", results: [], searchType: "error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
