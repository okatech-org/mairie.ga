-- Enable pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Add missing columns to knowledge_base table
ALTER TABLE public.knowledge_base 
ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS embedding VECTOR(1536);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_knowledge_base_category ON public.knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_active ON public.knowledge_base(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_knowledge_base_tags ON public.knowledge_base USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_keywords ON public.knowledge_base USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_priority ON public.knowledge_base(priority DESC);

-- Create embedding similarity search index (if embedding column exists)
CREATE INDEX IF NOT EXISTS idx_knowledge_base_embedding ON public.knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);