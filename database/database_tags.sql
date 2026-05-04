-- ==========================================
-- STEP 10: ORGANIZER & TAGGING SUPPORT
-- ==========================================

-- 1. Add 'tags' column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- 2. Add 'tags' column to clients table
ALTER TABLE public.clients 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];
