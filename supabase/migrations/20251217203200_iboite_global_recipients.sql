-- ============================================================
-- MIGRATION: Système de Destinataires Globaux iBoîte
-- ============================================================
-- Permet de rechercher parmi:
-- 1. Utilisateurs (profiles)
-- 2. Organisations (mairies, consulats)
-- 3. Services municipaux
-- ============================================================

-- ============================================================
-- TYPE: Résultat de recherche global
-- ============================================================

DO $$ BEGIN
    CREATE TYPE recipient_type AS ENUM ('USER', 'ORGANIZATION', 'SERVICE', 'EXTERNAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- FUNCTION: Recherche globale de destinataires
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_global_recipients(
    search_query TEXT,
    searcher_id UUID DEFAULT NULL,
    include_organizations BOOLEAN DEFAULT true,
    include_services BOOLEAN DEFAULT true,
    include_users BOOLEAN DEFAULT true,
    limit_count INTEGER DEFAULT 30
)
RETURNS TABLE (
    recipient_type TEXT,
    recipient_id UUID,
    display_name TEXT,
    subtitle TEXT,
    email TEXT,
    avatar_url TEXT,
    organization_id UUID,
    organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    
    -- 1. Recherche dans les PROFILS (utilisateurs)
    SELECT 
        'USER'::TEXT AS recipient_type,
        p.user_id AS recipient_id,
        COALESCE(p.first_name || ' ' || p.last_name, p.email) AS display_name,
        COALESCE(p.profession, 'Utilisateur') AS subtitle,
        p.email AS email,
        NULL::TEXT AS avatar_url,
        NULL::UUID AS organization_id,
        NULL::TEXT AS organization_name
    FROM public.profiles p
    WHERE 
        include_users = true
        AND p.user_id != COALESCE(searcher_id, '00000000-0000-0000-0000-000000000000'::UUID)
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR (p.first_name || ' ' || p.last_name) ILIKE '%' || search_query || '%'
            OR p.email ILIKE '%' || search_query || '%'
        )
    
    UNION ALL
    
    -- 2. Recherche dans les ORGANISATIONS (mairies)
    SELECT 
        'ORGANIZATION'::TEXT AS recipient_type,
        o.id AS recipient_id,
        o.name AS display_name,
        COALESCE(o.city, o.departement, 'Organisation') AS subtitle,
        o.contact_email AS email,
        o.logo_url AS avatar_url,
        o.id AS organization_id,
        o.name AS organization_name
    FROM public.organizations o
    WHERE 
        include_organizations = true
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR o.name ILIKE '%' || search_query || '%'
            OR o.city ILIKE '%' || search_query || '%'
            OR o.departement ILIKE '%' || search_query || '%'
        )
    
    UNION ALL
    
    -- 3. Recherche dans les SERVICES
    SELECT 
        'SERVICE'::TEXT AS recipient_type,
        s.id AS recipient_id,
        s.name AS display_name,
        COALESCE(o.name, s.category, 'Service') AS subtitle,
        o.contact_email AS email,
        o.logo_url AS avatar_url,
        o.id AS organization_id,
        o.name AS organization_name
    FROM public.services s
    LEFT JOIN public.organizations o ON s.organization_id = o.id
    WHERE 
        include_services = true
        AND s.is_active = true
        AND (
            search_query IS NULL 
            OR search_query = ''
            OR s.name ILIKE '%' || search_query || '%'
            OR s.description ILIKE '%' || search_query || '%'
            OR s.category ILIKE '%' || search_query || '%'
        )
    
    ORDER BY display_name
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- FUNCTION: Récupérer toutes les organisations
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_all_organizations(
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    city TEXT,
    departement TEXT,
    contact_email TEXT,
    logo_url TEXT,
    type TEXT,
    maire_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.name,
        o.city,
        o.departement,
        o.contact_email,
        o.logo_url,
        o.type::TEXT,
        o.maire_name
    FROM public.organizations o
    ORDER BY o.name
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- FUNCTION: Récupérer tous les services d'une organisation
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_organization_services(
    org_id UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 100
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    category TEXT,
    organization_id UUID,
    organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.description,
        s.category,
        s.organization_id,
        o.name AS organization_name
    FROM public.services s
    LEFT JOIN public.organizations o ON s.organization_id = o.id
    WHERE 
        s.is_active = true
        AND (org_id IS NULL OR s.organization_id = org_id)
    ORDER BY s.name
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- GRANTS: Permissions pour les fonctions
-- ============================================================

GRANT EXECUTE ON FUNCTION public.search_global_recipients TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_organizations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_organization_services TO authenticated;

-- ============================================================
-- COMMENT: Documentation
-- ============================================================

COMMENT ON FUNCTION public.search_global_recipients IS 'Recherche globale de destinataires pour iBoîte (utilisateurs, organisations, services)';
COMMENT ON FUNCTION public.get_all_organizations IS 'Liste toutes les organisations disponibles pour iBoîte';
COMMENT ON FUNCTION public.get_organization_services IS 'Liste les services d''une organisation pour iBoîte';
