CREATE OR REPLACE FUNCTION public.approve_pending_employee(
  p_actor_auth_user_id UUID,
  p_employee_id UUID,
  p_employee_code TEXT,
  p_team_id UUID,
  p_manager_employee_id UUID,
  p_role_id UUID,
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
  v_actor public.employees%ROWTYPE;
  v_target public.employees%ROWTYPE;
  v_employee_code TEXT := upper(btrim(p_employee_code));
  v_position_title TEXT := nullif(btrim(coalesce(p_position_title, '')), '');
  v_level_name TEXT := nullif(btrim(coalesce(p_level_name, '')), '');
  v_before JSONB;
BEGIN
  SELECT * INTO v_actor
  FROM public.employees
  WHERE auth_user_id = p_actor_auth_user_id
    AND account_status = 'active'
    AND is_admin = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin access is required.' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_target
  FROM public.employees
  WHERE id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND OR v_target.account_status <> 'pending_approval' THEN
    RAISE EXCEPTION 'The account is no longer pending approval.' USING ERRCODE = 'P0002';
  END IF;

  IF v_employee_code IS NULL OR length(v_employee_code) < 2 OR length(v_employee_code) > 64 THEN
    RAISE EXCEPTION 'Enter a valid employee code.' USING ERRCODE = '22023';
  END IF;

  IF length(v_position_title) > 120 OR length(v_level_name) > 120 THEN
    RAISE EXCEPTION 'Position and level must not exceed 120 characters.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.teams WHERE id = p_team_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active team.' USING ERRCODE = '23503';
  END IF;

  PERFORM 1 FROM public.roles WHERE id = p_role_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active role.' USING ERRCODE = '23503';
  END IF;

  IF p_manager_employee_id IS NULL OR p_manager_employee_id = p_employee_id THEN
    RAISE EXCEPTION 'Select an active manager.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.employees
  WHERE id = p_manager_employee_id AND account_status = 'active';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active manager.' USING ERRCODE = '23503';
  END IF;

  v_before := jsonb_build_object(
    'accountStatus', v_target.account_status,
    'employeeCodeClaim', v_target.employee_code_claim
  );

  UPDATE public.employees
  SET
    employee_code = v_employee_code,
    account_status = 'active',
    reports_to_employee_id = p_manager_employee_id,
    primary_role_id = p_role_id,
    position_title = v_position_title,
    level_name = v_level_name,
    rejection_reason = NULL,
    rejected_at = NULL
  WHERE id = p_employee_id;

  INSERT INTO public.team_memberships (employee_id, team_id, is_primary, is_active)
  VALUES (p_employee_id, p_team_id, true, true)
  ON CONFLICT (employee_id, team_id) DO UPDATE
  SET is_primary = true, is_active = true;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
  )
  VALUES (
    'user',
    v_actor.id,
    'account.approved',
    'employee',
    p_employee_id,
    v_before,
    jsonb_build_object(
      'accountStatus', 'active',
      'employeeCode', v_employee_code,
      'teamId', p_team_id,
      'managerEmployeeId', p_manager_employee_id,
      'roleId', p_role_id,
      'positionTitle', v_position_title,
      'levelName', v_level_name
    ),
    p_request_id
  );

  RETURN jsonb_build_object('id', p_employee_id, 'accountStatus', 'active');
END;
$$;

REVOKE ALL ON FUNCTION public.approve_pending_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pending_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, UUID)
  TO project_admin;
