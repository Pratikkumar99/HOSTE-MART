-- Create businesses table
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT NOT NULL,
    logo_url TEXT,
    location TEXT NOT NULL,
    hostel_type TEXT CHECK (hostel_type IN ('boys', 'girls', 'both')) DEFAULT 'both',
    is_verified BOOLEAN DEFAULT false,
    status TEXT CHECK (status IN ('active', 'inactive', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add business_id to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

-- Add business_id to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES businesses(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);
CREATE INDEX IF NOT EXISTS idx_items_business_id ON items(business_id);
CREATE INDEX IF NOT EXISTS idx_profiles_business_id ON profiles(business_id);

-- Storage bucket for business logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-logos', 'business-logos', true)
ON CONFLICT DO NOTHING;

-- Storage policies for business logos
CREATE POLICY "Users can upload own business logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Business logos are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'business-logos');

-- Enable RLS
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Businesses are viewable by everyone" 
    ON businesses FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own business" 
    ON businesses FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update their business" 
    ON businesses FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can delete their business" 
    ON businesses FOR DELETE USING (auth.uid() = owner_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION update_businesses_updated_at();
