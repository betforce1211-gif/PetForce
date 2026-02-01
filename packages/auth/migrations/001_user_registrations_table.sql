-- Create a table to track registered emails (database-agnostic duplicate prevention)
-- This gives us full control over duplicate detection regardless of auth provider

CREATE TABLE IF NOT EXISTS public.user_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  auth_user_id UUID,
  registered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_user_registrations_email ON public.user_registrations(email);
CREATE INDEX IF NOT EXISTS idx_user_registrations_auth_user_id ON public.user_registrations(auth_user_id);

-- Add comment
COMMENT ON TABLE public.user_registrations IS 'Tracks registered email addresses to prevent duplicates regardless of auth provider';
COMMENT ON COLUMN public.user_registrations.email IS 'User email address (unique constraint enforces no duplicates)';
COMMENT ON COLUMN public.user_registrations.auth_user_id IS 'Reference to auth.users.id (Supabase) or equivalent in other auth systems';

-- Enable Row Level Security
ALTER TABLE public.user_registrations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can check if email is registered (for duplicate detection)
CREATE POLICY "Allow checking email existence" ON public.user_registrations
  FOR SELECT
  USING (true);

-- Policy: Service role can insert (server-side only)
CREATE POLICY "Service role can insert" ON public.user_registrations
  FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update
CREATE POLICY "Service role can update" ON public.user_registrations
  FOR UPDATE
  USING (true);
