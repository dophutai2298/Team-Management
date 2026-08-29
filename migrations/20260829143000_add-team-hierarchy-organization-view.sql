ALTER TABLE public.teams
  ADD COLUMN parent_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN description TEXT,
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT teams_parent_not_self CHECK (parent_team_id IS NULL OR parent_team_id <> id),
  ADD CONSTRAINT teams_description_length CHECK (description IS NULL OR length(btrim(description)) <= 500),
  ADD CONSTRAINT teams_metadata_object CHECK (jsonb_typeof(metadata) = 'object');

CREATE INDEX teams_parent_team_id_idx ON public.teams (parent_team_id);

ALTER TABLE public.team_memberships
  ADD COLUMN manager_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN membership_title TEXT,
  ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT team_memberships_primary_requires_active CHECK (NOT is_primary OR is_active),
  ADD CONSTRAINT team_memberships_title_length CHECK (membership_title IS NULL OR length(btrim(membership_title)) <= 120),
  ADD CONSTRAINT team_memberships_metadata_object CHECK (jsonb_typeof(metadata) = 'object');

CREATE INDEX team_memberships_manager_employee_id_idx
  ON public.team_memberships (manager_employee_id);

ALTER TABLE public.employees
  ADD CONSTRAINT employees_reports_to_not_self
  CHECK (reports_to_employee_id IS NULL OR reports_to_employee_id <> id);

CREATE OR REPLACE FUNCTION public.prevent_team_parent_cycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF NEW.parent_team_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    WITH RECURSIVE ancestors(id) AS (
      SELECT team.parent_team_id
      FROM public.teams AS team
      WHERE team.id = NEW.parent_team_id

      UNION

      SELECT team.parent_team_id
      FROM public.teams AS team
      INNER JOIN ancestors ON team.id = ancestors.id
      WHERE team.parent_team_id IS NOT NULL
    )
    SELECT 1
    FROM ancestors
    WHERE id = NEW.id
  ) THEN
    RAISE EXCEPTION 'A team cannot be assigned below itself.' USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER teams_prevent_parent_cycle
  BEFORE INSERT OR UPDATE OF parent_team_id ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.prevent_team_parent_cycle();

CREATE OR REPLACE FUNCTION public.get_team_descendant_ids(p_team_id UUID)
RETURNS TABLE(team_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH RECURSIVE descendants(id) AS (
    SELECT team.id
    FROM public.teams AS team
    WHERE team.parent_team_id = p_team_id

    UNION

    SELECT team.id
    FROM public.teams AS team
    INNER JOIN descendants ON team.parent_team_id = descendants.id
  )
  SELECT descendants.id AS team_id
  FROM descendants;
$$;

CREATE OR REPLACE FUNCTION public.get_team_subtree_employee_ids(p_team_id UUID)
RETURNS TABLE(employee_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH RECURSIVE team_scope(id) AS (
    SELECT p_team_id

    UNION

    SELECT team.id
    FROM public.teams AS team
    INNER JOIN team_scope ON team.parent_team_id = team_scope.id
  )
  SELECT DISTINCT membership.employee_id
  FROM public.team_memberships AS membership
  INNER JOIN team_scope ON team_scope.id = membership.team_id
  WHERE membership.is_active = true;
$$;

REVOKE ALL ON FUNCTION public.prevent_team_parent_cycle() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_team_descendant_ids(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_team_subtree_employee_ids(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_team_descendant_ids(UUID) TO project_admin;
GRANT EXECUTE ON FUNCTION public.get_team_subtree_employee_ids(UUID) TO project_admin;

CREATE OR REPLACE FUNCTION public.admin_upsert_team(
  p_actor_auth_user_id UUID,
  p_team_id UUID,
  p_name TEXT,
  p_code TEXT,
  p_parent_team_id UUID,
  p_description TEXT,
  p_metadata JSONB,
  p_is_active BOOLEAN,
  p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_actor public.employees%ROWTYPE;
  v_team public.teams%ROWTYPE;
  v_before JSONB := '{}'::jsonb;
  v_name TEXT := btrim(coalesce(p_name, ''));
  v_code TEXT := upper(btrim(coalesce(p_code, '')));
  v_description TEXT := nullif(btrim(coalesce(p_description, '')), '');
  v_metadata JSONB := coalesce(p_metadata, '{}'::jsonb);
  v_action TEXT := 'team.created';
BEGIN
  SELECT * INTO v_actor
  FROM public.employees
  WHERE auth_user_id = p_actor_auth_user_id
    AND account_status = 'active'
    AND is_admin = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admin access is required.' USING ERRCODE = '42501';
  END IF;

  IF length(v_name) < 2
    OR length(v_name) > 160
    OR length(v_code) < 2
    OR length(v_code) > 64
    OR length(v_description) > 500
    OR jsonb_typeof(v_metadata) <> 'object' THEN
    RAISE EXCEPTION 'Invalid team input.' USING ERRCODE = '22023';
  END IF;

  IF p_parent_team_id IS NOT NULL THEN
    PERFORM 1 FROM public.teams WHERE id = p_parent_team_id AND is_active = true;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Select an active parent team.' USING ERRCODE = '23503';
    END IF;
  END IF;

  IF p_team_id IS NULL THEN
    INSERT INTO public.teams (name, code, parent_team_id, description, metadata, is_active)
    VALUES (v_name, v_code, p_parent_team_id, v_description, v_metadata, coalesce(p_is_active, true))
    RETURNING * INTO v_team;
  ELSE
    SELECT * INTO v_team
    FROM public.teams
    WHERE id = p_team_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Team not found.' USING ERRCODE = 'P0002';
    END IF;

    v_action := 'team.updated';
    v_before := jsonb_build_object(
      'name', v_team.name,
      'code', v_team.code,
      'parentTeamId', v_team.parent_team_id,
      'description', v_team.description,
      'metadata', v_team.metadata,
      'isActive', v_team.is_active
    );

    UPDATE public.teams
    SET
      name = v_name,
      code = v_code,
      parent_team_id = p_parent_team_id,
      description = v_description,
      metadata = v_metadata,
      is_active = coalesce(p_is_active, true)
    WHERE id = p_team_id
    RETURNING * INTO v_team;
  END IF;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
  )
  VALUES (
    'user',
    v_actor.id,
    v_action,
    'team',
    v_team.id,
    v_before,
    jsonb_build_object(
      'name', v_team.name,
      'code', v_team.code,
      'parentTeamId', v_team.parent_team_id,
      'description', v_team.description,
      'metadata', v_team.metadata,
      'isActive', v_team.is_active
    ),
    p_request_id
  );

  RETURN jsonb_build_object(
    'id', v_team.id,
    'name', v_team.name,
    'code', v_team.code,
    'parentTeamId', v_team.parent_team_id,
    'description', v_team.description,
    'metadata', v_team.metadata,
    'isActive', v_team.is_active,
    'updatedAt', v_team.updated_at,
    'createdAt', v_team.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_upsert_team(UUID, UUID, TEXT, TEXT, UUID, TEXT, JSONB, BOOLEAN, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_upsert_team(UUID, UUID, TEXT, TEXT, UUID, TEXT, JSONB, BOOLEAN, UUID)
  TO project_admin;

CREATE OR REPLACE FUNCTION public.admin_update_employee(
  p_actor_auth_user_id UUID,
  p_employee_id UUID,
  p_employee_code TEXT,
  p_team_id UUID,
  p_team_ids UUID[],
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
  v_team_ids UUID[] := COALESCE(p_team_ids, ARRAY[p_team_id]::uuid[]);
  v_old_primary_team_id UUID;
  v_old_team_ids UUID[];
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

  SELECT ARRAY(
    SELECT DISTINCT selected.team_id
    FROM unnest(v_team_ids) AS selected(team_id)
    WHERE selected.team_id IS NOT NULL
    ORDER BY selected.team_id
  ) INTO v_team_ids;

  IF length(v_employee_code) < 2 OR length(v_employee_code) > 64
    OR v_account_status NOT IN ('active', 'disabled', 'terminated')
    OR length(v_position_title) > 120
    OR length(v_level_name) > 120
    OR p_team_id IS NULL
    OR NOT p_team_id = ANY(v_team_ids) THEN
    RAISE EXCEPTION 'Invalid employee management input.' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM unnest(v_team_ids) AS selected(team_id)
    LEFT JOIN public.teams AS team ON team.id = selected.team_id AND team.is_active = true
    WHERE team.id IS NULL
  ) THEN
    RAISE EXCEPTION 'Select active teams.' USING ERRCODE = '23503';
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

  SELECT ARRAY(
    SELECT team_id
    FROM public.team_memberships
    WHERE employee_id = p_employee_id
      AND is_active = true
    ORDER BY team_id
  ) INTO v_old_team_ids;

  IF v_target.employee_code IS DISTINCT FROM v_employee_code THEN
    v_changed_fields := array_append(v_changed_fields, 'employeeCode');
  END IF;
  IF v_old_primary_team_id IS DISTINCT FROM p_team_id THEN
    v_changed_fields := array_append(v_changed_fields, 'teamId');
  END IF;
  IF COALESCE(v_old_team_ids, ARRAY[]::uuid[]) IS DISTINCT FROM v_team_ids THEN
    v_changed_fields := array_append(v_changed_fields, 'teamIds');
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
    'teamIds', COALESCE(v_old_team_ids, ARRAY[]::uuid[]),
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
  SET is_primary = false, is_active = false
  WHERE employee_id = p_employee_id
    AND NOT team_id = ANY(v_team_ids);

  UPDATE public.team_memberships
  SET is_primary = false
  WHERE employee_id = p_employee_id
    AND team_id <> p_team_id
    AND is_primary = true;

  INSERT INTO public.team_memberships (employee_id, team_id, is_primary, is_active)
  SELECT p_employee_id, selected.team_id, selected.team_id = p_team_id, true
  FROM unnest(v_team_ids) AS selected(team_id)
  ON CONFLICT (employee_id, team_id) DO UPDATE
  SET is_primary = EXCLUDED.is_primary, is_active = true;

  v_after := jsonb_build_object(
    'employeeCode', v_employee_code,
    'teamId', p_team_id,
    'teamIds', v_team_ids,
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

REVOKE ALL ON FUNCTION public.admin_update_employee(UUID, UUID, TEXT, UUID, UUID[], UUID, UUID, TEXT, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_employee(UUID, UUID, TEXT, UUID, UUID[], UUID, UUID, TEXT, TEXT, TEXT, UUID)
  TO project_admin;
