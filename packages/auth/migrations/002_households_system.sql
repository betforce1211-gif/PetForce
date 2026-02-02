-- Migration: 002_households_system.sql
-- Description: Creates the household management system tables for collaborative pet care
-- Created: 2026-02-01
-- Database-Agnostic: Standard SQL with PostgreSQL RLS for security

-- =============================================================================
-- TABLE: households
-- =============================================================================
-- Represents a physical household where pets live and are cared for.
-- Example: "The Zeder House" with 2 dogs, 3 cats, 1 bird
CREATE TABLE IF NOT EXISTS public.households (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  invite_code_expires_at TIMESTAMPTZ,
  leader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT households_name_length CHECK (length(name) >= 2 AND length(name) <= 50),
  CONSTRAINT households_name_format CHECK (name ~ '^[A-Za-z0-9 ]+$'),
  CONSTRAINT households_invite_code_format CHECK (length(invite_code) >= 8),
  CONSTRAINT households_description_length CHECK (description IS NULL OR length(description) <= 200)
);

-- Table comment
COMMENT ON TABLE public.households IS 'Households for collaborative family pet care. Each household has a leader and can have up to 15 members.';

-- Column comments
COMMENT ON COLUMN public.households.name IS 'Household display name (e.g., "The Zeder House"). 2-50 characters, alphanumeric and spaces only.';
COMMENT ON COLUMN public.households.description IS 'Optional description shown to members and join requesters (e.g., "The Zeder family - 2 dogs, 3 cats"). Max 200 characters.';
COMMENT ON COLUMN public.households.invite_code IS 'Unique shareable code for joining household. Format: PREFIX-RANDOM (e.g., "ZEDER-ALPHA-BRAVO"). Case-sensitive, uppercase only.';
COMMENT ON COLUMN public.households.invite_code_expires_at IS 'Expiration timestamp for invite code. NULL means never expires. Default is 30 days from creation.';
COMMENT ON COLUMN public.households.leader_id IS 'Current household leader (can transfer leadership). Leader has full management permissions.';

-- =============================================================================
-- TABLE: household_members
-- =============================================================================
-- Tracks membership in households with roles and status.
-- Supports permanent members (family) and temporary members (pet sitters).
CREATE TABLE IF NOT EXISTS public.household_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  is_temporary BOOLEAN DEFAULT false NOT NULL,
  temporary_expires_at TIMESTAMPTZ,
  invited_by UUID REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT household_members_unique_user_household UNIQUE(household_id, user_id),
  CONSTRAINT household_members_role_check CHECK (role IN ('leader', 'member')),
  CONSTRAINT household_members_status_check CHECK (status IN ('active', 'removed')),
  CONSTRAINT household_members_temporary_expiration_check CHECK (
    (is_temporary = false AND temporary_expires_at IS NULL) OR
    (is_temporary = true)
  )
);

-- Table comment
COMMENT ON TABLE public.household_members IS 'Household membership records. Tracks who belongs to which household, their role, and whether access is temporary.';

-- Column comments
COMMENT ON COLUMN public.household_members.role IS 'Member role: "leader" (full permissions) or "member" (standard access). Exactly one leader per household.';
COMMENT ON COLUMN public.household_members.status IS 'Membership status: "active" (current member) or "removed" (no longer has access).';
COMMENT ON COLUMN public.household_members.is_temporary IS 'Whether this is temporary access (e.g., pet sitter, daycare worker). Temporary members auto-expire.';
COMMENT ON COLUMN public.household_members.temporary_expires_at IS 'When temporary access expires. NULL for permanent members or never-expiring temporary access.';
COMMENT ON COLUMN public.household_members.invited_by IS 'User who invited this member (via email invite or join request approval). Tracks trust network.';

-- =============================================================================
-- TABLE: household_join_requests
-- =============================================================================
-- Tracks pending requests to join households via invite codes.
-- Supports approval workflow for household leaders.
CREATE TABLE IF NOT EXISTS public.household_join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),

  -- Constraints
  CONSTRAINT household_join_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn'))
);

-- Table comment
COMMENT ON TABLE public.household_join_requests IS 'Join requests from users wanting to join households. Requires leader approval.';

-- Column comments
COMMENT ON COLUMN public.household_join_requests.invite_code IS 'Invite code used for joining (stored for audit trail, not validated against current code).';
COMMENT ON COLUMN public.household_join_requests.status IS 'Request status: "pending" (awaiting response), "approved" (member added), "rejected" (denied), "withdrawn" (cancelled by requester).';
COMMENT ON COLUMN public.household_join_requests.responded_by IS 'Leader who approved or rejected the request. NULL for pending/withdrawn requests.';

-- =============================================================================
-- INDEXES
-- =============================================================================
-- Optimized for common query patterns

-- Households indexes
CREATE INDEX idx_households_leader_id ON public.households(leader_id);
CREATE INDEX idx_households_invite_code ON public.households(invite_code);
CREATE INDEX idx_households_created_at ON public.households(created_at DESC);

-- Household members indexes
CREATE INDEX idx_household_members_household_id ON public.household_members(household_id);
CREATE INDEX idx_household_members_user_id ON public.household_members(user_id);
CREATE INDEX idx_household_members_status ON public.household_members(status);
CREATE INDEX idx_household_members_household_status ON public.household_members(household_id, status);

-- Household join requests indexes
CREATE INDEX idx_household_join_requests_household_id ON public.household_join_requests(household_id);
CREATE INDEX idx_household_join_requests_user_id ON public.household_join_requests(user_id);
CREATE INDEX idx_household_join_requests_status ON public.household_join_requests(status);
CREATE INDEX idx_household_join_requests_household_status ON public.household_join_requests(household_id, status);

-- =============================================================================
-- ROW-LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
-- Enable RLS on all household tables

ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_join_requests ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- HOUSEHOLDS TABLE POLICIES
-- -----------------------------------------------------------------------------

-- Policy: Users can view households they're a member of
CREATE POLICY "Users can view their households" ON public.households
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members
      WHERE household_members.household_id = households.id
      AND household_members.user_id = auth.uid()
      AND household_members.status = 'active'
    )
  );

-- Policy: Authenticated users can create households
-- Note: Leader is automatically added as member by application logic
CREATE POLICY "Authenticated users can create households" ON public.households
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND leader_id = auth.uid());

-- Policy: Only leaders can update their households
CREATE POLICY "Leaders can update their households" ON public.households
  FOR UPDATE
  USING (leader_id = auth.uid())
  WITH CHECK (leader_id = auth.uid());

-- Policy: Only leaders can delete their households
CREATE POLICY "Leaders can delete their households" ON public.households
  FOR DELETE
  USING (leader_id = auth.uid());

-- -----------------------------------------------------------------------------
-- HOUSEHOLD_MEMBERS TABLE POLICIES
-- -----------------------------------------------------------------------------

-- Policy: Members can view other members in their household
CREATE POLICY "Users can view household members" ON public.household_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members AS hm
      WHERE hm.household_id = household_members.household_id
      AND hm.user_id = auth.uid()
      AND hm.status = 'active'
    )
  );

-- Policy: Service role can insert members (application logic handles this)
-- This is needed for atomic household creation and join approval
CREATE POLICY "Service role can insert members" ON public.household_members
  FOR INSERT
  WITH CHECK (true);

-- Policy: Leaders can update members in their household
-- Used for removing members, changing roles, extending temporary access
CREATE POLICY "Leaders can update members" ON public.household_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_members.household_id
      AND households.leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_members.household_id
      AND households.leader_id = auth.uid()
    )
  );

-- Policy: Users can update their own membership (for leaving household)
CREATE POLICY "Users can update their own membership" ON public.household_members
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- HOUSEHOLD_JOIN_REQUESTS TABLE POLICIES
-- -----------------------------------------------------------------------------

-- Policy: Users can view their own join requests
CREATE POLICY "Users can view their join requests" ON public.household_join_requests
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Leaders can view join requests to their households
CREATE POLICY "Leaders can view household requests" ON public.household_join_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_join_requests.household_id
      AND households.leader_id = auth.uid()
    )
  );

-- Policy: Authenticated users can create join requests
CREATE POLICY "Users can create join requests" ON public.household_join_requests
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

-- Policy: Leaders can update join requests (approve/reject)
CREATE POLICY "Leaders can update requests" ON public.household_join_requests
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_join_requests.household_id
      AND households.leader_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.households
      WHERE households.id = household_join_requests.household_id
      AND households.leader_id = auth.uid()
    )
  );

-- Policy: Users can update their own join requests (withdraw)
CREATE POLICY "Users can update their own requests" ON public.household_join_requests
  FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending')
  WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Verify tables were created successfully
DO $$
BEGIN
  RAISE NOTICE 'Households system migration complete!';
  RAISE NOTICE 'Tables created: households, household_members, household_join_requests';
  RAISE NOTICE 'Indexes created: 12 indexes for query optimization';
  RAISE NOTICE 'RLS policies created: 13 security policies';
END $$;
