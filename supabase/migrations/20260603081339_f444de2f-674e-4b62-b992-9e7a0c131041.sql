
-- AUDIT LOG: remove direct user insert; provide controlled definer function.
DROP POLICY IF EXISTS "insert audit entries when signed in" ON public.audit_log;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _target_type text DEFAULT NULL,
  _target_id text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _action IS NULL OR length(_action) = 0 OR length(_action) > 100 THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;
  INSERT INTO public.audit_log (user_id, action, target_type, target_id, metadata)
  VALUES (auth.uid(), _action, _target_type, _target_id, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) TO authenticated;

-- CLASSES: restrict full-row SELECT (incl. meeting_url) to participants.
DROP POLICY IF EXISTS "view classes if active or affiliated" ON public.classes;

CREATE POLICY "view classes if participant or admin"
ON public.classes FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR tutor_id = auth.uid()
  OR (school_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.schools s
         WHERE s.id = classes.school_id AND s.owner_user_id = auth.uid()))
  OR EXISTS (
        SELECT 1 FROM public.class_enrollments e
         WHERE e.class_id = classes.id AND e.user_id = auth.uid())
);

-- Public-safe view for browsing/discovery (no meeting_url, no resources).
CREATE OR REPLACE VIEW public.classes_public
WITH (security_invoker = on) AS
SELECT id, title, description, tutor_id, school_id, level, status,
       starts_at, ends_at, capacity, created_at
FROM public.classes
WHERE status IN ('scheduled', 'in_progress', 'completed');

GRANT SELECT ON public.classes_public TO authenticated;
