-- Table user_environments pour gérer les 3 environnements utilisateurs
CREATE TABLE IF NOT EXISTS public.user_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    environment TEXT NOT NULL CHECK (environment IN ('BACK_OFFICE', 'MUNICIPAL_STAFF', 'PUBLIC_USER')),
    role TEXT NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_environments ENABLE ROW LEVEL SECURITY;

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_environments_user_id ON public.user_environments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_environments_org ON public.user_environments(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_environments_env ON public.user_environments(environment);

-- Policies
CREATE POLICY "Users can view own environment"
ON public.user_environments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all environments"
ON public.user_environments FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage environments"
ON public.user_environments FOR ALL
USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "System can insert environments"
ON public.user_environments FOR INSERT
WITH CHECK (true);

-- Trigger pour updated_at
CREATE TRIGGER update_user_environments_updated_at
    BEFORE UPDATE ON public.user_environments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();