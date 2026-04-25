-- Add versioning columns to system_settings table
ALTER TABLE system_settings 
ADD COLUMN IF NOT EXISTS min_version TEXT DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS download_url TEXT DEFAULT 'https://mdoc-hrms-privacy.netlify.app/';

-- Update existing record to have defaults if it exists
UPDATE system_settings 
SET 
  min_version = COALLESCE(min_version, '1.0'),
  download_url = COALLESCE(download_url, 'https://mdoc-hrms-privacy.netlify.app/')
WHERE id = 1;
