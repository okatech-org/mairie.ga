-- Add missing column to login_attempts
ALTER TABLE public.login_attempts ADD COLUMN IF NOT EXISTS failure_reason TEXT;

-- Add missing indexes on active_sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_activity ON public.active_sessions(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_active_sessions_session_token ON public.active_sessions(session_token);

-- Add missing indexes on session_history
CREATE INDEX IF NOT EXISTS idx_session_history_user_id ON public.session_history(user_id);
CREATE INDEX IF NOT EXISTS idx_session_history_login_at ON public.session_history(login_at DESC);

-- Add missing indexes on login_attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON public.login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON public.login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON public.login_attempts(created_at DESC);