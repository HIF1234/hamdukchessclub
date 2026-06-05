
DROP POLICY IF EXISTS "members can view their school" ON public.schools;

DROP VIEW IF EXISTS public.schools_public;

CREATE VIEW public.schools_public
WITH (security_invoker = on) AS
SELECT
  id,
  name,
  address,
  student_count,
  created_at
FROM public.schools;

GRANT SELECT ON public.schools_public TO authenticated;

CREATE POLICY "members can view safe school columns"
  ON public.schools
  FOR SELECT
  TO authenticated
  USING (is_school_member(auth.uid(), id));

REVOKE SELECT ON public.schools FROM authenticated;
GRANT SELECT (id, name, address, student_count, created_at)
  ON public.schools TO authenticated;
