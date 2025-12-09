-- Function to assign demo user role based on metadata
CREATE OR REPLACE FUNCTION public.assign_demo_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  demo_role text;
  app_role_value app_role;
BEGIN
  -- Check if this is a demo user (email ends with @demo.mairie.ga)
  IF NEW.email LIKE '%@demo.mairie.ga' THEN
    -- Get the role from user metadata
    demo_role := NEW.raw_user_meta_data->>'role';
    
    -- Map demo role to app_role
    IF demo_role = 'ADMIN' THEN
      app_role_value := 'super_admin';
    ELSIF demo_role IN ('MAIRE', 'MAIRE_ADJOINT', 'SECRETAIRE_GENERAL') THEN
      app_role_value := 'admin';
    ELSIF demo_role IN ('CHEF_SERVICE', 'CHEF_BUREAU', 'AGENT_MUNICIPAL', 'AGENT_ETAT_CIVIL', 'AGENT_TECHNIQUE', 'AGENT_ACCUEIL', 'STAGIAIRE') THEN
      app_role_value := 'agent';
    ELSE
      -- Default to citizen for all other roles (CITOYEN, ETRANGER_RESIDENT, etc.)
      app_role_value := 'citizen';
    END IF;
    
    -- Insert the role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, app_role_value)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-assign roles for demo users
DROP TRIGGER IF EXISTS on_demo_user_created ON auth.users;
CREATE TRIGGER on_demo_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_demo_user_role();