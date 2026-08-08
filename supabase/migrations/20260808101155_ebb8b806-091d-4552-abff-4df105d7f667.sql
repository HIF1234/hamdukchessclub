
CREATE TABLE public.hamduk_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  hamduk_username text NOT NULL,
  link_status text NOT NULL DEFAULT 'pending',
  admin_note text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hamduk_accounts TO authenticated;
GRANT ALL ON public.hamduk_accounts TO service_role;
ALTER TABLE public.hamduk_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own account select" ON public.hamduk_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "own account insert" ON public.hamduk_accounts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own account update" ON public.hamduk_accounts FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "admin account delete" ON public.hamduk_accounts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
CREATE TRIGGER hamduk_accounts_touch BEFORE UPDATE ON public.hamduk_accounts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.hamduk_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  hamduk_username text NOT NULL,
  classical_rating integer,
  country text,
  breakdown jsonb NOT NULL DEFAULT '[]'::jsonb,
  synced_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hamduk_ratings TO authenticated;
GRANT ALL ON public.hamduk_ratings TO service_role;
ALTER TABLE public.hamduk_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own ratings select" ON public.hamduk_ratings FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.hamduk_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  white text,
  black text,
  time_control text,
  variant text,
  status text,
  result text,
  end_reason text,
  rated boolean,
  moves integer,
  pgn text,
  white_rating_delta integer,
  black_rating_delta integer,
  played_at timestamptz,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, game_id)
);
CREATE INDEX hamduk_games_user_played_idx ON public.hamduk_games (user_id, played_at DESC);
GRANT SELECT ON public.hamduk_games TO authenticated;
GRANT ALL ON public.hamduk_games TO service_role;
ALTER TABLE public.hamduk_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own games select" ON public.hamduk_games FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'super_admin'));

CREATE TABLE public.hamduk_embeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  label text NOT NULL,
  token text NOT NULL,
  embed_url text NOT NULL,
  iframe_html text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hamduk_embeds TO authenticated;
GRANT ALL ON public.hamduk_embeds TO service_role;
ALTER TABLE public.hamduk_embeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members view embeds" ON public.hamduk_embeds FOR SELECT TO authenticated USING (true);

CREATE TABLE public.hamduk_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remote_id text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  signing_secret text NOT NULL,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.hamduk_webhooks TO service_role;
ALTER TABLE public.hamduk_webhooks ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.hamduk_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  payload jsonb,
  signature_valid boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hamduk_webhook_events TO authenticated;
GRANT ALL ON public.hamduk_webhook_events TO service_role;
ALTER TABLE public.hamduk_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins view hamduk events" ON public.hamduk_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));
