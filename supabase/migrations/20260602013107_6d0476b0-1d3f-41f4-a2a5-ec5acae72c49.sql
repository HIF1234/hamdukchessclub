
-- ENUMS
CREATE TYPE public.class_level AS ENUM ('beginner', 'intermediate', 'advanced', 'all_levels');
CREATE TYPE public.class_status AS ENUM ('draft', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.tournament_format AS ENUM ('swiss', 'round_robin', 'knockout', 'arena');
CREATE TYPE public.tournament_status AS ENUM ('draft', 'registration_open', 'in_progress', 'completed', 'cancelled');

-- CLASSES
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tutor_id UUID,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  level public.class_level NOT NULL DEFAULT 'all_levels',
  status public.class_status NOT NULL DEFAULT 'scheduled',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  capacity INTEGER DEFAULT 20,
  meeting_url TEXT,
  resources JSONB DEFAULT '[]'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.classes TO authenticated;
GRANT ALL ON public.classes TO service_role;

ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view classes if active or affiliated"
ON public.classes FOR SELECT TO authenticated
USING (
  status IN ('scheduled','in_progress','completed')
  OR tutor_id = auth.uid()
  OR has_role(auth.uid(), 'super_admin')
  OR (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = classes.school_id AND s.owner_user_id = auth.uid()))
);

CREATE POLICY "super admin manage classes"
ON public.classes FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school admin manage own school classes"
ON public.classes FOR ALL TO authenticated
USING (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = classes.school_id AND s.owner_user_id = auth.uid()))
WITH CHECK (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = classes.school_id AND s.owner_user_id = auth.uid()));

CREATE POLICY "tutor update own classes"
ON public.classes FOR UPDATE TO authenticated
USING (tutor_id = auth.uid())
WITH CHECK (tutor_id = auth.uid());

CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON public.classes FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CLASS ENROLLMENTS
CREATE TABLE public.class_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  attended BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.class_enrollments TO authenticated;
GRANT ALL ON public.class_enrollments TO service_role;

ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view own enrollments"
ON public.class_enrollments FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR has_role(auth.uid(), 'super_admin')
  OR EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.tutor_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.classes c JOIN public.schools s ON s.id = c.school_id WHERE c.id = class_enrollments.class_id AND s.owner_user_id = auth.uid())
);

CREATE POLICY "enroll self"
ON public.class_enrollments FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "unenroll self"
ON public.class_enrollments FOR DELETE TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super admin manage enrollments"
ON public.class_enrollments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "tutor mark attendance"
ON public.class_enrollments FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.tutor_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_enrollments.class_id AND c.tutor_id = auth.uid()));

-- TOURNAMENTS
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  format public.tournament_format NOT NULL DEFAULT 'swiss',
  status public.tournament_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  max_participants INTEGER,
  school_id UUID REFERENCES public.schools(id) ON DELETE SET NULL,
  rounds INTEGER DEFAULT 5,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournaments TO authenticated;
GRANT ALL ON public.tournaments TO service_role;

ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tournaments if visible"
ON public.tournaments FOR SELECT TO authenticated
USING (
  status IN ('registration_open','in_progress','completed')
  OR has_role(auth.uid(), 'super_admin')
  OR (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = tournaments.school_id AND s.owner_user_id = auth.uid()))
);

CREATE POLICY "super admin manage tournaments"
ON public.tournaments FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school admin manage own school tournaments"
ON public.tournaments FOR ALL TO authenticated
USING (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = tournaments.school_id AND s.owner_user_id = auth.uid()))
WITH CHECK (school_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.schools s WHERE s.id = tournaments.school_id AND s.owner_user_id = auth.uid()));

CREATE TRIGGER trg_tournaments_updated_at BEFORE UPDATE ON public.tournaments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TOURNAMENT PARTICIPANTS
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  seed INTEGER,
  score NUMERIC DEFAULT 0,
  rank INTEGER,
  registered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_participants TO authenticated;
GRANT ALL ON public.tournament_participants TO service_role;

ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view tournament participants if visible"
ON public.tournament_participants FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_participants.tournament_id AND t.status IN ('registration_open','in_progress','completed'))
  OR user_id = auth.uid()
  OR has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "register self"
ON public.tournament_participants FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "withdraw self"
ON public.tournament_participants FOR DELETE TO authenticated
USING (user_id = auth.uid() OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "super admin manage participants"
ON public.tournament_participants FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- INDEXES
CREATE INDEX idx_classes_school ON public.classes(school_id);
CREATE INDEX idx_classes_tutor ON public.classes(tutor_id);
CREATE INDEX idx_classes_starts_at ON public.classes(starts_at);
CREATE INDEX idx_class_enrollments_user ON public.class_enrollments(user_id);
CREATE INDEX idx_tournaments_school ON public.tournaments(school_id);
CREATE INDEX idx_tournaments_starts_at ON public.tournaments(starts_at);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants(user_id);
