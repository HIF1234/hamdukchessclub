-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('super_admin', 'school_admin', 'tutor', 'member');
CREATE TYPE public.account_state AS ENUM ('unverified', 'pending_payment', 'active', 'expired', 'suspended');
CREATE TYPE public.membership_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE public.school_program_tier AS ENUM ('starter', 'standard', 'premium');
CREATE TYPE public.subscription_status AS ENUM ('none', 'pending', 'active', 'expired', 'cancelled');
CREATE TYPE public.profile_visibility AS ENUM ('members_only', 'public');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT,
  location TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  theme TEXT DEFAULT 'dark',
  visibility public.profile_visibility DEFAULT 'members_only',
  membership_level public.membership_level DEFAULT 'beginner',
  chess_rating INT DEFAULT 800,
  account_state public.account_state DEFAULT 'unverified',
  onboarding_completed BOOLEAN DEFAULT false,
  member_since TIMESTAMPTZ DEFAULT now(),
  last_active_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============ SECURITY DEFINER ROLE CHECK ============
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
RETURNS SETOF public.app_role
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id;
$$;

-- ============ SCHOOLS ============
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  program_tier public.school_program_tier DEFAULT 'starter',
  subscription_status public.subscription_status DEFAULT 'none',
  subscription_started_at TIMESTAMPTZ,
  subscription_expires_at TIMESTAMPTZ,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_suspended BOOLEAN DEFAULT false,
  suspended_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- ============ SCHOOL MEMBERSHIPS ============
CREATE TABLE public.school_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cohort TEXT,
  role_in_school TEXT NOT NULL DEFAULT 'student',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, user_id)
);
ALTER TABLE public.school_memberships ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_school_member(_user_id UUID, _school_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_memberships WHERE user_id = _user_id AND school_id = _school_id);
$$;

-- ============ AUDIT LOG ============
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_created ON public.audit_log(created_at DESC);

-- ============ AUTO-CREATE PROFILE + DEFAULT ROLE ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _role public.app_role;
  _full_name TEXT;
BEGIN
  _full_name := COALESCE(
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'name',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, email, full_name, account_state)
  VALUES (
    NEW.id,
    NEW.email,
    _full_name,
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN 'pending_payment'::public.account_state ELSE 'unverified'::public.account_state END
  );

  -- Default role from signup metadata, fallback to 'member'
  _role := COALESCE(
    (NEW.raw_user_meta_data ->> 'role')::public.app_role,
    'member'::public.app_role
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ KEEP profiles.account_state IN SYNC WHEN EMAIL CONFIRMED ============
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE public.profiles
       SET account_state = 'pending_payment'
     WHERE id = NEW.id AND account_state = 'unverified';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_email_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_email_confirmed();

-- ============ updated_at TRIGGER HELPER ============
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER schools_touch  BEFORE UPDATE ON public.schools  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ RLS POLICIES ============

-- profiles
CREATE POLICY "view own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "super admin all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "members can view other members basic" ON public.profiles FOR SELECT TO authenticated USING (visibility = 'members_only' OR visibility = 'public');

-- user_roles
CREATE POLICY "view own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "super admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- schools
CREATE POLICY "view school if member or admin" ON public.schools FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR owner_user_id = auth.uid()
    OR public.is_school_member(auth.uid(), id)
  );
CREATE POLICY "super admin manage schools" ON public.schools FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
CREATE POLICY "school owner update own school" ON public.schools FOR UPDATE TO authenticated USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());

-- school_memberships
CREATE POLICY "view own school memberships" ON public.school_memberships FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "view school memberships if school admin" ON public.school_memberships FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (SELECT 1 FROM public.schools s WHERE s.id = school_memberships.school_id AND s.owner_user_id = auth.uid())
  );
CREATE POLICY "super admin manage memberships" ON public.school_memberships FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin')) WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- audit_log
CREATE POLICY "insert audit entries when signed in" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "super admin read audit" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));