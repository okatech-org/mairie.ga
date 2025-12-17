-- ============================================================
-- MIGRATION: Fix iBoîte Foreign Key Relationships
-- ============================================================
-- Ajoute les clés étrangères manquantes pour permettre les jointures
-- PostgREST entre iboite_conversation_participants et profiles
-- ============================================================

-- La table profiles a user_id comme clé primaire ou unique
-- Nous devons ajouter une FK explicite pour que PostgREST puisse faire la jointure

-- D'abord, vérifier si la contrainte existe déjà
DO $$ 
BEGIN
    -- Ajouter une contrainte FK vers profiles si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'iboite_conversation_participants_user_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.iboite_conversation_participants
        ADD CONSTRAINT iboite_conversation_participants_user_id_profiles_fkey
        FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Faire de même pour iboite_messages.sender_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'iboite_messages_sender_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.iboite_messages
        ADD CONSTRAINT iboite_messages_sender_id_profiles_fkey
        FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ajouter une FK pour iboite_external_correspondence.sender_id aussi
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'iboite_external_correspondence_sender_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.iboite_external_correspondence
        ADD CONSTRAINT iboite_external_correspondence_sender_id_profiles_fkey
        FOREIGN KEY (sender_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================
-- COMMENT
-- ============================================================
COMMENT ON CONSTRAINT iboite_conversation_participants_user_id_profiles_fkey 
ON public.iboite_conversation_participants 
IS 'FK vers profiles pour permettre les jointures PostgREST';
