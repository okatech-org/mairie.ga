-- Add missing columns to arretes table
ALTER TABLE public.arretes 
ADD COLUMN IF NOT EXISTS objet TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_arretes_numero ON public.arretes(numero);
CREATE INDEX IF NOT EXISTS idx_arretes_date_signature ON public.arretes(date_signature DESC);
CREATE INDEX IF NOT EXISTS idx_arretes_type ON public.arretes(type);
CREATE INDEX IF NOT EXISTS idx_arretes_status ON public.arretes(status);