-- Rounds
CREATE TABLE public.tournament_rounds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_number int NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending | in_progress | completed
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tournament_id, round_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_rounds TO authenticated;
GRANT ALL ON public.tournament_rounds TO service_role;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view rounds if tournament visible"
ON public.tournament_rounds FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tournaments t
  WHERE t.id = tournament_rounds.tournament_id
    AND (
      t.status IN ('registration_open','in_progress','completed')
      OR public.has_role(auth.uid(), 'super_admin')
      OR (t.school_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.schools s WHERE s.id = t.school_id AND s.owner_user_id = auth.uid()
      ))
    )
));

CREATE POLICY "super admin manage rounds"
ON public.tournament_rounds FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school admin manage own rounds"
ON public.tournament_rounds FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tournaments t
  JOIN public.schools s ON s.id = t.school_id
  WHERE t.id = tournament_rounds.tournament_id AND s.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tournaments t
  JOIN public.schools s ON s.id = t.school_id
  WHERE t.id = tournament_rounds.tournament_id AND s.owner_user_id = auth.uid()
));

-- Pairings
CREATE TABLE public.tournament_pairings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id uuid NOT NULL REFERENCES public.tournaments(id) ON DELETE CASCADE,
  round_id uuid NOT NULL REFERENCES public.tournament_rounds(id) ON DELETE CASCADE,
  board int NOT NULL,
  white_user_id uuid,
  black_user_id uuid,
  result text, -- '1-0' | '0-1' | '1/2-1/2' | 'bye'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tournament_pairings TO authenticated;
GRANT ALL ON public.tournament_pairings TO service_role;
ALTER TABLE public.tournament_pairings ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_pairings_round ON public.tournament_pairings(round_id);
CREATE INDEX idx_pairings_tournament ON public.tournament_pairings(tournament_id);

CREATE POLICY "view pairings if tournament visible"
ON public.tournament_pairings FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tournaments t
  WHERE t.id = tournament_pairings.tournament_id
    AND (
      t.status IN ('registration_open','in_progress','completed')
      OR public.has_role(auth.uid(), 'super_admin')
      OR (t.school_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.schools s WHERE s.id = t.school_id AND s.owner_user_id = auth.uid()
      ))
    )
));

CREATE POLICY "super admin manage pairings"
ON public.tournament_pairings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "school admin manage own pairings"
ON public.tournament_pairings FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.tournaments t
  JOIN public.schools s ON s.id = t.school_id
  WHERE t.id = tournament_pairings.tournament_id AND s.owner_user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tournaments t
  JOIN public.schools s ON s.id = t.school_id
  WHERE t.id = tournament_pairings.tournament_id AND s.owner_user_id = auth.uid()
));

CREATE TRIGGER touch_tournament_pairings BEFORE UPDATE ON public.tournament_pairings
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();