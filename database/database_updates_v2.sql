-- ==========================================
-- CLIENT REVAMP: MULTI-PROJECT RPCs
-- ==========================================

-- 1. Get ALL Client Projects by Share Token
-- This checks which client owns the project tied to the share_token
-- and returns ALL projects belonging to that client.
CREATE OR REPLACE FUNCTION get_client_projects_by_share_token(token TEXT)
RETURNS SETOF public.projects
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p2.* 
  FROM public.projects p1
  JOIN public.projects p2 ON p1.client_id = p2.client_id
  WHERE p1.share_token = token::uuid;
$$;

-- 2. Get ALL Client Feedbacks by Share Token
-- Returns all feedbacks across all projects belonging to that client.
CREATE OR REPLACE FUNCTION get_client_all_feedbacks_by_share_token(token TEXT)
RETURNS SETOF public.project_feedbacks
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.* 
  FROM public.projects p1
  JOIN public.projects p2 ON p1.client_id = p2.client_id
  JOIN public.project_feedbacks f ON f.project_id = p2.id
  WHERE p1.share_token = token::uuid
  ORDER BY f.created_at DESC;
$$;
