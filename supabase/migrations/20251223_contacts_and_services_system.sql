-- ============================================================
-- Migration: Système de Contacts et Services
-- Date: 2025-12-23
-- Description: Ajoute les champs de contact aux profiles, crée la table
--              service_members et la vue contacts_directory
-- ============================================================

-- ============================================================
-- 1. ENRICHIR LA TABLE PROFILES
-- ============================================================

-- Ajouter les colonnes de contact au profil
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS position TEXT,
  ADD COLUMN IF NOT EXISTS service_phone TEXT,
  ADD COLUMN IF NOT EXISTS is_public_contact BOOLEAN DEFAULT false;

-- Index pour recherche des contacts publics
CREATE INDEX IF NOT EXISTS idx_profiles_is_public_contact 
  ON public.profiles(is_public_contact) WHERE is_public_contact = true;

COMMENT ON COLUMN public.profiles.position IS 'Poste/fonction dans l''organisation';
COMMENT ON COLUMN public.profiles.service_phone IS 'Téléphone de service (différent du téléphone personnel)';
COMMENT ON COLUMN public.profiles.is_public_contact IS 'Si true, visible aux visiteurs/citoyens';

-- ============================================================
-- 2. TABLE SERVICE_MEMBERS (Appartenance aux services)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rôle dans le service
  member_role TEXT NOT NULL DEFAULT 'MEMBER' CHECK (member_role IN ('LEADER', 'MEMBER', 'BACKUP')),
  
  -- Permissions spécifiques
  can_receive_correspondence BOOLEAN DEFAULT true,
  can_receive_calls BOOLEAN DEFAULT true,
  
  -- Ordre d'affichage/priorité
  display_order INTEGER DEFAULT 0,
  
  -- Métadonnées
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contrainte d'unicité
  CONSTRAINT service_members_unique UNIQUE (service_id, user_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_service_members_service_id ON public.service_members(service_id);
CREATE INDEX IF NOT EXISTS idx_service_members_user_id ON public.service_members(user_id);
CREATE INDEX IF NOT EXISTS idx_service_members_role ON public.service_members(member_role);

-- Trigger updated_at
CREATE TRIGGER set_updated_at_service_members
  BEFORE UPDATE ON public.service_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON TABLE public.service_members IS 'Appartenance des utilisateurs aux services avec rôles';
COMMENT ON COLUMN public.service_members.member_role IS 'LEADER = responsable, MEMBER = membre, BACKUP = suppléant';
COMMENT ON COLUMN public.service_members.can_receive_correspondence IS 'Peut recevoir les correspondances du service';
COMMENT ON COLUMN public.service_members.can_receive_calls IS 'Peut recevoir les appels du service';

-- ============================================================
-- 3. VUE CONTACTS_DIRECTORY (Annuaire unifié)
-- ============================================================

CREATE OR REPLACE VIEW public.contacts_directory AS
SELECT 
  p.user_id,
  p.id AS profile_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'Utilisateur') AS display_name,
  p.first_name,
  p.last_name,
  p.phone,
  p.position,
  p.service_phone,
  p.is_public_contact,
  ue.environment,
  ue.role,
  ue.organization_id,
  o.name AS organization_name,
  o.city AS organization_city,
  -- Services auxquels l'utilisateur appartient
  (
    SELECT jsonb_agg(jsonb_build_object(
      'id', s.id,
      'name', s.name,
      'role', sm.member_role
    ))
    FROM public.service_members sm
    JOIN public.services s ON sm.service_id = s.id
    WHERE sm.user_id = p.user_id
  ) AS services
FROM public.profiles p
LEFT JOIN public.user_environments ue ON p.user_id = ue.user_id AND ue.is_active = true
LEFT JOIN public.organizations o ON ue.organization_id = o.id;

COMMENT ON VIEW public.contacts_directory IS 'Vue consolidée de l''annuaire des contacts avec leurs services';

-- ============================================================
-- 4. POLITIQUES RLS POUR SERVICE_MEMBERS
-- ============================================================

ALTER TABLE public.service_members ENABLE ROW LEVEL SECURITY;

-- Le personnel municipal peut voir tous les membres
CREATE POLICY "Staff can view all service members"
  ON public.service_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_environments ue
      WHERE ue.user_id = auth.uid()
      AND ue.is_active = true
      AND ue.environment IN ('BACK_OFFICE', 'MUNICIPAL_STAFF')
    )
  );

-- Les admins peuvent gérer les membres
CREATE POLICY "Admins can manage service members"
  ON public.service_members
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role) 
    OR public.has_role(auth.uid(), 'super_admin'::public.app_role)
  );

-- Les leaders de service peuvent gérer leur service
CREATE POLICY "Service leaders can manage their service"
  ON public.service_members
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.service_members sm
      WHERE sm.user_id = auth.uid()
      AND sm.service_id = service_members.service_id
      AND sm.member_role = 'LEADER'
    )
  );

-- ============================================================
-- 5. FONCTION POUR RÉCUPÉRER LES CONTACTS SELON LE RÔLE
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_contacts_for_user(
  p_user_id UUID,
  p_include_services BOOLEAN DEFAULT true,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  phone TEXT,
  position TEXT,
  service_phone TEXT,
  is_public_contact BOOLEAN,
  environment TEXT,
  role TEXT,
  organization_id UUID,
  organization_name TEXT,
  services JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_environment TEXT;
BEGIN
  -- Déterminer l'environnement de l'utilisateur
  SELECT ue.environment INTO v_user_environment
  FROM public.user_environments ue
  WHERE ue.user_id = p_user_id AND ue.is_active = true
  LIMIT 1;

  -- Si personnel municipal ou back office: accès à tous les contacts
  IF v_user_environment IN ('BACK_OFFICE', 'MUNICIPAL_STAFF') THEN
    RETURN QUERY
    SELECT 
      cd.user_id,
      cd.display_name,
      cd.phone,
      cd.position,
      cd.service_phone,
      cd.is_public_contact,
      cd.environment,
      cd.role,
      cd.organization_id,
      cd.organization_name,
      cd.services
    FROM public.contacts_directory cd
    WHERE cd.environment IN ('BACK_OFFICE', 'MUNICIPAL_STAFF')
    ORDER BY cd.display_name
    LIMIT p_limit;
  ELSE
    -- Usagers publics: seulement les contacts publics + services liés à leurs dossiers
    RETURN QUERY
    SELECT 
      cd.user_id,
      cd.display_name,
      cd.phone,
      cd.position,
      cd.service_phone,
      cd.is_public_contact,
      cd.environment,
      cd.role,
      cd.organization_id,
      cd.organization_name,
      cd.services
    FROM public.contacts_directory cd
    WHERE cd.is_public_contact = true
       OR cd.user_id IN (
         -- Agents assignés aux demandes de l'usager
         SELECT r.assigned_to FROM public.requests r WHERE r.citizen_id = p_user_id
       )
    ORDER BY cd.display_name
    LIMIT p_limit;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.get_contacts_for_user IS 'Retourne les contacts accessibles selon l''environnement de l''utilisateur';

-- ============================================================
-- 6. FONCTION POUR OBTENIR LES MEMBRES D'UN SERVICE
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_service_members(
  p_service_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  phone TEXT,
  position TEXT,
  member_role TEXT,
  can_receive_correspondence BOOLEAN,
  can_receive_calls BOOLEAN,
  display_order INTEGER
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    sm.id,
    sm.user_id,
    COALESCE(p.first_name || ' ' || p.last_name, 'Utilisateur') AS display_name,
    COALESCE(p.service_phone, p.phone) AS phone,
    p.position,
    sm.member_role,
    sm.can_receive_correspondence,
    sm.can_receive_calls,
    sm.display_order
  FROM public.service_members sm
  JOIN public.profiles p ON sm.user_id = p.user_id
  WHERE sm.service_id = p_service_id
  ORDER BY sm.display_order, sm.joined_at;
$$;

COMMENT ON FUNCTION public.get_service_members IS 'Retourne les membres d''un service avec leurs infos de contact';
