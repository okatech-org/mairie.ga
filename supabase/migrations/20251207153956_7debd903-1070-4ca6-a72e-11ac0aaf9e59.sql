-- Add missing columns to profiles table for extended registration data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS father_name TEXT,
ADD COLUMN IF NOT EXISTS mother_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_first_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_last_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS employer TEXT;