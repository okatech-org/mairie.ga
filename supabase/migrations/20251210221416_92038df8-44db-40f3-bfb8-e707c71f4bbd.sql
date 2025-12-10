-- Add GPS coordinates columns to organizations table
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries
CREATE INDEX IF NOT EXISTS idx_organizations_coordinates 
ON public.organizations (latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

COMMENT ON COLUMN public.organizations.latitude IS 'GPS latitude coordinate';
COMMENT ON COLUMN public.organizations.longitude IS 'GPS longitude coordinate';