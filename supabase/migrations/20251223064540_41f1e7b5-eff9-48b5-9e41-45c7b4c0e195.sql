-- ============================================================
-- MIGRATION: iCorrespondance Workflow System
-- ============================================================

-- ENUM: Workflow step types
DO $$ BEGIN
    CREATE TYPE workflow_step_type AS ENUM (
        'CREATED',
        'SENT_FOR_APPROVAL',
        'VIEWED',
        'APPROVED',
        'REJECTED',
        'MODIFICATION_REQUESTED',
        'RETURNED_TO_AGENT',
        'READY_FOR_DELIVERY',
        'DELIVERED_PRINT',
        'DELIVERED_IBOITE',
        'ARCHIVED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Function to check if user is super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = _user_id AND role = 'super_admin'
    )
$$;

-- Function to get user organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations(_user_id UUID)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.user_environments
    WHERE user_id = _user_id AND is_active = true AND organization_id IS NOT NULL
$$;

-- Function to update read_at timestamp
CREATE OR REPLACE FUNCTION public.update_read_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ALTER TABLE: icorrespondance_folders
-- ============================================================

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS current_holder_id UUID;

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS approved_by_id UUID;

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS delivery_method TEXT;

ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_icorr_folders_holder 
ON public.icorrespondance_folders(current_holder_id);

CREATE INDEX IF NOT EXISTS idx_icorr_folders_approval 
ON public.icorrespondance_folders(requires_approval, status);

-- ============================================================
-- TABLE: icorrespondance_workflow_steps
-- ============================================================

CREATE TABLE IF NOT EXISTS public.icorrespondance_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.icorrespondance_folders(id) ON DELETE CASCADE,
    step_type TEXT NOT NULL,
    actor_id UUID NOT NULL,
    actor_name TEXT,
    actor_role TEXT,
    target_id UUID,
    target_name TEXT,
    comment TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_workflow_folder 
ON public.icorrespondance_workflow_steps(folder_id);

CREATE INDEX IF NOT EXISTS idx_workflow_actor 
ON public.icorrespondance_workflow_steps(actor_id);

CREATE INDEX IF NOT EXISTS idx_workflow_target 
ON public.icorrespondance_workflow_steps(target_id);

CREATE INDEX IF NOT EXISTS idx_workflow_created 
ON public.icorrespondance_workflow_steps(created_at DESC);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE public.icorrespondance_workflow_steps ENABLE ROW LEVEL SECURITY;

-- Lecture: voir les étapes des dossiers auxquels on a accès
CREATE POLICY "Users can view workflow steps of accessible folders"
ON public.icorrespondance_workflow_steps FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND (
            f.user_id = auth.uid() OR
            f.current_holder_id = auth.uid() OR
            public.is_super_admin(auth.uid()) OR
            f.organization_id IN (SELECT public.get_user_organizations(auth.uid()))
        )
    )
);

-- Insertion: créer des étapes pour ses propres dossiers ou si détenteur
CREATE POLICY "Users can insert workflow steps"
ON public.icorrespondance_workflow_steps FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND (
            f.user_id = auth.uid() OR
            f.current_holder_id = auth.uid() OR
            public.is_super_admin(auth.uid())
        )
    )
);

-- Update RLS pour icorrespondance_folders
DROP POLICY IF EXISTS "Users can update own folders" ON public.icorrespondance_folders;

CREATE POLICY "Users can update icorrespondance folders extended"
ON public.icorrespondance_folders FOR UPDATE
USING (
    auth.uid() = user_id OR 
    auth.uid() = current_holder_id OR
    public.is_super_admin(auth.uid())
);

-- ============================================================
-- FUNCTION: Créer une étape de workflow
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_workflow_step(
    p_folder_id UUID,
    p_step_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_comment TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_step_id UUID;
    v_actor_name TEXT;
    v_actor_role TEXT;
    v_target_name TEXT;
BEGIN
    -- Récupérer le nom de l'acteur
    SELECT 
        COALESCE(p.first_name || ' ' || p.last_name, p.email),
        COALESCE(ur.role::TEXT, 'citizen')
    INTO v_actor_name, v_actor_role
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE p.user_id = auth.uid();

    -- Récupérer le nom du destinataire si fourni
    IF p_target_id IS NOT NULL THEN
        SELECT COALESCE(p.first_name || ' ' || p.last_name, p.email)
        INTO v_target_name
        FROM public.profiles p
        WHERE p.user_id = p_target_id;
    END IF;

    -- Insérer l'étape
    INSERT INTO public.icorrespondance_workflow_steps (
        folder_id, step_type, actor_id, actor_name, actor_role,
        target_id, target_name, comment
    ) VALUES (
        p_folder_id, p_step_type, auth.uid(), v_actor_name, v_actor_role,
        p_target_id, v_target_name, p_comment
    ) RETURNING id INTO v_step_id;

    RETURN v_step_id;
END;
$$;

-- ============================================================
-- TRIGGER: Auto-update read_at
-- ============================================================

DROP TRIGGER IF EXISTS update_workflow_steps_read_at ON public.icorrespondance_workflow_steps;

CREATE TRIGGER update_workflow_steps_read_at
BEFORE UPDATE OF is_read ON public.icorrespondance_workflow_steps
FOR EACH ROW
WHEN (NEW.is_read = true AND OLD.is_read = false)
EXECUTE FUNCTION public.update_read_at_timestamp();

-- ============================================================
-- COMMENTS
-- ============================================================

COMMENT ON TABLE public.icorrespondance_workflow_steps IS 
'Historique des étapes du workflow iCorrespondance - traçabilité complète du parcours des dossiers';

COMMENT ON COLUMN public.icorrespondance_folders.current_holder_id IS 
'ID de l''utilisateur qui détient actuellement le dossier';

COMMENT ON COLUMN public.icorrespondance_folders.requires_approval IS 
'Indique si le dossier nécessite une approbation du Maire/Adjoint';

COMMENT ON COLUMN public.icorrespondance_folders.delivery_method IS 
'Méthode de livraison: PRINT (impression), IBOITE (messagerie), PENDING (en attente)';