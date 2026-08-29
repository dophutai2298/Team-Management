ALTER TABLE public.employees
  ADD COLUMN birthday DATE,
  ADD COLUMN phone TEXT,
  ADD COLUMN address TEXT,
  ADD COLUMN hometown TEXT,
  ADD COLUMN avatar_url TEXT,
  ADD COLUMN avatar_key TEXT,
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Saigon',
  ADD CONSTRAINT employees_full_name_length CHECK (length(btrim(full_name)) BETWEEN 2 AND 160),
  ADD CONSTRAINT employees_phone_length CHECK (phone IS NULL OR length(btrim(phone)) <= 40),
  ADD CONSTRAINT employees_address_length CHECK (address IS NULL OR length(btrim(address)) <= 240),
  ADD CONSTRAINT employees_hometown_length CHECK (hometown IS NULL OR length(btrim(hometown)) <= 120),
  ADD CONSTRAINT employees_avatar_url_length CHECK (avatar_url IS NULL OR length(btrim(avatar_url)) <= 500),
  ADD CONSTRAINT employees_avatar_key_length CHECK (avatar_key IS NULL OR length(btrim(avatar_key)) <= 500),
  ADD CONSTRAINT employees_timezone_length CHECK (length(btrim(timezone)) BETWEEN 2 AND 80);

CREATE TABLE public.employee_management_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  actor_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  changed_fields TEXT[] NOT NULL DEFAULT '{}'::text[],
  before_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employee_management_history_action_not_blank CHECK (length(btrim(action)) > 0)
);

CREATE INDEX employee_management_history_employee_created_at_idx
  ON public.employee_management_history (employee_id, created_at DESC);
CREATE INDEX employee_management_history_actor_created_at_idx
  ON public.employee_management_history (actor_employee_id, created_at DESC);

ALTER TABLE public.employee_management_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.employee_management_history FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.update_employee_profile_self(
  p_auth_user_id UUID,
  p_full_name TEXT,
  p_birthday DATE,
  p_phone TEXT,
  p_address TEXT,
  p_hometown TEXT,
  p_avatar_url TEXT,
  p_avatar_key TEXT,
  p_timezone TEXT,
  p_locale TEXT,
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_employee public.employees%ROWTYPE;
  v_full_name TEXT := btrim(coalesce(p_full_name, ''));
  v_phone TEXT := nullif(btrim(coalesce(p_phone, '')), '');
  v_address TEXT := nullif(btrim(coalesce(p_address, '')), '');
  v_hometown TEXT := nullif(btrim(coalesce(p_hometown, '')), '');
  v_avatar_url TEXT := nullif(btrim(coalesce(p_avatar_url, '')), '');
  v_avatar_key TEXT := nullif(btrim(coalesce(p_avatar_key, '')), '');
  v_timezone TEXT := btrim(coalesce(p_timezone, ''));
  v_locale TEXT := lower(btrim(coalesce(p_locale, '')));
BEGIN
  SELECT * INTO v_employee
  FROM public.employees
  WHERE auth_user_id = p_auth_user_id
    AND account_status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active employee access is required.' USING ERRCODE = '42501';
  END IF;

  IF length(v_full_name) < 2 OR length(v_full_name) > 160
    OR length(v_phone) > 40
    OR length(v_address) > 240
    OR length(v_hometown) > 120
    OR length(v_avatar_url) > 500
    OR length(v_avatar_key) > 500
    OR length(v_timezone) < 2
    OR length(v_timezone) > 80
    OR v_locale NOT IN ('vi', 'en') THEN
    RAISE EXCEPTION 'Invalid employee profile input.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.employees
  SET
    full_name = v_full_name,
    birthday = p_birthday,
    phone = v_phone,
    address = v_address,
    hometown = v_hometown,
    avatar_url = v_avatar_url,
    avatar_key = v_avatar_key,
    timezone = v_timezone,
    locale = v_locale
  WHERE id = v_employee.id;

  RETURN jsonb_build_object('id', v_employee.id, 'requestId', p_request_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_employee(
  p_actor_auth_user_id UUID,
  p_employee_id UUID,
  p_employee_code TEXT,
  p_team_id UUID,
  p_manager_employee_id UUID,
  p_role_id UUID,
  p_position_title TEXT,
  p_level_name TEXT,
  p_account_status TEXT,
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
  v_employee_code TEXT := upper(btrim(coalesce(p_employee_code, '')));
  v_position_title TEXT := nullif(btrim(coalesce(p_position_title, '')), '');
  v_level_name TEXT := nullif(btrim(coalesce(p_level_name, '')), '');
  v_account_status TEXT := lower(btrim(coalesce(p_account_status, '')));
  v_old_primary_team_id UUID;
  v_changed_fields TEXT[] := ARRAY[]::text[];
  v_before JSONB;
  v_after JSONB;
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

  IF NOT FOUND OR v_target.account_status = 'pending_approval' THEN
    RAISE EXCEPTION 'Employee management target is invalid.' USING ERRCODE = 'P0002';
  END IF;

  IF length(v_employee_code) < 2 OR length(v_employee_code) > 64
    OR v_account_status NOT IN ('active', 'disabled', 'terminated')
    OR length(v_position_title) > 120
    OR length(v_level_name) > 120 THEN
    RAISE EXCEPTION 'Invalid employee management input.' USING ERRCODE = '22023';
  END IF;

  PERFORM 1 FROM public.teams WHERE id = p_team_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active team.' USING ERRCODE = '23503';
  END IF;

  PERFORM 1 FROM public.roles WHERE id = p_role_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Select an active role.' USING ERRCODE = '23503';
  END IF;

  IF p_manager_employee_id IS NOT NULL THEN
    IF p_manager_employee_id = p_employee_id THEN
      RAISE EXCEPTION 'An employee cannot be their own manager.' USING ERRCODE = '22023';
    END IF;

    PERFORM 1 FROM public.employees
    WHERE id = p_manager_employee_id AND account_status = 'active';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Select an active manager.' USING ERRCODE = '23503';
    END IF;
  END IF;

  SELECT team_id INTO v_old_primary_team_id
  FROM public.team_memberships
  WHERE employee_id = p_employee_id
    AND is_primary = true
    AND is_active = true
  LIMIT 1;

  IF v_target.employee_code IS DISTINCT FROM v_employee_code THEN
    v_changed_fields := array_append(v_changed_fields, 'employeeCode');
  END IF;
  IF v_old_primary_team_id IS DISTINCT FROM p_team_id THEN
    v_changed_fields := array_append(v_changed_fields, 'teamId');
  END IF;
  IF v_target.reports_to_employee_id IS DISTINCT FROM p_manager_employee_id THEN
    v_changed_fields := array_append(v_changed_fields, 'managerEmployeeId');
  END IF;
  IF v_target.primary_role_id IS DISTINCT FROM p_role_id THEN
    v_changed_fields := array_append(v_changed_fields, 'roleId');
  END IF;
  IF v_target.position_title IS DISTINCT FROM v_position_title THEN
    v_changed_fields := array_append(v_changed_fields, 'positionTitle');
  END IF;
  IF v_target.level_name IS DISTINCT FROM v_level_name THEN
    v_changed_fields := array_append(v_changed_fields, 'levelName');
  END IF;
  IF v_target.account_status IS DISTINCT FROM v_account_status THEN
    v_changed_fields := array_append(v_changed_fields, 'accountStatus');
  END IF;

  v_before := jsonb_build_object(
    'employeeCode', v_target.employee_code,
    'teamId', v_old_primary_team_id,
    'managerEmployeeId', v_target.reports_to_employee_id,
    'roleId', v_target.primary_role_id,
    'positionTitle', v_target.position_title,
    'levelName', v_target.level_name,
    'accountStatus', v_target.account_status
  );

  UPDATE public.employees
  SET
    employee_code = v_employee_code,
    reports_to_employee_id = p_manager_employee_id,
    primary_role_id = p_role_id,
    position_title = v_position_title,
    level_name = v_level_name,
    account_status = v_account_status,
    rejection_reason = NULL,
    rejected_at = CASE WHEN v_account_status = 'disabled' THEN COALESCE(rejected_at, now()) ELSE NULL END
  WHERE id = p_employee_id;

  UPDATE public.team_memberships
  SET is_primary = false
  WHERE employee_id = p_employee_id
    AND is_primary = true
    AND team_id IS DISTINCT FROM p_team_id;

  INSERT INTO public.team_memberships (employee_id, team_id, is_primary, is_active)
  VALUES (p_employee_id, p_team_id, true, true)
  ON CONFLICT (employee_id, team_id) DO UPDATE
  SET is_primary = true, is_active = true;

  v_after := jsonb_build_object(
    'employeeCode', v_employee_code,
    'teamId', p_team_id,
    'managerEmployeeId', p_manager_employee_id,
    'roleId', p_role_id,
    'positionTitle', v_position_title,
    'levelName', v_level_name,
    'accountStatus', v_account_status
  );

  IF array_length(v_changed_fields, 1) IS NOT NULL THEN
    INSERT INTO public.employee_management_history (
      employee_id, actor_employee_id, action, changed_fields, before_data, after_data, request_id
    )
    VALUES (
      p_employee_id,
      v_actor.id,
      'employee.updated',
      v_changed_fields,
      v_before,
      v_after,
      p_request_id
    );

    INSERT INTO public.account_audit_events (
      actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
    )
    VALUES (
      'user',
      v_actor.id,
      'employee.updated',
      'employee',
      p_employee_id,
      v_before,
      v_after,
      p_request_id
    );
  END IF;

  RETURN jsonb_build_object('id', p_employee_id, 'changedFields', v_changed_fields);
END;
$$;

REVOKE ALL ON FUNCTION public.update_employee_profile_self(UUID, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_update_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_employee_profile_self(UUID, TEXT, DATE, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, UUID)
  TO project_admin;
GRANT EXECUTE ON FUNCTION public.admin_update_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, TEXT, UUID)
  TO project_admin;
