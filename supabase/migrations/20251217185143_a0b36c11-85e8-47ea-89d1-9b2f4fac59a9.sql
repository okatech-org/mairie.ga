-- ============================================================
-- Tables iCorrespondance
-- ============================================================

-- Table des dossiers de correspondance
CREATE TABLE public.icorrespondance_folders (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    organization_id UUID REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    reference_number TEXT UNIQUE,
    recipient_name TEXT,
    recipient_organization TEXT,
    recipient_email TEXT,
    recipient_user_id UUID,
    comment TEXT,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'ARCHIVED')),
    is_urgent BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT true,
    is_internal BOOLEAN DEFAULT false,
    iboite_conversation_id UUID,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table des documents attachés
CREATE TABLE public.icorrespondance_documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID NOT NULL REFERENCES public.icorrespondance_folders(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT,
    file_type TEXT DEFAULT 'pdf',
    file_size TEXT,
    file_url TEXT,
    is_generated BOOLEAN DEFAULT false,
    generator_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.icorrespondance_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.icorrespondance_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for folders
CREATE POLICY "Users can view own folders"
ON public.icorrespondance_folders
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
ON public.icorrespondance_folders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.icorrespondance_folders
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.icorrespondance_folders
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all folders"
ON public.icorrespondance_folders
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- RLS Policies for documents
CREATE POLICY "Users can view documents in own folders"
ON public.icorrespondance_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND f.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert documents in own folders"
ON public.icorrespondance_documents
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND f.user_id = auth.uid()
    )
);

CREATE POLICY "Users can delete documents in own folders"
ON public.icorrespondance_documents
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND f.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all documents"
ON public.icorrespondance_documents
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.icorrespondance_folders f
        WHERE f.id = folder_id AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
    )
);

-- Function to generate reference number
CREATE OR REPLACE FUNCTION generate_icorr_reference()
RETURNS TRIGGER AS $$
BEGIN
    NEW.reference_number := 'CORR-' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD(CAST(FLOOR(RANDOM() * 100000) AS TEXT), 5, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-generating reference
CREATE TRIGGER set_icorr_reference
BEFORE INSERT ON public.icorrespondance_folders
FOR EACH ROW
WHEN (NEW.reference_number IS NULL)
EXECUTE FUNCTION generate_icorr_reference();

-- Indexes for performance
CREATE INDEX idx_icorr_folders_user ON public.icorrespondance_folders(user_id);
CREATE INDEX idx_icorr_folders_status ON public.icorrespondance_folders(status);
CREATE INDEX idx_icorr_folders_created ON public.icorrespondance_folders(created_at DESC);
CREATE INDEX idx_icorr_docs_folder ON public.icorrespondance_documents(folder_id);