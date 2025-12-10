-- Table pour les paramètres de mise en page des documents officiels par service
CREATE TABLE public.service_document_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_role TEXT NOT NULL UNIQUE,
    province TEXT DEFAULT 'Province de l''Estuaire',
    commune TEXT DEFAULT 'Commune de Libreville',
    cabinet TEXT DEFAULT 'CABINET DU MAIRE',
    republic TEXT DEFAULT 'RÉPUBLIQUE GABONAISE',
    motto TEXT DEFAULT 'Union - Travail - Justice',
    signature_title TEXT DEFAULT 'Le Maire de la Commune de Libreville',
    footer_address TEXT DEFAULT 'BP : 44 Boulevard Triomphal/LBV',
    footer_email TEXT DEFAULT 'E-mail : libreville@mairie.ga',
    logo_url TEXT DEFAULT '/assets/logo_libreville.png',
    primary_color TEXT DEFAULT '#1e3a8a',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches par rôle
CREATE INDEX idx_service_document_settings_role ON public.service_document_settings(service_role);

-- Enable RLS
ALTER TABLE public.service_document_settings ENABLE ROW LEVEL SECURITY;

-- Politique de lecture pour tous les utilisateurs authentifiés
CREATE POLICY "Authenticated users can read document settings"
ON public.service_document_settings
FOR SELECT
TO authenticated
USING (true);

-- Politique de mise à jour pour les admins
CREATE POLICY "Admins can update document settings"
ON public.service_document_settings
FOR UPDATE
USING (
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'super_admin'::app_role)
);

-- Politique d'insertion pour les super admins
CREATE POLICY "Super admins can insert document settings"
ON public.service_document_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Politique de suppression pour les super admins
CREATE POLICY "Super admins can delete document settings"
ON public.service_document_settings
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Trigger pour updated_at
CREATE TRIGGER update_service_document_settings_updated_at
BEFORE UPDATE ON public.service_document_settings
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Données initiales pour les différents services
INSERT INTO public.service_document_settings (service_role, province, commune, cabinet, signature_title)
VALUES 
    ('maire', 'Province de l''Estuaire', 'Commune de Libreville', 'CABINET DU MAIRE', 'Le Maire de la Commune de Libreville'),
    ('secretaire_general', 'Province de l''Estuaire', 'Commune de Libreville', 'SECRÉTARIAT GÉNÉRAL', 'Le Secrétaire Général'),
    ('chef_service', 'Province de l''Estuaire', 'Commune de Libreville', 'DIRECTION DES SERVICES', 'Le Chef de Service');