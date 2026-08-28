ALTER TABLE public.employees
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN reports_to_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  ADD COLUMN primary_role_id UUID,
  ADD COLUMN position_title TEXT,
  ADD COLUMN level_name TEXT,
  ADD COLUMN rejection_reason TEXT,
  ADD COLUMN rejected_at TIMESTAMPTZ;

CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT teams_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT teams_code_not_blank CHECK (length(btrim(code)) > 0)
);

CREATE UNIQUE INDEX teams_name_key ON public.teams (name);
CREATE UNIQUE INDEX teams_code_key ON public.teams (code);

CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT roles_name_not_blank CHECK (length(btrim(name)) > 0)
);

CREATE UNIQUE INDEX roles_name_key ON public.roles (name);

INSERT INTO public.roles (name, description, is_system)
VALUES
  ('System Admin', 'Full administrative access.', true),
  ('Department Head', 'Leads a department.', true),
  ('Team Leader', 'Leads a delivery team.', true),
  ('Employee', 'Standard employee access.', true);

ALTER TABLE public.employees
  ADD CONSTRAINT employees_primary_role_id_fkey
  FOREIGN KEY (primary_role_id) REFERENCES public.roles(id) ON DELETE RESTRICT;

CREATE INDEX employees_reports_to_employee_id_idx
  ON public.employees (reports_to_employee_id);
CREATE INDEX employees_primary_role_id_idx ON public.employees (primary_role_id);

CREATE TABLE public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE RESTRICT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT team_memberships_employee_team_key UNIQUE (employee_id, team_id)
);

CREATE UNIQUE INDEX team_memberships_one_primary_team_key
  ON public.team_memberships (employee_id)
  WHERE is_primary AND is_active;
CREATE INDEX team_memberships_team_id_idx ON public.team_memberships (team_id);

CREATE TABLE public.account_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type TEXT NOT NULL,
  actor_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id UUID NOT NULL,
  before_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT account_audit_events_actor_type_check CHECK (actor_type IN ('user', 'system')),
  CONSTRAINT account_audit_events_action_not_blank CHECK (length(btrim(action)) > 0),
  CONSTRAINT account_audit_events_resource_not_blank CHECK (length(btrim(resource)) > 0)
);

CREATE INDEX account_audit_events_resource_created_at_idx
  ON public.account_audit_events (resource, resource_id, created_at DESC);
CREATE INDEX account_audit_events_actor_created_at_idx
  ON public.account_audit_events (actor_employee_id, created_at DESC);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_audit_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.teams FROM anon, authenticated;
REVOKE ALL ON TABLE public.roles FROM anon, authenticated;
REVOKE ALL ON TABLE public.team_memberships FROM anon, authenticated;
REVOKE ALL ON TABLE public.account_audit_events FROM anon, authenticated;

CREATE TRIGGER teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER team_memberships_updated_at
  BEFORE UPDATE ON public.team_memberships
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

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
  v_position_title TEXT := btrim(p_position_title);
  v_level_name TEXT := btrim(p_level_name);
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

  IF length(v_employee_code) < 2 OR length(v_position_title) = 0 OR length(v_level_name) = 0 THEN
    RAISE EXCEPTION 'Employee code, position, and level are required.' USING ERRCODE = '22023';
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

CREATE OR REPLACE FUNCTION public.reject_pending_employee(
  p_actor_auth_user_id UUID,
  p_employee_id UUID,
  p_reason TEXT,
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
  v_reason TEXT := btrim(p_reason);
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

  IF length(v_reason) < 3 THEN
    RAISE EXCEPTION 'Enter a rejection reason.' USING ERRCODE = '22023';
  END IF;

  UPDATE public.employees
  SET
    account_status = 'disabled',
    rejection_reason = v_reason,
    rejected_at = now()
  WHERE id = p_employee_id;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
  )
  VALUES (
    'user',
    v_actor.id,
    'account.rejected',
    'employee',
    p_employee_id,
    jsonb_build_object('accountStatus', v_target.account_status),
    jsonb_build_object('accountStatus', 'disabled', 'reason', v_reason),
    p_request_id
  );

  RETURN jsonb_build_object('id', p_employee_id, 'accountStatus', 'disabled');
END;
$$;

REVOKE ALL ON FUNCTION public.approve_pending_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_pending_employee(UUID, UUID, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_pending_employee(UUID, UUID, TEXT, UUID, UUID, UUID, TEXT, TEXT, UUID)
  TO project_admin;
GRANT EXECUTE ON FUNCTION public.reject_pending_employee(UUID, UUID, TEXT, UUID)
  TO project_admin;
