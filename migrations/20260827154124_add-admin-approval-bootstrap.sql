CREATE OR REPLACE FUNCTION public.bootstrap_initial_admin(
  p_email TEXT,
  p_employee_code TEXT,
  p_team_name TEXT,
  p_team_code TEXT,
  p_position_title TEXT,
  p_level_name TEXT,
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_target public.employees%ROWTYPE;
  v_team_id UUID;
  v_role_id UUID;
  v_email TEXT := lower(btrim(p_email));
  v_employee_code TEXT := upper(btrim(p_employee_code));
  v_team_name TEXT := btrim(p_team_name);
  v_team_code TEXT := upper(btrim(p_team_code));
  v_position_title TEXT := btrim(p_position_title);
  v_level_name TEXT := btrim(p_level_name);
BEGIN
  IF EXISTS (SELECT 1 FROM public.employees WHERE is_admin = true) THEN
    RAISE EXCEPTION 'An administrator already exists.' USING ERRCODE = '23505';
  END IF;

  IF length(v_employee_code) < 2 OR length(v_team_name) = 0 OR length(v_team_code) = 0
    OR length(v_position_title) = 0 OR length(v_level_name) = 0 THEN
    RAISE EXCEPTION 'Complete the initial administrator and team details.' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_target
  FROM public.employees
  WHERE email = v_email
    AND account_status = 'pending_approval'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'A pending employee account was not found for this email.' USING ERRCODE = 'P0002';
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'System Admin' AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'The System Admin role is unavailable.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.teams (name, code)
  VALUES (v_team_name, v_team_code)
  ON CONFLICT (code) DO UPDATE SET code = EXCLUDED.code
  RETURNING id INTO v_team_id;

  UPDATE public.employees
  SET
    employee_code = v_employee_code,
    account_status = 'active',
    is_admin = true,
    primary_role_id = v_role_id,
    position_title = v_position_title,
    level_name = v_level_name,
    rejection_reason = NULL,
    rejected_at = NULL
  WHERE id = v_target.id;

  INSERT INTO public.team_memberships (employee_id, team_id, is_primary, is_active)
  VALUES (v_target.id, v_team_id, true, true)
  ON CONFLICT (employee_id, team_id) DO UPDATE
  SET is_primary = true, is_active = true;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, after_data, request_id
  )
  VALUES (
    'system',
    NULL,
    'account.initial_admin_bootstrapped',
    'employee',
    v_target.id,
    jsonb_build_object(
      'accountStatus', 'active',
      'employeeCode', v_employee_code,
      'teamId', v_team_id,
      'roleId', v_role_id,
      'positionTitle', v_position_title,
      'levelName', v_level_name
    ),
    p_request_id
  );

  RETURN jsonb_build_object('id', v_target.id, 'teamId', v_team_id, 'accountStatus', 'active');
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_initial_admin(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_initial_admin(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  TO project_admin;
