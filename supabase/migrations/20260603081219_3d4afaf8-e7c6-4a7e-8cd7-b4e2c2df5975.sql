
-- 1. Profiles: remove broad cross-member SELECT exposing email/phone/dob/gender.
DROP POLICY IF EXISTS "members can view other members basic" ON public.profiles;

-- Provide a safe public view with non-sensitive columns only.
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
SELECT id, full_name, avatar_url, membership_level, chess_rating,
       visibility, member_since
FROM public.profiles
WHERE visibility IN ('members_only', 'public');

GRANT SELECT ON public.profiles_public TO authenticated;

-- 2. Schools: remove broad member SELECT exposing contact/subscription details.
DROP POLICY IF EXISTS "view school if member or admin" ON public.schools;

CREATE POLICY "view school if owner or super admin"
ON public.schools FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role) OR owner_user_id = auth.uid());

-- Safe view for ordinary school members (no contact_*, no subscription_*, no suspended_reason).
CREATE OR REPLACE VIEW public.schools_public
WITH (security_invoker = on) AS
SELECT id, name, program_tier, created_at
FROM public.schools
WHERE public.is_school_member(auth.uid(), id)
   OR owner_user_id = auth.uid()
   OR public.has_role(auth.uid(), 'super_admin'::app_role);

GRANT SELECT ON public.schools_public TO authenticated;

-- 3. user_roles: add restrictive deny policy to prevent any future privilege escalation.
CREATE POLICY "deny self insert roles"
ON public.user_roles AS RESTRICTIVE
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "deny self update roles"
ON public.user_roles AS RESTRICTIVE
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "deny self delete roles"
ON public.user_roles AS RESTRICTIVE
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'::app_role));

-- 4. Revoke EXECUTE on SECURITY DEFINER helpers that should not be callable from the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_confirmed() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_roles(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) FROM PUBLIC, anon;
-- has_role / is_school_member are used inside RLS policies (run as definer) — no EXECUTE grant required.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) FROM authenticated;

-- 5. Fix mutable search_path on touch_updated_at.
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
