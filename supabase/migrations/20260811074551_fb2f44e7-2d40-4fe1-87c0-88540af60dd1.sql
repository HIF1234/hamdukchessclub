ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb NOT NULL DEFAULT '{"email":{"class_reminders":true,"tournament_alerts":true,"payment_due":true,"results":true,"announcements":true,"messages":true},"in_app":{"class_reminders":true,"tournament_alerts":true,"payment_due":true,"results":true,"announcements":true,"messages":true},"sms":{"class_reminders":false,"tournament_alerts":false,"payment_due":false,"results":false,"announcements":false,"messages":false}}'::jsonb;

CREATE TABLE IF NOT EXISTS public.login_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  success boolean NOT NULL DEFAULT true,
  method text NOT NULL DEFAULT 'password',
  ip_address text,
  user_agent text,
  device text,
  browser text,
  location text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS login_events_user_created_idx ON public.login_events (user_id, created_at DESC);

GRANT SELECT ON public.login_events TO authenticated;
GRANT ALL ON public.login_events TO service_role;

ALTER TABLE public.login_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "login_events_select_own" ON public.login_events;
CREATE POLICY "login_events_select_own" ON public.login_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));