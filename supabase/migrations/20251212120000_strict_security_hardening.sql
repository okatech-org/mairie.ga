-- Mode strict: durcissement RLS et fermeture des policies permissives

-- ============================================================
-- login_attempts: interdire les inserts côté client
-- (les Edge Functions avec service role peuvent toujours écrire)
-- ============================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.login_attempts;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

-- ============================================================
-- active_sessions: retirer l'insert ouvert et exiger cohérence auth.uid()
-- ============================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "System can insert sessions" ON public.active_sessions;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can insert own sessions" ON public.active_sessions;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "Users can insert own sessions"
  ON public.active_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN
    NULL;
  WHEN undefined_table THEN
    NULL;
END $$;

-- ============================================================
-- user_environments: retirer l'insert ouvert
-- ============================================================
DO $$
BEGIN
  DROP POLICY IF EXISTS "System can insert environments" ON public.user_environments;
EXCEPTION
  WHEN undefined_table THEN
    NULL;
END $$;


