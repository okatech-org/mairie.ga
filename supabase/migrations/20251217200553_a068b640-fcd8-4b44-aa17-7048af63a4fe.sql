-- ============================================================
-- Fonction: search_global_recipients
-- Recherche unifiée parmi profils, organisations et services
-- ============================================================
CREATE OR REPLACE FUNCTION public.search_global_recipients(
    search_query TEXT DEFAULT '',
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
    
    -- Utilisateurs (profils)
    SELECT 
        'USER'::TEXT AS recipient_type,
        p.user_id AS recipient_id,
        (p.first_name || ' ' || p.last_name)::TEXT AS display_name,
        COALESCE(ur.role::TEXT, 'Utilisateur')::TEXT AS subtitle,
        p.email::TEXT AS email,
        NULL::TEXT AS avatar_url,
        NULL::UUID AS organization_id,
        NULL::TEXT AS organization_name
    FROM profiles p
    LEFT JOIN user_roles ur ON ur.user_id = p.user_id
    WHERE include_users = true
      AND p.user_id != COALESCE(searcher_id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND (
          search_query = '' 
          OR p.first_name ILIKE '%' || search_query || '%'
          OR p.last_name ILIKE '%' || search_query || '%'
          OR (p.first_name || ' ' || p.last_name) ILIKE '%' || search_query || '%'
          OR p.email ILIKE '%' || search_query || '%'
      )
    
    UNION ALL
    
    -- Organisations
    SELECT 
        'ORGANIZATION'::TEXT AS recipient_type,
        o.id AS recipient_id,
        o.name::TEXT AS display_name,
        COALESCE(o.city, o.departement, o.type::TEXT)::TEXT AS subtitle,
        o.contact_email::TEXT AS email,
        o.logo_url::TEXT AS avatar_url,
        o.id AS organization_id,
        o.name::TEXT AS organization_name
    FROM organizations o
    WHERE include_organizations = true
      AND (
          search_query = ''
          OR o.name ILIKE '%' || search_query || '%'
          OR o.city ILIKE '%' || search_query || '%'
          OR o.departement ILIKE '%' || search_query || '%'
      )
    
    UNION ALL
    
    -- Services
    SELECT 
        'SERVICE'::TEXT AS recipient_type,
        s.id AS recipient_id,
        s.name::TEXT AS display_name,
        COALESCE(o.name, s.category, 'Service')::TEXT AS subtitle,
        NULL::TEXT AS email,
        NULL::TEXT AS avatar_url,
        s.organization_id AS organization_id,
        o.name::TEXT AS organization_name
    FROM services s
    LEFT JOIN organizations o ON o.id = s.organization_id
    WHERE include_services = true
      AND s.is_active = true
      AND (
          search_query = ''
          OR s.name ILIKE '%' || search_query || '%'
          OR s.description ILIKE '%' || search_query || '%'
          OR s.category ILIKE '%' || search_query || '%'
      )
    
    ORDER BY display_name
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- Fonction: get_all_organizations
-- Liste toutes les organisations disponibles
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
        o.name::TEXT,
        o.city::TEXT,
        o.departement::TEXT,
        o.contact_email::TEXT,
        o.logo_url::TEXT,
        o.type::TEXT,
        o.maire_name::TEXT
    FROM organizations o
    ORDER BY o.name
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- Fonction: get_organization_services
-- Liste les services (optionnellement par organisation)
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
        s.name::TEXT,
        s.description::TEXT,
        s.category::TEXT,
        s.organization_id,
        o.name::TEXT AS organization_name
    FROM services s
    LEFT JOIN organizations o ON o.id = s.organization_id
    WHERE s.is_active = true
      AND (org_id IS NULL OR s.organization_id = org_id)
    ORDER BY o.name, s.name
    LIMIT limit_count;
END;
$$;