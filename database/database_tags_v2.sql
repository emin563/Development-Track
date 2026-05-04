-- ==========================================
-- STEP 11: CENTRALIZED TAG SYSTEM
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- 1. Remove old freeform text array columns (if they exist)
ALTER TABLE public.projects DROP COLUMN IF EXISTS tags;
ALTER TABLE public.clients DROP COLUMN IF EXISTS tags;

-- 2. Create centralized tags registry
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366f1',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create join table: projects ↔ tags
CREATE TABLE IF NOT EXISTS public.project_tags (
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    tag_id     UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (project_id, tag_id)
);

-- 4. Create join table: clients ↔ tags
CREATE TABLE IF NOT EXISTS public.client_tags (
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    tag_id    UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, tag_id)
);

-- 5. Enable RLS (open read, auth-required write)
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

-- Tags: anyone can read, only authenticated users can modify
CREATE POLICY "tags_select" ON public.tags FOR SELECT USING (true);
CREATE POLICY "tags_insert" ON public.tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "tags_update" ON public.tags FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "tags_delete" ON public.tags FOR DELETE USING (auth.role() = 'authenticated');

-- project_tags: open read, auth write
CREATE POLICY "project_tags_select" ON public.project_tags FOR SELECT USING (true);
CREATE POLICY "project_tags_insert" ON public.project_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "project_tags_delete" ON public.project_tags FOR DELETE USING (auth.role() = 'authenticated');

-- client_tags: open read, auth write
CREATE POLICY "client_tags_select" ON public.client_tags FOR SELECT USING (true);
CREATE POLICY "client_tags_insert" ON public.client_tags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "client_tags_delete" ON public.client_tags FOR DELETE USING (auth.role() = 'authenticated');

-- 6. Grant table-level access to Supabase roles
-- (RLS restricts rows, but table grants control whether the role can touch the table at all)
GRANT SELECT ON public.tags TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tags TO authenticated;

GRANT SELECT ON public.project_tags TO anon, authenticated;
GRANT INSERT, DELETE ON public.project_tags TO authenticated;

GRANT SELECT ON public.client_tags TO anon, authenticated;
GRANT INSERT, DELETE ON public.client_tags TO authenticated;
