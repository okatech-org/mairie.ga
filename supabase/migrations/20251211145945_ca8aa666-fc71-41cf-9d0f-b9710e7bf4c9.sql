-- ============================================================
-- TABLES iBoîte - Messagerie Interne
-- ============================================================

-- Table des contacts personnels
CREATE TABLE IF NOT EXISTS public.iboite_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    display_role TEXT,
    display_organization TEXT,
    avatar_url TEXT,
    category TEXT DEFAULT 'GENERAL',
    is_favorite BOOLEAN DEFAULT false,
    notes TEXT,
    last_contact_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT iboite_contacts_has_target CHECK (contact_user_id IS NOT NULL OR contact_service_id IS NOT NULL)
);

-- Table des conversations
CREATE TABLE IF NOT EXISTS public.iboite_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_type TEXT NOT NULL DEFAULT 'PRIVATE' CHECK (conversation_type IN ('PRIVATE', 'GROUP', 'SERVICE', 'OFFICIAL', 'BROADCAST')),
    subject TEXT,
    service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    is_external BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    last_message_at TIMESTAMPTZ,
    last_message_preview TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des participants aux conversations
CREATE TABLE IF NOT EXISTS public.iboite_conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.iboite_conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_role TEXT DEFAULT 'MEMBER' CHECK (participant_role IN ('OWNER', 'ADMIN', 'MEMBER', 'READONLY')),
    is_active BOOLEAN DEFAULT true,
    is_muted BOOLEAN DEFAULT false,
    last_read_at TIMESTAMPTZ,
    unread_count INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    UNIQUE(conversation_id, user_id)
);

-- Table des messages
CREATE TABLE IF NOT EXISTS public.iboite_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.iboite_conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    content_type TEXT DEFAULT 'TEXT' CHECK (content_type IN ('TEXT', 'HTML', 'MARKDOWN')),
    attachments JSONB DEFAULT '[]'::jsonb,
    reply_to_id UUID REFERENCES public.iboite_messages(id) ON DELETE SET NULL,
    mentions UUID[] DEFAULT '{}',
    is_official BOOLEAN DEFAULT false,
    official_reference TEXT,
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table des correspondances externes (avec email)
CREATE TABLE IF NOT EXISTS public.iboite_external_correspondence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    direction TEXT NOT NULL DEFAULT 'OUTBOUND' CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    external_email TEXT NOT NULL,
    external_name TEXT,
    external_organization TEXT,
    subject TEXT NOT NULL,
    content TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'BOUNCED')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEX pour performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_iboite_contacts_owner ON public.iboite_contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_iboite_contacts_user ON public.iboite_contacts(contact_user_id);
CREATE INDEX IF NOT EXISTS idx_iboite_conversations_updated ON public.iboite_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_iboite_participants_user ON public.iboite_conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_iboite_participants_conv ON public.iboite_conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_iboite_messages_conv ON public.iboite_messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_iboite_messages_sender ON public.iboite_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_iboite_external_sender ON public.iboite_external_correspondence(sender_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.iboite_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.iboite_external_correspondence ENABLE ROW LEVEL SECURITY;

-- Policies pour iboite_contacts (propriétaire seulement)
CREATE POLICY "Users can view their own contacts"
    ON public.iboite_contacts FOR SELECT
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Users can create their own contacts"
    ON public.iboite_contacts FOR INSERT
    TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own contacts"
    ON public.iboite_contacts FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own contacts"
    ON public.iboite_contacts FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid());

-- Policies pour iboite_conversations (participants seulement)
CREATE POLICY "Participants can view conversations"
    ON public.iboite_conversations FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants
            WHERE conversation_id = id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Authenticated users can create conversations"
    ON public.iboite_conversations FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Owners can update conversations"
    ON public.iboite_conversations FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants
            WHERE conversation_id = id AND user_id = auth.uid() AND participant_role IN ('OWNER', 'ADMIN')
        )
    );

CREATE POLICY "Owners can delete conversations"
    ON public.iboite_conversations FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants
            WHERE conversation_id = id AND user_id = auth.uid() AND participant_role = 'OWNER'
        )
    );

-- Policies pour iboite_conversation_participants
CREATE POLICY "Users can view participants in their conversations"
    ON public.iboite_conversation_participants FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants p2
            WHERE p2.conversation_id = conversation_id AND p2.user_id = auth.uid() AND p2.is_active = true
        )
    );

CREATE POLICY "Authenticated users can add participants"
    ON public.iboite_conversation_participants FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Users can update their own participation"
    ON public.iboite_conversation_participants FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Policies pour iboite_messages
CREATE POLICY "Participants can view messages"
    ON public.iboite_messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants
            WHERE conversation_id = iboite_messages.conversation_id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Participants can send messages"
    ON public.iboite_messages FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM public.iboite_conversation_participants
            WHERE conversation_id = iboite_messages.conversation_id AND user_id = auth.uid() AND is_active = true
        )
    );

CREATE POLICY "Senders can update their messages"
    ON public.iboite_messages FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid());

-- Policies pour iboite_external_correspondence
CREATE POLICY "Users can view their external correspondence"
    ON public.iboite_external_correspondence FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid());

CREATE POLICY "Users can create external correspondence"
    ON public.iboite_external_correspondence FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update their external correspondence"
    ON public.iboite_external_correspondence FOR UPDATE
    TO authenticated
    USING (sender_id = auth.uid());

CREATE POLICY "Users can delete their external correspondence"
    ON public.iboite_external_correspondence FOR DELETE
    TO authenticated
    USING (sender_id = auth.uid());

-- ============================================================
-- FONCTIONS RPC pour recherche
-- ============================================================

-- Fonction de recherche d'utilisateurs pour iBoîte
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
    environment TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.user_id,
        (p.first_name || ' ' || p.last_name) AS display_name,
        COALESCE(ur.role::TEXT, 'citizen') AS role_label,
        COALESCE(o.name, '') AS organization_name,
        'MUNICIPAL'::TEXT AS environment,
        ''::TEXT AS avatar_url
    FROM public.profiles p
    LEFT JOIN public.user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN public.organizations o ON o.id::TEXT = (p.address->>'organization_id')
    WHERE 
        p.user_id != searcher_id
        AND (
            p.first_name ILIKE '%' || search_query || '%'
            OR p.last_name ILIKE '%' || search_query || '%'
            OR (p.first_name || ' ' || p.last_name) ILIKE '%' || search_query || '%'
        )
    LIMIT limit_count;
END;
$$;

-- Fonction de recherche de services pour iBoîte
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
        s.id AS service_id,
        COALESCE(s.category, 'GEN') AS service_code,
        s.name AS service_name,
        s.organization_id,
        COALESCE(o.name, '') AS organization_name,
        ''::TEXT AS responsible_name
    FROM public.services s
    LEFT JOIN public.organizations o ON o.id = s.organization_id
    WHERE 
        s.is_active = true
        AND (
            s.name ILIKE '%' || search_query || '%'
            OR s.description ILIKE '%' || search_query || '%'
            OR s.category ILIKE '%' || search_query || '%'
        )
        AND (organization_filter IS NULL OR s.organization_id = organization_filter)
    LIMIT limit_count;
END;
$$;

-- Trigger pour mettre à jour last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.iboite_conversations
    SET 
        last_message_at = NEW.created_at,
        last_message_preview = LEFT(NEW.content, 100),
        updated_at = NOW()
    WHERE id = NEW.conversation_id;
    
    -- Incrémenter unread_count pour les autres participants
    UPDATE public.iboite_conversation_participants
    SET unread_count = unread_count + 1
    WHERE conversation_id = NEW.conversation_id
      AND user_id != NEW.sender_id
      AND is_active = true;
    
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_conversation_on_message
    AFTER INSERT ON public.iboite_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- Activer realtime pour les tables de messagerie
ALTER PUBLICATION supabase_realtime ADD TABLE public.iboite_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.iboite_conversations;