-- Drop the old broken policies
DROP POLICY IF EXISTS "Admins can manage their project updates" ON public.project_updates;
DROP POLICY IF EXISTS "Admins can manage their project feedbacks" ON public.project_feedbacks;

-- New simple policies: allow any authenticated user to read/write
CREATE POLICY "Authenticated users can manage project updates"
ON public.project_updates
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage project feedbacks"
ON public.project_feedbacks
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
