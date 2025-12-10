-- Add missing columns to correspondence_logs table
ALTER TABLE public.correspondence_logs 
ADD COLUMN IF NOT EXISTS folder_id UUID,
ADD COLUMN IF NOT EXISTS recipient_org TEXT,
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS document_ids UUID[] DEFAULT '{}';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_correspondence_logs_folder ON public.correspondence_logs(folder_id);
CREATE INDEX IF NOT EXISTS idx_correspondence_logs_urgent ON public.correspondence_logs(is_urgent) WHERE is_urgent = true;
CREATE INDEX IF NOT EXISTS idx_correspondence_logs_created ON public.correspondence_logs(created_at DESC);