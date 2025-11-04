-- Create email_otps table for serverless OTP storage
CREATE TABLE IF NOT EXISTS email_otps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Index for fast lookups
    CONSTRAINT email_otps_email_key UNIQUE (email)
);

-- Index for email lookups
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- Index for expiration cleanup
CREATE INDEX IF NOT EXISTS idx_email_otps_expires_at ON email_otps(expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage OTPs (API routes use service role)
CREATE POLICY "Allow service role full access to email_otps"
    ON email_otps
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Optional: Cleanup function to delete expired OTPs (runs periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM email_otps
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Create a cron job to cleanup expired OTPs every 10 minutes
-- Note: This requires pg_cron extension to be enabled in Supabase
-- You can also run this manually or via a serverless function

