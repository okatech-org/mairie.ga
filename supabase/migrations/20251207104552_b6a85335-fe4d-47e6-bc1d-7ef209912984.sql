-- Create storage bucket for email attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'email-attachments');

-- Allow public read access for email attachments
CREATE POLICY "Public can read attachments"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'email-attachments');

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete own attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'email-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);