-- Create storage bucket for iCorrespondance documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('icorrespondance-documents', 'icorrespondance-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload files to their own folder
CREATE POLICY "Users can upload icorrespondance documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'icorrespondance-documents' 
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can view their own uploaded files
CREATE POLICY "Users can view icorrespondance documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'icorrespondance-documents'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete icorrespondance documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'icorrespondance-documents'
  AND auth.uid() IS NOT NULL
);

-- Policy: Users can update their own files
CREATE POLICY "Users can update icorrespondance documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'icorrespondance-documents'
  AND auth.uid() IS NOT NULL
);