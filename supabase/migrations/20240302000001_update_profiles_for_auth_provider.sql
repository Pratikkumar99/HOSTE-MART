-- Add auth_provider column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS auth_provider TEXT CHECK (auth_provider IN ('email', 'google')) DEFAULT 'email';

-- Add email_verified column to track email verification status
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;

-- Update existing profiles to have email provider and verified status
UPDATE profiles SET 
    auth_provider = 'email',
    email_verified = true 
WHERE auth_provider IS NULL;

-- Create index for auth provider
CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_email_verified ON profiles(email_verified);
