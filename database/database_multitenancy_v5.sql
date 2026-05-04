-- ==========================================
-- MULTI-TENANCY MIGRATION
-- ==========================================

-- 1. Ensure `user_id` exists on all root entity tables
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Update existing rows to inherit the first available user ID if they are NULL
-- (Safe fallback if migrating an existing single-user system)
DO $$
DECLARE
    v_admin_user_id UUID;
BEGIN
    -- Grab the first registered auth user to adopt all the single-user legacy rows
    SELECT id INTO v_admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF v_admin_user_id IS NOT NULL THEN
        UPDATE public.projects SET user_id = v_admin_user_id WHERE user_id IS NULL;
        UPDATE public.clients SET user_id = v_admin_user_id WHERE user_id IS NULL;
        UPDATE public.tags SET user_id = v_admin_user_id WHERE user_id IS NULL;
    END IF;
END $$;

-- 3. Enforce NOT NULL now that data is patched
ALTER TABLE public.projects ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.clients ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE public.tags ALTER COLUMN user_id SET NOT NULL;

-- 4. Update RLS Policies to strictly enforce Multi-Tenancy

-- CLIENTS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all active users" ON public.clients;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.clients;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.clients;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.clients;
DROP POLICY IF EXISTS "Developers can manage their own clients" ON public.clients;

CREATE POLICY "Developers can manage their own clients" 
ON public.clients
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- TAGS
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all active users" ON public.tags;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.tags;
DROP POLICY IF EXISTS "Enable delete for users based on id" ON public.tags;
DROP POLICY IF EXISTS "Developers can manage their own tags" ON public.tags;

CREATE POLICY "Developers can manage their own tags" 
ON public.tags
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- PROJECTS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for all active users" ON public.projects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.projects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON public.projects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON public.projects;
DROP POLICY IF EXISTS "Developers can manage their own projects" ON public.projects;

CREATE POLICY "Developers can manage their own projects" 
ON public.projects
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
