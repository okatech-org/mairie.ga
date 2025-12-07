-- Create document_vault table for secure document storage
CREATE TABLE public.document_vault (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT,
    category TEXT NOT NULL DEFAULT 'other',
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    thumbnail_path TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMP WITH TIME ZONE,
    source TEXT DEFAULT 'upload',
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for user lookups
CREATE INDEX idx_document_vault_user_id ON public.document_vault(user_id);
CREATE INDEX idx_document_vault_category ON public.document_vault(category);
CREATE INDEX idx_document_vault_created_at ON public.document_vault(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;

-- Block anonymous access
CREATE POLICY "Block anonymous access to document_vault"
ON public.document_vault
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Users can view their own documents
CREATE POLICY "Users can view own vault documents"
ON public.document_vault
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own documents
CREATE POLICY "Users can create vault documents"
ON public.document_vault
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own vault documents"
ON public.document_vault
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own vault documents"
ON public.document_vault
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_document_vault_updated_at
BEFORE UPDATE ON public.document_vault
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create storage bucket for document vault
INSERT INTO storage.buckets (id, name, public)
VALUES ('document-vault', 'document-vault', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for document vault bucket
CREATE POLICY "Users can upload to document vault"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own document vault files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own document vault files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);