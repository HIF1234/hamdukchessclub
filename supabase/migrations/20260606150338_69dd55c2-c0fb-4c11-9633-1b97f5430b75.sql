
-- 1) Function execute grants (fix the 403 "permission denied for function has_role")
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_roles(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_school_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, jsonb) TO authenticated;

-- 2) Table grants for authenticated users (RLS still applies)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_rounds TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_pairings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.school_memberships TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_log TO authenticated;

-- 3) Schools: column-level grants only — sensitive contact/subscription fields stay restricted.
--    Owners and super_admins continue to read all columns via service_role / server functions.
GRANT SELECT (id, name, address, student_count, created_at) ON public.schools TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.schools TO authenticated;

-- 4) Plans catalog — public read; only admins can mutate (enforced by RLS).
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.plans TO authenticated;

-- 5) Service role bypass for all backend/server-function operations
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.classes TO service_role;
GRANT ALL ON public.class_enrollments TO service_role;
GRANT ALL ON public.tournaments TO service_role;
GRANT ALL ON public.tournament_participants TO service_role;
GRANT ALL ON public.tournament_rounds TO service_role;
GRANT ALL ON public.tournament_pairings TO service_role;
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.notifications TO service_role;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.school_memberships TO service_role;
GRANT ALL ON public.audit_log TO service_role;
GRANT ALL ON public.schools TO service_role;
GRANT ALL ON public.plans TO service_role;
