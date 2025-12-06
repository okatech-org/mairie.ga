-- Add PIN code column to profiles table for simplified login
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_code TEXT;

-- Add a column to track if PIN is enabled
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pin_enabled BOOLEAN DEFAULT false;

-- Create index for PIN lookup
CREATE INDEX IF NOT EXISTS idx_profiles_pin_code ON public.profiles(pin_code) WHERE pin_enabled = true;