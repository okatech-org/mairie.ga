-- ============================================================
-- MIGRATION: Architecture à 3 Environnements Utilisateurs
-- ============================================================
-- 1. Super Admin & Back Office (Administrateurs Système)
-- 2. Personnel Municipal (Organismes Municipaux)
-- 3. Usagers (Citoyens, Étrangers, Associations, Entreprises)
-- ============================================================

-- ============================================================
-- ENUMS for User Environment Types
-- ============================================================

-- Type d'environnement utilisateur
CREATE TYPE user_environment AS ENUM (
    'BACK_OFFICE',      -- Super Admin et collaborateurs
    'MUNICIPAL_STAFF',  -- Personnel des organismes municipaux
    'PUBLIC_USER'       -- Citoyens, étrangers, associations, entreprises
);

-- Rôles détaillés pour le Back Office
CREATE TYPE backoffice_role AS ENUM (
    'SUPER_ADMIN',      -- Accès total, gestion globale
    'TECH_ADMIN',       -- Administration technique
    'SUPPORT_AGENT',    -- Support utilisateur
    'AUDITOR'           -- Auditeur (lecture seule)
);

-- Rôles détaillés pour le Personnel Municipal
CREATE TYPE municipal_staff_role AS ENUM (
    'MAIRE',
    'MAIRE_ADJOINT',
    'CONSEILLER_MUNICIPAL',
    'SECRETAIRE_GENERAL',
    'CHEF_SERVICE',
    'CHEF_BUREAU',
    'AGENT_MUNICIPAL',
    'AGENT_ETAT_CIVIL',
    'AGENT_TECHNIQUE',
    'AGENT_ACCUEIL',
    'STAGIAIRE'
);

-- Rôles détaillés pour les Usagers
CREATE TYPE public_user_role AS ENUM (
    'CITOYEN',              -- Citoyen de la commune
    'CITOYEN_AUTRE',        -- Citoyen d'une autre commune
    'ETRANGER_RESIDENT',    -- Étranger résident
    'ASSOCIATION',          -- Représentant d'association
    'ENTREPRISE'            -- Représentant d'entreprise
);

-- ============================================================
-- TABLE: user_environments (Lien utilisateur <-> environnement)
-- ============================================================

CREATE TABLE public.user_environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    environment user_environment NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),  -- NULL pour BACK_OFFICE
    
    -- Rôle spécifique selon l'environnement
    backoffice_role backoffice_role,
    municipal_role municipal_staff_role,
    public_role public_user_role,
    
    -- Statut et validité
    is_active BOOLEAN DEFAULT true,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
    valid_until TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID,
    
    -- Contraintes
    UNIQUE(user_id, environment, organization_id),
    
    -- Un seul rôle selon l'environnement
    CONSTRAINT check_role_matches_environment CHECK (
        (environment = 'BACK_OFFICE' AND backoffice_role IS NOT NULL AND municipal_role IS NULL AND public_role IS NULL) OR
        (environment = 'MUNICIPAL_STAFF' AND municipal_role IS NOT NULL AND backoffice_role IS NULL AND public_role IS NULL AND organization_id IS NOT NULL) OR
        (environment = 'PUBLIC_USER' AND public_role IS NOT NULL AND backoffice_role IS NULL AND municipal_role IS NULL)
    )
);

CREATE INDEX idx_user_environments_user ON public.user_environments(user_id);
CREATE INDEX idx_user_environments_org ON public.user_environments(organization_id);
CREATE INDEX idx_user_environments_env ON public.user_environments(environment);

-- ============================================================
-- TABLE: iboite_contacts (Carnet d'adresses iBoîte)
-- ============================================================

CREATE TABLE public.iboite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Contact peut être un utilisateur OU un service/département
    contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_service_id UUID,  -- Référence vers un service si c'est un service
    
    -- Infos affichées (dénormalisées pour performance)
    display_name TEXT NOT NULL,
    display_role TEXT,
    display_organization TEXT,
    avatar_url TEXT,
    
    -- Catégorisation
    category TEXT DEFAULT 'GENERAL',  -- RECENT, FAVORITE, COLLEAGUE, SERVICE, EXTERNAL
    is_favorite BOOLEAN DEFAULT false,
    
    -- Métadonnées
    last_contact_at TIMESTAMP WITH TIME ZONE,
    contact_count INTEGER DEFAULT 0,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Un contact par owner/contact_user pair
    UNIQUE(owner_id, contact_user_id)
);

CREATE INDEX idx_iboite_contacts_owner ON public.iboite_contacts(owner_id);
CREATE INDEX idx_iboite_contacts_user ON public.iboite_contacts(contact_user_id);
CREATE INDEX idx_iboite_contacts_favorite ON public.iboite_contacts(owner_id, is_favorite) WHERE is_favorite = true;

-- ============================================================
-- TABLE: iboite_service_directory (Annuaire des services)
-- ============================================================

CREATE TABLE public.iboite_service_directory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Identification du service
    service_code TEXT NOT NULL,  -- ex: ETAT_CIVIL, URBANISME, FISCALITE
    service_name TEXT NOT NULL,
    description TEXT,
    
    -- Contact responsable du service
    responsible_user_id UUID REFERENCES auth.users(id),
    contact_email TEXT,  -- Pour communication externe uniquement
    contact_phone TEXT,
    
    -- Hiérarchie
    parent_service_id UUID REFERENCES public.iboite_service_directory(id),
    
    -- Statut
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(organization_id, service_code)
);

CREATE INDEX idx_service_directory_org ON public.iboite_service_directory(organization_id);
CREATE INDEX idx_service_directory_code ON public.iboite_service_directory(service_code);

-- ============================================================
-- TABLE: iboite_conversations (Conversations iBoîte)
-- ============================================================

CREATE TABLE public.iboite_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Type de conversation
    conversation_type TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (
        conversation_type IN ('PRIVATE', 'GROUP', 'SERVICE', 'BROADCAST', 'EXTERNAL')
    ),
    
    -- Sujet/Titre
    subject TEXT,
    
    -- Pour conversations de service
    service_id UUID REFERENCES public.iboite_service_directory(id),
    
    -- Organisation associée (pour isolation)
    organization_id UUID REFERENCES public.organizations(id),
    
    -- Si c'est une conversation externe (avec email)
    external_email TEXT,
    is_external BOOLEAN DEFAULT false,
    
    -- Dernier message (dénormalisé pour performance)
    last_message_at TIMESTAMP WITH TIME ZONE,
    last_message_preview TEXT,
    last_message_sender_id UUID,
    
    -- Statut
    is_archived BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,  -- Pour les demandes
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_iboite_conv_org ON public.iboite_conversations(organization_id);
CREATE INDEX idx_iboite_conv_service ON public.iboite_conversations(service_id);
CREATE INDEX idx_iboite_conv_last_msg ON public.iboite_conversations(last_message_at DESC);
CREATE INDEX idx_iboite_conv_external ON public.iboite_conversations(is_external) WHERE is_external = true;

-- ============================================================
-- TABLE: iboite_conversation_participants (Participants)
-- ============================================================

CREATE TABLE public.iboite_conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.iboite_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Rôle dans la conversation
    participant_role TEXT DEFAULT 'MEMBER' CHECK (
        participant_role IN ('OWNER', 'ADMIN', 'MEMBER', 'OBSERVER')
    ),
    
    -- Statut de lecture
    last_read_at TIMESTAMP WITH TIME ZONE,
    unread_count INTEGER DEFAULT 0,
    
    -- Notifications
    is_muted BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,
    
    -- Statut
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    left_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    
    UNIQUE(conversation_id, user_id)
);

CREATE INDEX idx_iboite_participants_user ON public.iboite_conversation_participants(user_id);
CREATE INDEX idx_iboite_participants_conv ON public.iboite_conversation_participants(conversation_id);
CREATE INDEX idx_iboite_participants_unread ON public.iboite_conversation_participants(user_id, unread_count) WHERE unread_count > 0;

-- ============================================================
-- TABLE: iboite_messages (Messages iBoîte)
-- ============================================================

CREATE TABLE public.iboite_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.iboite_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    
    -- Contenu
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'TEXT' CHECK (
        content_type IN ('TEXT', 'HTML', 'MARKDOWN', 'SYSTEM')
    ),
    
    -- Pièces jointes
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Réponse à un message
    reply_to_id UUID REFERENCES public.iboite_messages(id),
    
    -- Mentions (@user)
    mentions JSONB DEFAULT '[]'::jsonb,
    
    -- Pour messages officiels
    is_official BOOLEAN DEFAULT false,
    official_reference TEXT,  -- Numéro de référence officiel
    
    -- Statut
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMP WITH TIME ZONE,
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_iboite_messages_conv ON public.iboite_messages(conversation_id, created_at DESC);
CREATE INDEX idx_iboite_messages_sender ON public.iboite_messages(sender_id);
CREATE INDEX idx_iboite_messages_reply ON public.iboite_messages(reply_to_id) WHERE reply_to_id IS NOT NULL;

-- ============================================================
-- TABLE: iboite_message_reads (Accusés de lecture)
-- ============================================================

CREATE TABLE public.iboite_message_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES public.iboite_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(message_id, user_id)
);

CREATE INDEX idx_iboite_reads_message ON public.iboite_message_reads(message_id);
CREATE INDEX idx_iboite_reads_user ON public.iboite_message_reads(user_id);

-- ============================================================
-- TABLE: iboite_external_correspondence (Courrier externe)
-- ============================================================

CREATE TABLE public.iboite_external_correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Expéditeur interne
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    
    -- Destinataire externe
    recipient_email TEXT NOT NULL,
    recipient_name TEXT,
    recipient_organization TEXT,
    
    -- Contenu
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    
    -- Référence
    reference_number TEXT,
    
    -- Lié à une conversation iBoîte (optionnel)
    linked_conversation_id UUID REFERENCES public.iboite_conversations(id),
    
    -- Statut d'envoi
    status TEXT DEFAULT 'DRAFT' CHECK (
        status IN ('DRAFT', 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')
    ),
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Métadonnées
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_external_corr_sender ON public.iboite_external_correspondence(sender_id);
CREATE INDEX idx_external_corr_org ON public.iboite_external_correspondence(organization_id);
CREATE INDEX idx_external_corr_status ON public.iboite_external_correspondence(status);
CREATE INDEX idx_external_corr_recipient ON public.iboite_external_correspondence(recipient_email);

-- ============================================================
-- RLS POLICIES: Isolation stricte des données
-- ============================================================

-- Enable RLS on all new tables
ALTER TABLE public.user_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_service_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_external_correspondence ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS for RLS
-- ============================================================

-- Check if user is Super Admin or Back Office
CREATE OR REPLACE FUNCTION public.is_backoffice_user(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_environments
        WHERE user_id = user_uuid
        AND environment = 'BACK_OFFICE'
        AND is_active = true
        AND (valid_until IS NULL OR valid_until > now())
    );
END;
$$;

-- Check if user is Super Admin specifically
CREATE OR REPLACE FUNCTION public.is_super_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_environments
        WHERE user_id = user_uuid
        AND environment = 'BACK_OFFICE'
        AND backoffice_role = 'SUPER_ADMIN'
        AND is_active = true
        AND (valid_until IS NULL OR valid_until > now())
    );
END;
$$;

-- Get user's organization(s) for municipal staff
CREATE OR REPLACE FUNCTION public.get_user_organizations(user_uuid UUID)
RETURNS SETOF UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id FROM public.user_environments
    WHERE user_id = user_uuid
    AND organization_id IS NOT NULL
    AND is_active = true
    AND (valid_until IS NULL OR valid_until > now());
END;
$$;

-- Check if user belongs to same organization
CREATE OR REPLACE FUNCTION public.same_organization(user1 UUID, user2 UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_environments ue1
        JOIN public.user_environments ue2 ON ue1.organization_id = ue2.organization_id
        WHERE ue1.user_id = user1
        AND ue2.user_id = user2
        AND ue1.organization_id IS NOT NULL
        AND ue1.is_active = true AND ue2.is_active = true
    );
END;
$$;

-- ============================================================
-- RLS POLICIES: user_environments
-- ============================================================

-- Users can view their own environment assignments
CREATE POLICY "Users can view own environments"
ON public.user_environments FOR SELECT
USING (auth.uid() = user_id);

-- Super Admin can view all
CREATE POLICY "Super Admin can view all environments"
ON public.user_environments FOR SELECT
USING (is_super_admin(auth.uid()));

-- Only Super Admin can manage environments
CREATE POLICY "Super Admin can manage environments"
ON public.user_environments FOR ALL
USING (is_super_admin(auth.uid()));

-- ============================================================
-- RLS POLICIES: iboite_contacts
-- ============================================================

CREATE POLICY "Users can manage own contacts"
ON public.iboite_contacts FOR ALL
USING (auth.uid() = owner_id);

-- ============================================================
-- RLS POLICIES: iboite_service_directory
-- ============================================================

-- Everyone can view active services
CREATE POLICY "Everyone can view services"
ON public.iboite_service_directory FOR SELECT
USING (is_active = true);

-- Only admins can manage services
CREATE POLICY "Admins can manage services"
ON public.iboite_service_directory FOR ALL
USING (
    is_backoffice_user(auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.user_environments
        WHERE user_id = auth.uid()
        AND organization_id = iboite_service_directory.organization_id
        AND municipal_role IN ('MAIRE', 'MAIRE_ADJOINT', 'SECRETAIRE_GENERAL')
        AND is_active = true
    )
);

-- ============================================================
-- RLS POLICIES: iboite_conversations
-- ============================================================

-- Users can view conversations they participate in
CREATE POLICY "Users can view own conversations"
ON public.iboite_conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.iboite_conversation_participants
        WHERE conversation_id = id
        AND user_id = auth.uid()
        AND is_active = true
    ) OR is_super_admin(auth.uid())
);

-- Users can create conversations
CREATE POLICY "Users can create conversations"
ON public.iboite_conversations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES: iboite_conversation_participants
-- ============================================================

-- Users can view participants of their conversations
CREATE POLICY "Users can view conversation participants"
ON public.iboite_conversation_participants FOR SELECT
USING (
    user_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM public.iboite_conversation_participants p2
        WHERE p2.conversation_id = conversation_id
        AND p2.user_id = auth.uid()
        AND p2.is_active = true
    ) OR is_super_admin(auth.uid())
);

-- Users can join/leave conversations
CREATE POLICY "Users can manage own participation"
ON public.iboite_conversation_participants FOR ALL
USING (auth.uid() = user_id OR is_super_admin(auth.uid()));

-- ============================================================
-- RLS POLICIES: iboite_messages
-- ============================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view conversation messages"
ON public.iboite_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.iboite_conversation_participants
        WHERE conversation_id = iboite_messages.conversation_id
        AND user_id = auth.uid()
        AND is_active = true
    ) OR is_super_admin(auth.uid())
);

-- Users can send messages to their conversations
CREATE POLICY "Users can send messages"
ON public.iboite_messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.iboite_conversation_participants
        WHERE conversation_id = iboite_messages.conversation_id
        AND user_id = auth.uid()
        AND is_active = true
    )
);

-- Users can edit their own messages (soft delete)
CREATE POLICY "Users can edit own messages"
ON public.iboite_messages FOR UPDATE
USING (auth.uid() = sender_id);

-- ============================================================
-- RLS POLICIES: iboite_message_reads
-- ============================================================

CREATE POLICY "Users can manage own read receipts"
ON public.iboite_message_reads FOR ALL
USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES: iboite_external_correspondence
-- ============================================================

-- Users can view their own correspondence
CREATE POLICY "Users can view own correspondence"
ON public.iboite_external_correspondence FOR SELECT
USING (
    auth.uid() = sender_id OR
    is_super_admin(auth.uid()) OR
    organization_id IN (SELECT get_user_organizations(auth.uid()))
);

-- Municipal staff can send correspondence for their org
CREATE POLICY "Staff can send correspondence"
ON public.iboite_external_correspondence FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    organization_id IN (SELECT get_user_organizations(auth.uid()))
);

-- ============================================================
-- TRIGGERS: Auto-update timestamps
-- ============================================================

CREATE TRIGGER update_user_environments_timestamp
BEFORE UPDATE ON public.user_environments
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_iboite_contacts_timestamp
BEFORE UPDATE ON public.iboite_contacts
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_iboite_service_directory_timestamp
BEFORE UPDATE ON public.iboite_service_directory
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_iboite_conversations_timestamp
BEFORE UPDATE ON public.iboite_conversations
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER update_iboite_external_correspondence_timestamp
BEFORE UPDATE ON public.iboite_external_correspondence
FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- FUNCTION: Update conversation on new message
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Update conversation with last message info
    UPDATE public.iboite_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        last_message_sender_id = NEW.sender_id,
        updated_at = now()
    WHERE id = NEW.conversation_id;
    
    -- Increment unread count for other participants
    UPDATE public.iboite_conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
    AND user_id != NEW.sender_id
    AND is_active = true;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_iboite_message_insert
AFTER INSERT ON public.iboite_messages
FOR EACH ROW EXECUTE FUNCTION public.update_conversation_on_message();

-- ============================================================
-- FUNCTION: Search users for iBoîte (internal directory)
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_iboite_users(
    search_query TEXT,
    searcher_id UUID,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    role_label TEXT,
    organization_name TEXT,
    environment user_environment,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    searcher_env user_environment;
    searcher_org_id UUID;
BEGIN
    -- Get searcher's environment
    SELECT ue.environment, ue.organization_id INTO searcher_env, searcher_org_id
    FROM public.user_environments ue
    WHERE ue.user_id = searcher_id AND ue.is_active = true
    LIMIT 1;
    
    RETURN QUERY
    SELECT 
        p.user_id,
        COALESCE(p.first_name || ' ' || p.last_name, 'Utilisateur') AS display_name,
        CASE 
            WHEN ue.backoffice_role IS NOT NULL THEN ue.backoffice_role::TEXT
            WHEN ue.municipal_role IS NOT NULL THEN ue.municipal_role::TEXT
            WHEN ue.public_role IS NOT NULL THEN ue.public_role::TEXT
            ELSE 'USER'
        END AS role_label,
        o.name AS organization_name,
        ue.environment,
        p.avatar_url
    FROM public.profiles p
    JOIN public.user_environments ue ON p.user_id = ue.user_id
    LEFT JOIN public.organizations o ON ue.organization_id = o.id
    WHERE 
        ue.is_active = true
        AND (
            -- Super Admin sees everyone
            searcher_env = 'BACK_OFFICE' 
            OR
            -- Municipal staff sees their org + all public users
            (searcher_env = 'MUNICIPAL_STAFF' AND (
                ue.organization_id = searcher_org_id OR
                ue.environment = 'PUBLIC_USER'
            ))
            OR
            -- Public users see municipal staff of relevant orgs + other public users
            (searcher_env = 'PUBLIC_USER' AND (
                ue.environment IN ('MUNICIPAL_STAFF', 'PUBLIC_USER')
            ))
        )
        AND (p.first_name || ' ' || p.last_name) ILIKE '%' || search_query || '%'
        AND p.user_id != searcher_id
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- FUNCTION: Search services for iBoîte
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_iboite_services(
    search_query TEXT,
    organization_filter UUID DEFAULT NULL,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    service_id UUID,
    service_code TEXT,
    service_name TEXT,
    organization_id UUID,
    organization_name TEXT,
    responsible_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sd.id AS service_id,
        sd.service_code,
        sd.service_name,
        sd.organization_id,
        o.name AS organization_name,
        COALESCE(p.first_name || ' ' || p.last_name, 'Non assigné') AS responsible_name
    FROM public.iboite_service_directory sd
    JOIN public.organizations o ON sd.organization_id = o.id
    LEFT JOIN public.profiles p ON sd.responsible_user_id = p.user_id
    WHERE 
        sd.is_active = true
        AND (organization_filter IS NULL OR sd.organization_id = organization_filter)
        AND (
            sd.service_name ILIKE '%' || search_query || '%'
            OR sd.service_code ILIKE '%' || search_query || '%'
            OR sd.description ILIKE '%' || search_query || '%'
        )
    LIMIT limit_count;
END;
$$;

-- ============================================================
-- SEED: Default service directory entries
-- ============================================================

-- Insert will be done when organizations exist
-- This is a placeholder for the structure

COMMENT ON TABLE public.user_environments IS 'Maps users to their environment (Back Office, Municipal Staff, or Public User)';
COMMENT ON TABLE public.iboite_contacts IS 'User contact list for iBoîte messaging';
COMMENT ON TABLE public.iboite_service_directory IS 'Directory of municipal services for iBoîte';
COMMENT ON TABLE public.iboite_conversations IS 'iBoîte conversations (internal messaging)';
COMMENT ON TABLE public.iboite_conversation_participants IS 'Participants in iBoîte conversations';
COMMENT ON TABLE public.iboite_messages IS 'Messages in iBoîte conversations';
COMMENT ON TABLE public.iboite_external_correspondence IS 'External email correspondence (outside iBoîte)';
