-- Drop the public read policy
DROP POLICY IF EXISTS "Public can read attachments" ON storage.objects;

-- Create a restricted policy that only allows authorized users to read attachments
CREATE POLICY "Only authorized users can read attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'email-attachments' AND
  auth.uid() IS NOT NULL AND (
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    has_role(auth.uid(), 'agent'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  )
);