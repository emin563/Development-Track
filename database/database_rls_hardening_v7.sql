-- ==========================================
-- STEP 13: JOIN TABLE RLS + TRIGGER HARDENING
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- ──────────────────────────────────────────
-- Finding 4: Scope project_tags / client_tags RLS
-- ──────────────────────────────────────────

-- project_tags: Only allow operations if the user owns the project
ALTER TABLE public.project_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_tags_select" ON public.project_tags;
DROP POLICY IF EXISTS "project_tags_insert" ON public.project_tags;
DROP POLICY IF EXISTS "project_tags_delete" ON public.project_tags;
DROP POLICY IF EXISTS "project_tags_isolation" ON public.project_tags;

CREATE POLICY "project_tags_isolation"
ON public.project_tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_tags.project_id
      AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE id = project_tags.project_id
      AND user_id = auth.uid()
  )
);


-- client_tags: Only allow operations if the user owns the client
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_tags_select" ON public.client_tags;
DROP POLICY IF EXISTS "client_tags_insert" ON public.client_tags;
DROP POLICY IF EXISTS "client_tags_delete" ON public.client_tags;
DROP POLICY IF EXISTS "client_tags_isolation" ON public.client_tags;

CREATE POLICY "client_tags_isolation"
ON public.client_tags
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_tags.client_id
      AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = client_tags.client_id
      AND user_id = auth.uid()
  )
);


-- ──────────────────────────────────────────
-- Finding 6: Harden seed_default_tags trigger
-- ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.seed_default_tags()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tags (user_id, name, color)
  VALUES 
    (NEW.id, 'A', '#6366f1'),
    (NEW.id, 'B', '#ef4444');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
