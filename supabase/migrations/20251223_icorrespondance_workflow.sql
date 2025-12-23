-- ============================================================
-- MIGRATION: iCorrespondance Workflow System
-- ============================================================
-- Ajoute le système de workflow administratif avec:
-- - Chaîne de validation: Agent → Maire/Adjoint → Agent → Usager
-- - Traçabilité automatique du parcours
-- - Remise finale via impression ou iBoîte
-- ============================================================

-- ============================================================
-- ENUM: Workflow step types
-- ============================================================

DO $$ BEGIN
    CREATE TYPE workflow_step_type AS ENUM (
        'CREATED',           -- Dossier créé par l'agent
        'SENT_FOR_APPROVAL', -- Envoyé pour approbation
        'VIEWED',            -- Consulté par le destinataire
        'APPROVED',          -- Approuvé par le Maire/Adjoint
        'REJECTED',          -- Rejeté avec motif
        'MODIFICATION_REQUESTED', -- Demande de modification
        'RETURNED_TO_AGENT', -- Retourné à l'agent
        'READY_FOR_DELIVERY',-- Prêt pour remise
        'DELIVERED_PRINT',   -- Livré par impression
        'DELIVERED_IBOITE',  -- Livré via iBoîte
        'ARCHIVED'           -- Archivé
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- ALTER TABLE: icorrespondance_folders - Nouvelles colonnes
-- ============================================================

-- Qui détient actuellement le dossier
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS current_holder_id UUID REFERENCES auth.users(id);

-- Le dossier nécessite-t-il une approbation?
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;

-- Qui a approuvé le dossier
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS approved_by_id UUID REFERENCES auth.users(id);

-- Date d'approbation
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;

-- Méthode de livraison
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS delivery_method TEXT CHECK (
    delivery_method IN ('PRINT', 'IBOITE', 'PENDING', NULL)
);

-- Date de livraison
ALTER TABLE public.icorrespondance_folders 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE;

-- Mise à jour de la contrainte de statut pour inclure nouveaux statuts
ALTER TABLE public.icorrespondance_folders 
DROP CONSTRAINT IF EXISTS icorrespondance_folders_status_check;

ALTER TABLE public.icorrespondance_folders 
ADD CONSTRAINT icorrespondance_folders_status_check CHECK (
    status IN (
        'DRAFT',              -- Brouillon
        'PENDING_APPROVAL',   -- En attente d'approbation
        'APPROVED',           -- Approuvé
        'REJECTED',           -- Rejeté
        'READY_FOR_DELIVERY', -- Prêt pour remise
        'DELIVERED',          -- Livré
        'SENT',               -- Envoyé (legacy)
        'ARCHIVED'            -- Archivé
    )
);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_icorr_folders_holder 
ON public.icorrespondance_folders(current_holder_id);

CREATE INDEX IF NOT EXISTS idx_icorr_folders_approval 
ON public.icorrespondance_folders(requires_approval, status);

-- ============================================================
-- TABLE: icorrespondance_workflow_steps (Historique du workflow)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.icorrespondance_workflow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.icorrespondance_folders(id) ON DELETE CASCADE,
    
    -- Type d'étape
    step_type TEXT NOT NULL,
    
    -- Acteur de l'action
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    actor_name TEXT,           -- Nom affiché (cache)
    actor_role TEXT,           -- Rôle au moment de l'action
    
    -- Destinataire (si transfert)
    target_id UUID REFERENCES auth.users(id),
    target_name TEXT,
    
    -- Détails
    comment TEXT,              -- Commentaire/motif
    is_read BOOLEAN DEFAULT false,  -- A été lu par le destinataire
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
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
-- RLS POLICIES pour workflow_steps
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

-- ============================================================
-- UPDATE RLS: icorrespondance_folders - Permettre au détenteur de modifier
-- ============================================================

-- Supprimer l'ancienne policy d'update
DROP POLICY IF EXISTS "Users can update own icorrespondance folders" 
ON public.icorrespondance_folders;

-- Nouvelle policy: propriétaire OU détenteur actuel OU super admin
CREATE POLICY "Users can update icorrespondance folders"
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
    SELECT COALESCE(
        p.first_name || ' ' || p.last_name,
        u.email
    ), p.role INTO v_actor_name, v_actor_role
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE u.id = auth.uid();
    
    -- Récupérer le nom du destinataire si fourni
    IF p_target_id IS NOT NULL THEN
        SELECT COALESCE(
            p.first_name || ' ' || p.last_name,
            u.email
        ) INTO v_target_name
        FROM auth.users u
        LEFT JOIN public.profiles p ON p.id = u.id
        WHERE u.id = p_target_id;
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
-- TRIGGER: Auto-update timestamps
-- ============================================================

CREATE TRIGGER update_workflow_steps_read_at
BEFORE UPDATE OF is_read ON public.icorrespondance_workflow_steps
FOR EACH ROW
WHEN (NEW.is_read = true AND OLD.is_read = false)
EXECUTE FUNCTION update_read_at_timestamp();

-- Créer la fonction si elle n'existe pas
CREATE OR REPLACE FUNCTION update_read_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.read_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
