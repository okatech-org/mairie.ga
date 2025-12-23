-- ============================================================
-- FIX: iboite_conversation_participants RLS Policy
-- ============================================================
-- La policy précédente causait une récursivité infinie (erreur 500)

-- Supprimer l'ancienne policy récursive
DROP POLICY IF EXISTS "Users can view participants in their conversations" 
ON public.iboite_conversation_participants;

-- Nouvelle policy non-récursive: L'utilisateur peut voir ses propres participations
CREATE POLICY "Users can view own participation"
ON public.iboite_conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy pour voir les autres participants via conversation_id
-- Utilise une fonction security definer pour éviter la récursivité
CREATE OR REPLACE FUNCTION public.get_user_conversation_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
    SELECT conversation_id 
    FROM public.iboite_conversation_participants
    WHERE user_id = _user_id AND is_active = true
$$;

-- Policy pour voir les co-participants via la fonction security definer
CREATE POLICY "Users can view co-participants"
ON public.iboite_conversation_participants FOR SELECT
TO authenticated
USING (
    conversation_id IN (SELECT public.get_user_conversation_ids(auth.uid()))
);