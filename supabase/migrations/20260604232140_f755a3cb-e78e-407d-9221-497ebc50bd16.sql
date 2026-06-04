
-- ANNOUNCEMENTS
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all','school','members','tutors','school_admins')),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super admin manage announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school owner manage school announcements" ON public.announcements
  FOR ALL TO authenticated
  USING (
    school_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_user_id = auth.uid())
  )
  WITH CHECK (
    school_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_id AND s.owner_user_id = auth.uid())
  );

CREATE POLICY "view announcements" ON public.announcements
  FOR SELECT TO authenticated
  USING (
    audience = 'all'
    OR (audience = 'school' AND school_id IS NOT NULL AND public.is_school_member(auth.uid(), school_id))
    OR (audience = 'members' AND public.has_role(auth.uid(), 'member'))
    OR (audience = 'tutors' AND public.has_role(auth.uid(), 'tutor'))
    OR (audience = 'school_admins' AND public.has_role(auth.uid(), 'school_admin'))
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE TRIGGER announcements_touch BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_announcements_published ON public.announcements (published_at DESC);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  metadata jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "update own notifications" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "delete own notifications" ON public.notifications
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "super admin manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE INDEX idx_notifications_user_unread ON public.notifications (user_id, read_at, created_at DESC);
