-- ==========================================
-- STEP 12: TAG ISOLATION FIX
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- 1. Ensure `user_id` column exists on tags and is enforced
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- Safely assign orphaned tags to the first developer account
DO $$
DECLARE
    v_admin_user_id UUID;
BEGIN
    SELECT id INTO v_admin_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    IF v_admin_user_id IS NOT NULL THEN
        UPDATE public.tags SET user_id = v_admin_user_id WHERE user_id IS NULL;
    END IF;
END $$;
ALTER TABLE public.tags ALTER COLUMN user_id SET NOT NULL;

-- 2. Drop the overly broad UNIQUE(name) constraint
-- PostgreSQL constraint names usually default to "[tablename]_[column]_key"
ALTER TABLE public.tags DROP CONSTRAINT IF EXISTS tags_name_key;

-- 3. Replace with isolated UNIQUE(name, user_id)
-- This allows Developer A and Developer B to both have a tag called "Urgent"
ALTER TABLE public.tags ADD CONSTRAINT tags_name_user_id_key UNIQUE (name, user_id);

-- 4. Re-enforce strict RLS on tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tags_select" ON public.tags;
DROP POLICY IF EXISTS "tags_insert" ON public.tags;
DROP POLICY IF EXISTS "tags_update" ON public.tags;
DROP POLICY IF EXISTS "tags_delete" ON public.tags;
DROP POLICY IF EXISTS "Developers can manage their own tags" ON public.tags;

CREATE POLICY "tags_isolation_policy"
ON public.tags
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 5. Add default Tags A & B trigger for new developers
-- This automatically seeds 'A' and 'B' for newly signed up accounts
CREATE OR REPLACE FUNCTION public.seed_default_tags()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.tags (user_id, name, color)
  VALUES 
    (NEW.id, 'A', '#6366f1'), -- Default Indigo
    (NEW.id, 'B', '#ef4444'); -- Default Red

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists then create it
DROP TRIGGER IF EXISTS on_auth_user_created_seed_tags ON auth.users;
CREATE TRIGGER on_auth_user_created_seed_tags
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.seed_default_tags();

-- 6. Backfill existing developers with defaults A and B safely
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM auth.users LOOP
        INSERT INTO public.tags (user_id, name, color)
        VALUES 
            (u.id, 'A', '#6366f1'),
            (u.id, 'B', '#ef4444')
        ON CONFLICT (name, user_id) DO NOTHING;
    END LOOP;
END $$;
  
-- Note: We do NOT need to wipe old unused tags, but if any user relies on tags 
-- they should now be perfectly isolated and duplicate names can be used without errors.
