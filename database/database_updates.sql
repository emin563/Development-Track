-- Add share_token to projects if it doesn't exist
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;

-- Create project_updates table
CREATE TABLE IF NOT EXISTS public.project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    description TEXT,
    resource_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create project_feedbacks table
CREATE TABLE IF NOT EXISTS public.project_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    update_id UUID REFERENCES public.project_updates(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Open' CHECK (status IN ('Open', 'Resolved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_feedbacks ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage their project updates"
ON public.project_updates
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_updates.project_id
    AND projects.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage their project feedbacks"
ON public.project_feedbacks
USING (
  EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = project_feedbacks.project_id
    AND projects.user_id = auth.uid()
  )
);

-- ==========================================
-- SECURE ACCESSS VIA RPC (SECURITY DEFINER)
-- ==========================================

-- 1. Get Project by Share Token
CREATE OR REPLACE FUNCTION get_project_by_share_token(token TEXT)
RETURNS SETOF public.projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.projects WHERE share_token = token::uuid;
$$;

-- 2. Get Updates by Share Token
CREATE OR REPLACE FUNCTION get_project_updates_by_share_token(token TEXT)
RETURNS SETOF public.project_updates
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pu.* FROM public.project_updates pu
  JOIN public.projects p ON p.id = pu.project_id
  WHERE p.share_token = token::uuid;
$$;

-- 3. Submit Feedback by Share Token
CREATE OR REPLACE FUNCTION submit_project_feedback_by_share_token(
  token TEXT,
  update_uuid UUID,
  c_name TEXT,
  m_text TEXT
)
RETURNS public.project_feedbacks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project_id UUID;
  v_feedback public.project_feedbacks;
BEGIN
  SELECT id INTO v_project_id FROM public.projects WHERE share_token = token::uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid share token';
  END IF;

  INSERT INTO public.project_feedbacks (project_id, update_id, client_name, message)
  VALUES (v_project_id, update_uuid, c_name, m_text)
  RETURNING * INTO v_feedback;

  RETURN v_feedback;
END;
$$;
