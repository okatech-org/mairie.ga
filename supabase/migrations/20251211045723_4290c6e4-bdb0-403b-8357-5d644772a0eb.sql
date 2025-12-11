-- RLS policies for 'document-vault' bucket (owner only access)
-- Using unique names to avoid conflicts
CREATE POLICY "Vault owner read access"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vault owner upload access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vault owner update access"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Vault owner delete access"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'document-vault' AND auth.uid()::text = (storage.foldername(name))[1]);