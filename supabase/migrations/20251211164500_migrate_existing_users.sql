-- Migration des utilisateurs existants vers user_environments
-- Ce script peuple la table user_environments à partir des données de user_roles

DO $$
DECLARE
    r RECORD;
    env_type TEXT;
    env_role TEXT;
    org_id UUID;
BEGIN
    FOR r IN 
        SELECT ur.user_id, ur.role, p.address->>'organization_id' as org_id_str
        FROM public.user_roles ur
        LEFT JOIN public.profiles p ON p.user_id = ur.user_id
    LOOP
        -- Déterminer l'environnement et le rôle
        CASE r.role
            WHEN 'super_admin' THEN
                env_type := 'BACK_OFFICE';
                env_role := 'SUPER_ADMIN';
            WHEN 'admin' THEN
                env_type := 'MUNICIPAL_STAFF';
                env_role := 'MAIRE'; -- Par défaut pour les admins existants
            WHEN 'agent' THEN
                env_type := 'MUNICIPAL_STAFF';
                env_role := 'AGENT_MUNICIPAL';
            ELSE -- citizen et autres
                env_type := 'PUBLIC_USER';
                env_role := 'CITOYEN';
        END CASE;

        -- Tenter de convertir l'ID organisation si présent
        BEGIN
            org_id := r.org_id_str::UUID;
        EXCEPTION WHEN OTHERS THEN
            org_id := NULL;
        END;

        -- Insérer dans la nouvelle table si n'existe pas déjà
        INSERT INTO public.user_environments (
            user_id, 
            environment, 
            role, 
            organization_id, 
            is_active
        )
        VALUES (
            r.user_id, 
            env_type, 
            env_role, 
            org_id, 
            true
        )
        ON CONFLICT (user_id) DO NOTHING;
        
    END LOOP;
END $$;
