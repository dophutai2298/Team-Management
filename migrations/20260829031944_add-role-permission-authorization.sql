ALTER TABLE public.roles ADD COLUMN slug TEXT;

INSERT INTO public.roles (name, description, is_system, is_active)
VALUES
  ('System Admin', 'Full administrative access.', true, true),
  ('Department Head', 'Leads a department subtree.', true, true),
  ('Team Leader', 'Leads a team subtree.', true, true),
  ('Employee', 'Standard employee access.', true, true)
ON CONFLICT (name) DO UPDATE
SET
  description = EXCLUDED.description,
  is_system = true;

UPDATE public.roles
SET slug = CASE name
  WHEN 'System Admin' THEN 'system-admin'
  WHEN 'Department Head' THEN 'department-head'
  WHEN 'Team Leader' THEN 'team-leader'
  WHEN 'Employee' THEN 'employee'
  ELSE 'role-' || replace(id::text, '-', '')
END;

ALTER TABLE public.roles
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT roles_slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

CREATE UNIQUE INDEX roles_slug_key ON public.roles (slug);

CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT permissions_resource_check CHECK (
    resource IN (
      'account', 'employee', 'team', 'role', 'permission', 'task', 'calendar',
      'notification', 'todo', 'pomodoro', 'music', 'audit', 'dashboard'
    )
  ),
  CONSTRAINT permissions_action_check CHECK (
    action IN (
      'read', 'create', 'update', 'delete', 'approve', 'reject', 'disable',
      'activate', 'assign', 'comment', 'attach', 'manage_members'
    )
  ),
  CONSTRAINT permissions_scope_check CHECK (scope IN ('self', 'team', 'subtree', 'all')),
  CONSTRAINT permissions_resource_action_scope_key UNIQUE (resource, action, scope)
);

CREATE TABLE public.role_permissions (
  role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX role_permissions_permission_id_idx
  ON public.role_permissions (permission_id);

ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.permissions FROM anon, authenticated;
REVOKE ALL ON TABLE public.role_permissions FROM anon, authenticated;

CREATE TRIGGER permissions_updated_at
  BEFORE UPDATE ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

WITH resource_definitions(resource, actions, scopes) AS (
  VALUES
    ('account', ARRAY['read', 'approve', 'reject', 'disable', 'activate'], ARRAY['all']),
    ('employee', ARRAY['read', 'create', 'update', 'disable', 'activate'], ARRAY['self', 'team', 'subtree', 'all']),
    ('team', ARRAY['read', 'create', 'update', 'delete', 'manage_members'], ARRAY['team', 'subtree', 'all']),
    ('role', ARRAY['read', 'create', 'update', 'delete', 'assign'], ARRAY['all']),
    ('permission', ARRAY['read', 'assign'], ARRAY['all']),
    ('task', ARRAY['read', 'create', 'update', 'delete', 'assign', 'comment', 'attach'], ARRAY['self', 'team', 'subtree', 'all']),
    ('calendar', ARRAY['read', 'create', 'update', 'delete'], ARRAY['self', 'team', 'subtree', 'all']),
    ('notification', ARRAY['read', 'update'], ARRAY['self', 'all']),
    ('todo', ARRAY['read', 'create', 'update', 'delete'], ARRAY['self', 'all']),
    ('pomodoro', ARRAY['read', 'create', 'update', 'delete'], ARRAY['self', 'all']),
    ('music', ARRAY['read', 'create', 'update', 'delete'], ARRAY['all']),
    ('audit', ARRAY['read'], ARRAY['all']),
    ('dashboard', ARRAY['read'], ARRAY['self', 'subtree', 'all'])
)
INSERT INTO public.permissions (resource, action, scope)
SELECT definition.resource, action_name, scope_name
FROM resource_definitions AS definition
CROSS JOIN LATERAL unnest(definition.actions) AS action_name
CROSS JOIN LATERAL unnest(definition.scopes) AS scope_name
ON CONFLICT (resource, action, scope) DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM public.roles AS role
CROSS JOIN public.permissions AS permission
WHERE role.slug = 'system-admin'
  AND permission.scope = 'all'
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM public.roles AS role
CROSS JOIN public.permissions AS permission
WHERE role.slug IN ('employee', 'department-head', 'team-leader')
  AND (
    (permission.resource = 'employee' AND permission.scope = 'self' AND permission.action IN ('read', 'update'))
    OR (permission.resource = 'team' AND permission.scope = 'team' AND permission.action = 'read')
    OR (permission.resource = 'task' AND permission.scope = 'self' AND permission.action <> 'assign')
    OR (permission.resource = 'calendar' AND (
      permission.scope = 'self' OR (permission.scope = 'team' AND permission.action = 'read')
    ))
    OR (permission.resource IN ('notification', 'todo', 'pomodoro') AND permission.scope = 'self')
    OR (permission.resource = 'music' AND permission.scope = 'all' AND permission.action = 'read')
    OR (permission.resource = 'dashboard' AND permission.scope = 'self' AND permission.action = 'read')
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM public.roles AS role
CROSS JOIN public.permissions AS permission
WHERE role.slug IN ('department-head', 'team-leader')
  AND (
    (permission.resource = 'employee' AND (
      (permission.scope = 'subtree' AND permission.action IN ('read', 'update'))
      OR (permission.scope = 'team' AND permission.action = 'read')
    ))
    OR (permission.resource = 'team' AND permission.scope IN ('team', 'subtree') AND permission.action = 'read')
    OR (permission.resource IN ('role', 'permission') AND permission.scope = 'all' AND permission.action = 'read')
    OR (permission.resource IN ('task', 'calendar') AND permission.scope = 'subtree')
    OR (permission.resource = 'dashboard' AND permission.scope = 'subtree' AND permission.action = 'read')
  )
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_employee_descendant_ids(p_employee_id UUID)
RETURNS TABLE(employee_id UUID)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
  WITH RECURSIVE descendants(id) AS (
    SELECT employee.id
    FROM public.employees AS employee
    WHERE employee.reports_to_employee_id = p_employee_id

    UNION

    SELECT employee.id
    FROM public.employees AS employee
    INNER JOIN descendants ON employee.reports_to_employee_id = descendants.id
  )
  SELECT descendants.id AS employee_id
  FROM descendants;
$$;

REVOKE ALL ON FUNCTION public.get_employee_descendant_ids(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_employee_descendant_ids(UUID)
  TO project_admin;

CREATE OR REPLACE FUNCTION public.sync_employee_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM public.role_permissions AS role_permission
    INNER JOIN public.permissions AS permission ON permission.id = role_permission.permission_id
    WHERE role_permission.role_id = NEW.primary_role_id
      AND permission.resource = 'account'
      AND permission.action = 'approve'
      AND permission.scope = 'all'
      AND permission.is_active = true
  ) INTO NEW.is_admin;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_role_permission_admin_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_role_id UUID;
BEGIN
  v_role_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.role_id ELSE NEW.role_id END;

  UPDATE public.employees AS employee
  SET is_admin = EXISTS (
    SELECT 1
    FROM public.role_permissions AS role_permission
    INNER JOIN public.permissions AS permission ON permission.id = role_permission.permission_id
    WHERE role_permission.role_id = v_role_id
      AND permission.resource = 'account'
      AND permission.action = 'approve'
      AND permission.scope = 'all'
      AND permission.is_active = true
  )
  WHERE employee.primary_role_id = v_role_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER role_permissions_sync_admin_flags
  AFTER INSERT OR UPDATE OR DELETE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_role_permission_admin_flags();

CREATE OR REPLACE FUNCTION public.sync_permission_admin_flags()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  UPDATE public.employees AS employee
  SET is_admin = EXISTS (
    SELECT 1
    FROM public.role_permissions AS role_permission
    INNER JOIN public.permissions AS permission ON permission.id = role_permission.permission_id
    WHERE role_permission.role_id = employee.primary_role_id
      AND permission.resource = 'account'
      AND permission.action = 'approve'
      AND permission.scope = 'all'
      AND permission.is_active = true
  )
  WHERE employee.primary_role_id IN (
    SELECT role_permission.role_id
    FROM public.role_permissions AS role_permission
    WHERE role_permission.permission_id = NEW.id
  );

  RETURN NULL;
END;
$$;

CREATE TRIGGER permissions_sync_admin_flags
  AFTER UPDATE OF resource, action, scope, is_active ON public.permissions
  FOR EACH ROW EXECUTE FUNCTION public.sync_permission_admin_flags();

UPDATE public.employees AS employee
SET is_admin = EXISTS (
  SELECT 1
  FROM public.role_permissions AS role_permission
  INNER JOIN public.permissions AS permission ON permission.id = role_permission.permission_id
  WHERE role_permission.role_id = employee.primary_role_id
    AND permission.resource = 'account'
    AND permission.action = 'approve'
    AND permission.scope = 'all'
    AND permission.is_active = true
);
