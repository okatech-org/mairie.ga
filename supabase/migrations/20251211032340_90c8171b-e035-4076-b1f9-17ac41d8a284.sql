-- Add missing columns to urbanisme_dossiers table
ALTER TABLE public.urbanisme_dossiers 
ADD COLUMN IF NOT EXISTS demandeur_nom TEXT,
ADD COLUMN IF NOT EXISTS demandeur_adresse TEXT,
ADD COLUMN IF NOT EXISTS parcelle_reference TEXT,
ADD COLUMN IF NOT EXISTS adresse_travaux TEXT,
ADD COLUMN IF NOT EXISTS instructeur_id UUID,
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_urbanisme_numero ON public.urbanisme_dossiers(numero);
CREATE INDEX IF NOT EXISTS idx_urbanisme_type ON public.urbanisme_dossiers(type);
CREATE INDEX IF NOT EXISTS idx_urbanisme_status ON public.urbanisme_dossiers(status);
CREATE INDEX IF NOT EXISTS idx_urbanisme_demandeur ON public.urbanisme_dossiers(demandeur_id);
CREATE INDEX IF NOT EXISTS idx_urbanisme_instructeur ON public.urbanisme_dossiers(instructeur_id);
CREATE INDEX IF NOT EXISTS idx_urbanisme_date_depot ON public.urbanisme_dossiers(date_depot DESC);