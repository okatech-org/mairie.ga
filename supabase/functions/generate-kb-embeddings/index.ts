import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GenerateEmbeddingsRequest {
  articleId?: string;      // Generate for specific article
  regenerateAll?: boolean; // Regenerate all embeddings
  onlyMissing?: boolean;   // Only generate for articles without embeddings
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { articleId, regenerateAll, onlyMissing = true } = await req.json() as GenerateEmbeddingsRequest;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'LOVABLE_API_KEY is not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Build query based on parameters
    let query = supabase
      .from('knowledge_base')
      .select('id, title, content, category, subcategory, keywords, tags');

    if (articleId) {
      query = query.eq('id', articleId);
    } else if (onlyMissing && !regenerateAll) {
      query = query.is('embedding', null);
    }

    const { data: articles, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching articles:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch articles', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!articles || articles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No articles to process',
          processed: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${articles.length} articles for embedding generation`);

    const results = {
      success: [] as string[],
      failed: [] as { id: string; error: string }[],
    };

    // Process articles in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (article) => {
        try {
          // Combine article content for embedding
          const textToEmbed = [
            article.title,
            article.content,
            article.category,
            article.subcategory,
            ...(article.keywords || []),
            ...(article.tags || [])
          ].filter(Boolean).join(' ');

          // Generate embedding using Lovable AI
          const embeddingResponse = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${lovableApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              input: textToEmbed,
              model: 'text-embedding-3-small',
            }),
          });

          if (!embeddingResponse.ok) {
            const errorText = await embeddingResponse.text();
            console.error(`Embedding API error for article ${article.id}:`, errorText);
            results.failed.push({ id: article.id, error: `API error: ${embeddingResponse.status}` });
            return;
          }

          const embeddingData = await embeddingResponse.json();
          const embedding = embeddingData.data?.[0]?.embedding;

          if (!embedding) {
            console.error(`No embedding returned for article ${article.id}`);
            results.failed.push({ id: article.id, error: 'No embedding returned' });
            return;
          }

          // Format embedding for pgvector
          const embeddingString = `[${embedding.join(',')}]`;

          // Update article with embedding
          const { error: updateError } = await supabase
            .from('knowledge_base')
            .update({ embedding: embeddingString })
            .eq('id', article.id);

          if (updateError) {
            console.error(`Failed to update article ${article.id}:`, updateError);
            results.failed.push({ id: article.id, error: updateError.message });
          } else {
            console.log(`Successfully generated embedding for article: ${article.title}`);
            results.success.push(article.id);
          }
        } catch (err) {
          console.error(`Error processing article ${article.id}:`, err);
          results.failed.push({ 
            id: article.id, 
            error: err instanceof Error ? err.message : 'Unknown error' 
          });
        }
      }));

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Embedding generation complete. Success: ${results.success.length}, Failed: ${results.failed.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${articles.length} articles`,
        processed: results.success.length,
        failed: results.failed.length,
        details: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-kb-embeddings:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
