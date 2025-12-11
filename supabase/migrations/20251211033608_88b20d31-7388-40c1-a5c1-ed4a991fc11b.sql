-- Enable pg_net extension for HTTP requests from database
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create function to trigger embedding generation via edge function
CREATE OR REPLACE FUNCTION public.trigger_kb_embedding_generation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  supabase_url text;
  service_key text;
  request_id bigint;
BEGIN
  -- Get Supabase URL from environment (set via vault or config)
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_key := current_setting('app.settings.service_role_key', true);
  
  -- If settings not available, try to construct URL from project ref
  IF supabase_url IS NULL OR supabase_url = '' THEN
    supabase_url := 'https://ppduheroaoklcusdrlzt.supabase.co';
  END IF;
  
  -- Queue HTTP request to edge function (non-blocking)
  -- The edge function will generate and store the embedding
  SELECT extensions.http_post(
    url := supabase_url || '/functions/v1/generate-kb-embeddings',
    body := jsonb_build_object('articleId', NEW.id)::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt', true))
    )::jsonb
  ) INTO request_id;
  
  RAISE LOG 'KB embedding generation triggered for article %: request_id=%', NEW.id, request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE LOG 'Failed to trigger embedding generation for article %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS trigger_kb_embedding_on_insert ON public.knowledge_base;
CREATE TRIGGER trigger_kb_embedding_on_insert
  AFTER INSERT ON public.knowledge_base
  FOR EACH ROW
  WHEN (NEW.status = 'PUBLISHED')
  EXECUTE FUNCTION public.trigger_kb_embedding_generation();

-- Create trigger for UPDATE (only when content changes)
DROP TRIGGER IF EXISTS trigger_kb_embedding_on_update ON public.knowledge_base;
CREATE TRIGGER trigger_kb_embedding_on_update
  AFTER UPDATE ON public.knowledge_base
  FOR EACH ROW
  WHEN (
    NEW.status = 'PUBLISHED' AND (
      OLD.title IS DISTINCT FROM NEW.title OR
      OLD.content IS DISTINCT FROM NEW.content OR
      OLD.category IS DISTINCT FROM NEW.category OR
      OLD.subcategory IS DISTINCT FROM NEW.subcategory OR
      OLD.keywords IS DISTINCT FROM NEW.keywords OR
      OLD.tags IS DISTINCT FROM NEW.tags
    )
  )
  EXECUTE FUNCTION public.trigger_kb_embedding_generation();

-- Add comment for documentation
COMMENT ON FUNCTION public.trigger_kb_embedding_generation() IS 
'Triggers automatic embedding generation for knowledge base articles when they are created or updated. Only fires for PUBLISHED articles.';
