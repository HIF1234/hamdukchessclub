
-- ============== PLANS ==============
CREATE TABLE public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  audience text NOT NULL CHECK (audience IN ('member','school')),
  tier text NOT NULL,
  price_kobo integer NOT NULL CHECK (price_kobo >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  interval text NOT NULL DEFAULT 'monthly' CHECK (interval IN ('monthly','quarterly','yearly','one_time')),
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can view active plans"
  ON public.plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "super admin manage plans"
  ON public.plans FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_plans_touch
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== PAYMENTS ==============
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  school_id uuid,
  plan_id uuid NOT NULL REFERENCES public.plans(id),
  reference text NOT NULL UNIQUE,
  amount_kobo integer NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized','success','failed','abandoned')),
  authorization_url text,
  paid_at timestamptz,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_reference ON public.payments(reference);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own payments"
  ON public.payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "create own payments"
  ON public.payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "super admin manage payments"
  ON public.payments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE TRIGGER trg_payments_touch
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============== PROFILE / SCHOOL extensions ==============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS selected_plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chess_goals text;

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS selected_plan_id uuid REFERENCES public.plans(id),
  ADD COLUMN IF NOT EXISTS student_count integer;

-- ============== SEED PLANS ==============
INSERT INTO public.plans (slug, name, description, audience, tier, price_kobo, interval, features, sort_order)
VALUES
  ('member-beginner', 'Beginner', 'Get started with the club basics', 'member', 'beginner', 500000, 'monthly',
    '["Weekly group classes","Puzzles library","Casual play"]'::jsonb, 1),
  ('member-standard', 'Standard', 'For improving players', 'member', 'standard', 1500000, 'monthly',
    '["Everything in Beginner","Tournaments entry","Tutor messaging","Progress tracking"]'::jsonb, 2),
  ('member-premium', 'Premium', 'Serious competitor track', 'member', 'premium', 3000000, 'monthly',
    '["Everything in Standard","1:1 tutor sessions","Priority support","Advanced analytics"]'::jsonb, 3),
  ('school-starter', 'School Starter', 'For schools onboarding their first cohort', 'school', 'starter', 5000000, 'monthly',
    '["Up to 30 students","School admin dashboard","Tutor assignment","Class scheduling"]'::jsonb, 1)
ON CONFLICT (slug) DO NOTHING;
