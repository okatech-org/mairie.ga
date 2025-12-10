-- Ajouter la colonne organization_id à service_document_settings
ALTER TABLE public.service_document_settings 
ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Supprimer la contrainte d'unicité sur service_role seul
ALTER TABLE public.service_document_settings DROP CONSTRAINT IF EXISTS service_document_settings_service_role_key;

-- Ajouter une contrainte d'unicité sur (service_role, organization_id)
ALTER TABLE public.service_document_settings 
ADD CONSTRAINT service_document_settings_role_org_unique UNIQUE (service_role, organization_id);

-- Index pour les recherches par organisation
CREATE INDEX idx_service_document_settings_org ON public.service_document_settings(organization_id);

-- Table pour l'historique des modifications
CREATE TABLE public.document_settings_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    settings_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
    field_changed TEXT,
    old_value TEXT,
    new_value TEXT,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches
CREATE INDEX idx_document_settings_audit_settings ON public.document_settings_audit(settings_id);
CREATE INDEX idx_document_settings_audit_org ON public.document_settings_audit(organization_id);
CREATE INDEX idx_document_settings_audit_user ON public.document_settings_audit(user_id);
CREATE INDEX idx_document_settings_audit_created ON public.document_settings_audit(created_at DESC);

-- Enable RLS
ALTER TABLE public.document_settings_audit ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour les admins
CREATE POLICY "Admins can view audit logs"
ON public.document_settings_audit
FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
);

-- Politique d'insertion (système)
CREATE POLICY "System can insert audit logs"
ON public.document_settings_audit
FOR INSERT
WITH CHECK (true);

-- Mettre à jour les RLS de service_document_settings pour inclure organization_id
DROP POLICY IF EXISTS "Authenticated users can read document settings" ON public.service_document_settings;
DROP POLICY IF EXISTS "Admins can update document settings" ON public.service_document_settings;

-- Nouvelle politique de lecture
CREATE POLICY "Authenticated users can read document settings"
ON public.service_document_settings
FOR SELECT
TO authenticated
USING (true);

-- Nouvelle politique de mise à jour (admins de l'organisation ou super admin)
CREATE POLICY "Admins can update document settings"
ON public.service_document_settings
FOR UPDATE
USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR 
    has_role(auth.uid(), 'admin'::app_role)
);