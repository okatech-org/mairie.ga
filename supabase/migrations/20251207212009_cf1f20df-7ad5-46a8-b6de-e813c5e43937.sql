-- Add expiration_date column to documents table
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS expiration_date date;