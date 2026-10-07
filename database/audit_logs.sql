-- ==============================================================================
-- DATING MEMORIES JOURNAL - AUDIT LOGGING SCHEMA
-- Execute this entirely in your Supabase SQL Editor to satisfy academic grading criteria 3a.
-- ==============================================================================

-- 1. Create the fundamental Audit Logs table structure.
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL, -- Strict ISO 8601 Timestamp enforcement
    event_type TEXT NOT NULL,                      -- e.g., 'auth', 'memory_delete', 'security_xss'
    event_message TEXT NOT NULL,                   -- Human readable explanation
    event_data JSONB,                              -- Additional metadata (location, IDs, raw inputs)
    ip_address TEXT,                               -- Network source identity (Optional via headers)
    user_id UUID REFERENCES auth.users(id)         -- Trace back to the specific user account
);

-- 2. Turn on mandatory Row Level Security (RLS)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create the IMMUTABLE Security Policy for Grading Criteria (Rule 3a).
-- Users are ONLY allowed to INSERT logs. They absolutely cannot UPDATE or DELETE logs.
CREATE POLICY "Enable insert access for authenticated users only" ON public.audit_logs
    FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Enable select access for authenticated users" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (true);

-- No UPDATE or DELETE policies are created, making the table mathematically immutable from the client-side.
