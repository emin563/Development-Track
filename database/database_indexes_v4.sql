-- ==========================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ==========================================
-- These indexes prevent Sequential Scans when joining or filtering across foreign keys, 
-- especially critical for heavily queried views like the CMS dashboards and Client portals.

CREATE INDEX IF NOT EXISTS idx_project_tags_project_id ON public.project_tags(project_id);
CREATE INDEX IF NOT EXISTS idx_client_tags_client_id ON public.client_tags(client_id);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);

CREATE INDEX IF NOT EXISTS idx_project_feedbacks_project_id ON public.project_feedbacks(project_id);
CREATE INDEX IF NOT EXISTS idx_project_feedbacks_update_id ON public.project_feedbacks(update_id);
