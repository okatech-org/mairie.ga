-- Migration: Create icorrespondance-documents storage bucket
-- This bucket stores documents attached to iCorrespondance folders

-- Note: Storage buckets are created via Supabase Dashboard or API, not SQL directly.
-- This migration documents the required bucket configuration.

-- BUCKET NAME: icorrespondance-documents
-- CONFIGURATION:
--   - Public: false (files accessed via signed URLs)
--   - File size limit: 50MB
--   - Allowed MIME types: application/pdf, image/*, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- RLS Policies for the bucket:
-- 1. INSERT: Authenticated users can upload to their own folder paths
-- 2. SELECT: Authenticated users can read files from folders they have access to
-- 3. DELETE: Authenticated users can delete their own files

-- Since storage buckets cannot be created via SQL migrations in Supabase Edge,
-- this bucket must be created manually in the Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: icorrespondance-documents
-- 4. Public: OFF
-- 5. Add appropriate RLS policies

-- Alternatively, the bucket will be auto-created on first upload if using service role key
-- in an Edge Function. For client-side uploads, pre-create the bucket.

DO $$
BEGIN
    RAISE NOTICE 'Storage bucket "icorrespondance-documents" must be created in Supabase Dashboard.';
    RAISE NOTICE 'Go to Storage > New bucket > Name: icorrespondance-documents > Public: OFF';
END $$;
