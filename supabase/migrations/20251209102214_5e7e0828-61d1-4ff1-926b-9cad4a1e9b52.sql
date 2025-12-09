-- Enable RLS on login_attempts (should already be enabled, but ensure it is)
ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert login attempts (needed for tracking failed/successful logins)
CREATE POLICY "Anyone can insert login attempts"
ON public.login_attempts
FOR INSERT
WITH CHECK (true);

-- Only super_admin and admin can view login attempts (security monitoring)
CREATE POLICY "Admins can view login attempts"
ON public.login_attempts
FOR SELECT
USING (
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Only super_admin can delete login attempts (cleanup)
CREATE POLICY "Super admins can delete login attempts"
ON public.login_attempts
FOR DELETE
USING (has_role(auth.uid(), 'super_admin'::app_role));