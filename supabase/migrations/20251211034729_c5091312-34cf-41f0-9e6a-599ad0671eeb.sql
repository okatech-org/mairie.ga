-- Create table for embedding generation history
CREATE TABLE public.embedding_generation_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    processed INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled', 'error')),
    error_message TEXT,
    failed_articles JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.embedding_generation_history ENABLE ROW LEVEL SECURITY;

-- Admins can view all history
CREATE POLICY "Admins can view all embedding history"
ON public.embedding_generation_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can insert history
CREATE POLICY "Admins can insert embedding history"
ON public.embedding_generation_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can update history
CREATE POLICY "Admins can update embedding history"
ON public.embedding_generation_history
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Admins can delete history
CREATE POLICY "Admins can delete embedding history"
ON public.embedding_generation_history
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_embedding_history_user_id ON public.embedding_generation_history(user_id);
CREATE INDEX idx_embedding_history_created_at ON public.embedding_generation_history(created_at DESC);