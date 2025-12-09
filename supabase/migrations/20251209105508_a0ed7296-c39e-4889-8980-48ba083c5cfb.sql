-- Create active_sessions table to track user sessions
CREATE TABLE public.active_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token TEXT NOT NULL,
    device_info TEXT,
    ip_address TEXT,
    browser TEXT,
    os TEXT,
    location TEXT,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    is_current BOOLEAN DEFAULT false,
    UNIQUE(session_token)
);

-- Create index for faster lookups
CREATE INDEX idx_active_sessions_user_id ON public.active_sessions(user_id);
CREATE INDEX idx_active_sessions_last_activity ON public.active_sessions(last_activity);

-- Enable RLS
ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.active_sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can delete (logout) their own sessions
CREATE POLICY "Users can delete own sessions"
ON public.active_sessions
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can view all sessions
CREATE POLICY "Super admins can view all sessions"
ON public.active_sessions
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admins can delete any session
CREATE POLICY "Super admins can delete any session"
ON public.active_sessions
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- System can insert sessions (no auth check for insert since it happens during login)
CREATE POLICY "System can insert sessions"
ON public.active_sessions
FOR INSERT
WITH CHECK (true);

-- System can update sessions for activity tracking
CREATE POLICY "Users can update own sessions"
ON public.active_sessions
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to clean up old inactive sessions (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.active_sessions 
  WHERE last_activity < NOW() - INTERVAL '24 hours';
END;
$$;