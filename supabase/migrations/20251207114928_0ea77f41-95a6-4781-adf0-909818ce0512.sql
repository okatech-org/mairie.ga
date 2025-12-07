-- Add explicit anonymous-blocking policies for defense in depth

-- Block anonymous access to profiles table
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Block anonymous access to requests table  
CREATE POLICY "Block anonymous access to requests"
ON public.requests
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create login_attempts table for rate limiting
CREATE TABLE public.login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  ip_address text,
  success boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on login_attempts
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Only allow edge functions (service role) to manage login attempts
-- No direct user access needed

-- Create index for efficient querying
CREATE INDEX idx_login_attempts_email_created ON public.login_attempts(email, created_at DESC);

-- Auto-cleanup old login attempts (older than 1 hour)
CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.login_attempts 
  WHERE created_at < NOW() - INTERVAL '1 hour';
  RETURN NEW;
END;
$$;

CREATE TRIGGER cleanup_login_attempts_trigger
AFTER INSERT ON public.login_attempts
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_login_attempts();