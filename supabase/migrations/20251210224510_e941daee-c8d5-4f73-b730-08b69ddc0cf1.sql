-- Add missing columns to deliberations table
ALTER TABLE public.deliberations 
ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'ordinaire',
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS commission TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Add check constraint for session_type
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'deliberations_session_type_check'
  ) THEN
    ALTER TABLE public.deliberations ADD CONSTRAINT deliberations_session_type_check 
    CHECK (session_type IN ('ordinaire', 'extraordinaire'));
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliberations_numero ON public.deliberations(numero);
CREATE INDEX IF NOT EXISTS idx_deliberations_session_date ON public.deliberations(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_deliberations_resultat ON public.deliberations(resultat);