-- D'abord, créer les nouvelles tables sans utiliser les fonctions avec les nouveaux enums

-- Créer la table pour les documents uploadés
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  category text,
  request_id uuid REFERENCES public.requests(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Politiques RLS simples pour documents
CREATE POLICY "Users can view own documents"
ON public.documents FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
ON public.documents FOR DELETE
USING (auth.uid() = user_id);

-- Créer la table pour les sessions de conversation
CREATE TABLE IF NOT EXISTS public.conversation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text,
  context jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
ON public.conversation_sessions FOR ALL
USING (auth.uid() = user_id);

-- Créer la table pour les messages de conversation
CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.conversation_sessions(id) ON DELETE CASCADE,
  role text NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
ON public.conversation_messages FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.conversation_sessions cs
    WHERE cs.id = session_id AND cs.user_id = auth.uid()
  )
);

-- Ajouter les nouvelles colonnes à organizations
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS province text,
ADD COLUMN IF NOT EXISTS departement text,
ADD COLUMN IF NOT EXISTS population integer,
ADD COLUMN IF NOT EXISTS maire_name text,
ADD COLUMN IF NOT EXISTS contact_email text,
ADD COLUMN IF NOT EXISTS contact_phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS logo_url text;

-- Ajouter les nouvelles colonnes à profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS lieu_naissance text,
ADD COLUMN IF NOT EXISTS numero_cni text,
ADD COLUMN IF NOT EXISTS profession text,
ADD COLUMN IF NOT EXISTS situation_matrimoniale text,
ADD COLUMN IF NOT EXISTS quartier text,
ADD COLUMN IF NOT EXISTS arrondissement text;

-- Ajouter les nouvelles colonnes à requests
ALTER TABLE public.requests
ADD COLUMN IF NOT EXISTS demandeur_type text DEFAULT 'citizen',
ADD COLUMN IF NOT EXISTS numero_dossier text,
ADD COLUMN IF NOT EXISTS montant_frais numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS paiement_statut text DEFAULT 'non_paye',
ADD COLUMN IF NOT EXISTS date_rdv timestamptz,
ADD COLUMN IF NOT EXISTS motif_rejet text;

-- Créer un index unique pour le numéro de dossier
CREATE UNIQUE INDEX IF NOT EXISTS idx_requests_numero_dossier ON public.requests(numero_dossier) WHERE numero_dossier IS NOT NULL;

-- Fonction pour générer un numéro de dossier
CREATE OR REPLACE FUNCTION public.generate_numero_dossier()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero_dossier := 'MAI-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM() * 100000) AS TEXT), 5, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger pour générer automatiquement le numéro de dossier
DROP TRIGGER IF EXISTS generate_dossier_number ON public.requests;
CREATE TRIGGER generate_dossier_number
BEFORE INSERT ON public.requests
FOR EACH ROW
WHEN (NEW.numero_dossier IS NULL)
EXECUTE FUNCTION public.generate_numero_dossier();