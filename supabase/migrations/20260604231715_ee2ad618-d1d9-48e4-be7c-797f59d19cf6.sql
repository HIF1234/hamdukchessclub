
-- 1. Harden handle_new_user role selection
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _requested TEXT;
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

  -- Only allow self-selection of safe roles. Elevated roles (super_admin, tutor)
  -- must be granted by an admin, never claimed via signup metadata.
  _requested := NEW.raw_user_meta_data ->> 'role';
  IF _requested IN ('school_admin', 'member') THEN
    _role := _requested::public.app_role;
  ELSE
    _role := 'member'::public.app_role;
  END IF;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);

  RETURN NEW;
END;
$function$;

-- 2. School owners can manage memberships for their own school
CREATE POLICY "school owner insert memberships"
  ON public.school_memberships
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = school_memberships.school_id
        AND s.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "school owner delete memberships"
  ON public.school_memberships
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.schools s
      WHERE s.id = school_memberships.school_id
        AND s.owner_user_id = auth.uid()
    )
  );

-- 3. School members can view their school
CREATE POLICY "members can view their school"
  ON public.schools
  FOR SELECT
  TO authenticated
  USING (
    public.is_school_member(auth.uid(), id)
  );
