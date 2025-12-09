-- Create session_history table for tracking login history
CREATE TABLE public.session_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    session_token TEXT,
    login_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    logout_at TIMESTAMP WITH TIME ZONE,
    device_info TEXT,
    ip_address TEXT,
    location TEXT,
    browser TEXT,
    os TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.session_history ENABLE ROW LEVEL SECURITY;

-- Users can view their own session history
CREATE POLICY "Users can view their own session history"
ON public.session_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own session history
CREATE POLICY "Users can insert their own session history"
ON public.session_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own session history
CREATE POLICY "Users can update their own session history"
ON public.session_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Super admins can view all session history
CREATE POLICY "Super admins can view all session history"
ON public.session_history
FOR SELECT
USING (public.has_role(auth.uid(), 'super_admin'));

-- Create index for faster queries
CREATE INDEX idx_session_history_user_id ON public.session_history(user_id);
CREATE INDEX idx_session_history_login_at ON public.session_history(login_at DESC);