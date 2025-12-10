-- Add missing columns to document_vault table
ALTER TABLE public.document_vault 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_document_vault_user ON public.document_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_category ON public.document_vault(category);
CREATE INDEX IF NOT EXISTS idx_document_vault_created ON public.document_vault(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_vault_favorite ON public.document_vault(is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_document_vault_archived ON public.document_vault(is_archived) WHERE is_archived = true;