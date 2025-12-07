-- Migration: Document Vault Infrastructure
-- Description: Creates tables for user document storage and cloud connections

-- ============================================
-- 1. DOCUMENT VAULT TABLE
-- Secure storage for user's personal documents
-- ============================================

CREATE TABLE IF NOT EXISTS public.document_vault (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT, -- Original filename before processing
    category TEXT NOT NULL CHECK (category IN (
        'photo_identity',      -- Photo d'identité
        'passport',            -- Passeport
        'birth_certificate',   -- Acte de naissance
        'residence_proof',     -- Justificatif de domicile
        'marriage_certificate',-- Acte de mariage
        'family_record',       -- Livret de famille
        'diploma',             -- Diplôme
        'cv',                  -- CV
        'other'                -- Autre
    )),
    file_path TEXT NOT NULL,   -- Path in Supabase Storage
    file_type TEXT,            -- MIME type
    file_size INTEGER,         -- Size in bytes
    thumbnail_path TEXT,       -- Thumbnail for images
    metadata JSONB DEFAULT '{}', -- Additional metadata (dimensions, pages, etc.)
    is_verified BOOLEAN DEFAULT false,
    verification_date TIMESTAMPTZ,
    source TEXT DEFAULT 'upload' CHECK (source IN (
        'upload',       -- Direct upload
        'camera',       -- Camera scan
        'google_drive', -- Google Drive
        'onedrive',     -- Microsoft OneDrive
        'dropbox',      -- Dropbox
        'icloud'        -- iCloud (via file picker)
    )),
    last_used_at TIMESTAMPTZ,  -- Track recently used
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX IF NOT EXISTS idx_document_vault_user_id ON public.document_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_document_vault_category ON public.document_vault(category);
CREATE INDEX IF NOT EXISTS idx_document_vault_last_used ON public.document_vault(last_used_at DESC);

-- ============================================
-- 2. CLOUD CONNECTIONS TABLE
-- OAuth tokens for cloud storage providers
-- ============================================

CREATE TABLE IF NOT EXISTS public.cloud_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN (
        'google_drive',
        'onedrive',
        'dropbox'
    )),
    account_email TEXT,         -- Email of connected account
    account_name TEXT,          -- Display name
    access_token TEXT,          -- Encrypted access token
    refresh_token TEXT,         -- Encrypted refresh token
    token_expires_at TIMESTAMPTZ,
    scopes TEXT[],              -- Granted permission scopes
    metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- One connection per provider per user
    UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_cloud_connections_user ON public.cloud_connections(user_id);

-- ============================================
-- 3. DEVICE REGISTRY TABLE
-- Track user devices for cross-device sync
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    device_id TEXT NOT NULL,         -- Unique device identifier
    device_name TEXT,                -- User-friendly name (e.g., "iPhone de Jean")
    device_type TEXT CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    browser TEXT,                    -- Browser info
    os TEXT,                         -- Operating system
    push_token TEXT,                 -- For push notifications
    last_active_at TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON public.user_devices(user_id);

-- ============================================
-- 4. ROW LEVEL SECURITY POLICIES
-- ============================================

-- Document Vault RLS
ALTER TABLE public.document_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vault documents"
    ON public.document_vault FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vault documents"
    ON public.document_vault FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vault documents"
    ON public.document_vault FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vault documents"
    ON public.document_vault FOR DELETE
    USING (auth.uid() = user_id);

-- Cloud Connections RLS
ALTER TABLE public.cloud_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cloud connections"
    ON public.cloud_connections FOR ALL
    USING (auth.uid() = user_id);

-- User Devices RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
    ON public.user_devices FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- 5. TRIGGERS FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_document_vault_updated_at
    BEFORE UPDATE ON public.document_vault
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cloud_connections_updated_at
    BEFORE UPDATE ON public.cloud_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. STORAGE BUCKET (Run in Supabase Dashboard)
-- ============================================
-- Note: Create a storage bucket named 'document-vault' in Supabase Dashboard
-- with the following policies:
-- - Allow authenticated users to upload to their own folder (user_id/*)
-- - Allow authenticated users to read their own files
-- - Set max file size to 10MB
