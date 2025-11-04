-- Quick setup for email_otps table
-- Copy and paste this into Supabase SQL Editor and click Run

CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    otp VARCHAR(6) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- Enable Row Level Security (required by Supabase)
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Allow API to manage OTPs
CREATE POLICY "Allow service role full access"
    ON email_otps
    FOR ALL
    USING (true)
    WITH CHECK (true);

