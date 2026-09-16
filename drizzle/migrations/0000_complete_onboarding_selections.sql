ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS membership_type text,
  ADD COLUMN IF NOT EXISTS billing_cycle text,
  ADD COLUMN IF NOT EXISTS lecture_level text;

CREATE INDEX IF NOT EXISTS profiles_onboarding_step_idx ON public.profiles (onboarding_step);
