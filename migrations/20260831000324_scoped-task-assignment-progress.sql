CREATE OR REPLACE FUNCTION public.refresh_assigned_task_rollup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_task_id UUID := COALESCE(NEW.task_id, OLD.task_id);
  v_assignee_count INTEGER;
  v_done_count INTEGER;
  v_cancelled_count INTEGER;
  v_blocked_count INTEGER;
  v_started_count INTEGER;
  v_progress SMALLINT;
  v_status TEXT;
BEGIN
  SELECT
    count(*),
    count(*) FILTER (WHERE status = 'done'),
    count(*) FILTER (WHERE status = 'cancelled'),
    count(*) FILTER (WHERE status = 'blocked'),
    count(*) FILTER (WHERE status = 'in_progress' OR progress > 0),
    COALESCE(round(avg(progress)), 0)::smallint
  INTO
    v_assignee_count,
    v_done_count,
    v_cancelled_count,
    v_blocked_count,
    v_started_count,
    v_progress
  FROM public.task_assignees
  WHERE task_id = v_task_id;

  v_status := CASE
    WHEN v_assignee_count = 0 THEN 'todo'
    WHEN v_done_count = v_assignee_count THEN 'done'
    WHEN v_cancelled_count = v_assignee_count THEN 'cancelled'
    WHEN v_blocked_count > 0 THEN 'blocked'
    WHEN v_started_count > 0 THEN 'in_progress'
    ELSE 'todo'
  END;

  UPDATE public.tasks
  SET progress = v_progress, status = v_status
  WHERE id = v_task_id
    AND task_type = 'assigned';

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER task_assignees_refresh_task_rollup
  AFTER INSERT OR UPDATE OF status, progress OR DELETE ON public.task_assignees
  FOR EACH ROW EXECUTE FUNCTION public.refresh_assigned_task_rollup();

CREATE OR REPLACE FUNCTION public.create_assigned_task(
  p_creator_employee_id UUID,
  p_team_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_due_date DATE,
  p_assignee_employee_ids UUID[],
  p_request_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_task_id UUID;
  v_assignee_ids UUID[];
  v_active_count INTEGER;
BEGIN
  SELECT array_agg(DISTINCT employee_id)
  INTO v_assignee_ids
  FROM unnest(p_assignee_employee_ids) AS input(employee_id);

  IF COALESCE(cardinality(v_assignee_ids), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one active assignee.' USING ERRCODE = '22023';
  END IF;

  SELECT count(*) INTO v_active_count
  FROM public.employees
  WHERE id = ANY(v_assignee_ids)
    AND account_status = 'active';

  IF v_active_count <> cardinality(v_assignee_ids) THEN
    RAISE EXCEPTION 'One or more assignees are not active.' USING ERRCODE = '23503';
  END IF;

  IF p_team_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'The selected team is not active.' USING ERRCODE = '23503';
  END IF;

  INSERT INTO public.tasks (
    task_type, title, description, creator_employee_id, assigner_employee_id, team_id, priority, due_date
  )
  VALUES (
    'assigned', p_title, p_description, p_creator_employee_id, p_creator_employee_id, p_team_id, p_priority, p_due_date
  )
  RETURNING id INTO v_task_id;

  INSERT INTO public.task_assignees (task_id, employee_id)
  SELECT v_task_id, employee_id FROM unnest(v_assignee_ids) AS input(employee_id);

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, after_data, request_id
  )
  VALUES (
    'user',
    p_creator_employee_id,
    'task.assigned',
    'task',
    v_task_id,
    jsonb_build_object('teamId', p_team_id, 'dueDate', p_due_date, 'assigneeEmployeeIds', to_jsonb(v_assignee_ids)),
    p_request_id
  );

  RETURN v_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_assigned_task(
  p_task_id UUID,
  p_actor_employee_id UUID,
  p_team_id UUID,
  p_title TEXT,
  p_description TEXT,
  p_priority TEXT,
  p_due_date DATE,
  p_assignee_employee_ids UUID[],
  p_request_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_assignee_ids UUID[];
  v_active_count INTEGER;
  v_before JSONB;
BEGIN
  SELECT array_agg(DISTINCT employee_id)
  INTO v_assignee_ids
  FROM unnest(p_assignee_employee_ids) AS input(employee_id);

  IF COALESCE(cardinality(v_assignee_ids), 0) = 0 THEN
    RAISE EXCEPTION 'Select at least one active assignee.' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object(
    'teamId', team_id,
    'dueDate', due_date,
    'assigneeEmployeeIds', COALESCE((SELECT jsonb_agg(employee_id ORDER BY employee_id) FROM public.task_assignees WHERE task_id = p_task_id), '[]'::jsonb)
  )
  INTO v_before
  FROM public.tasks
  WHERE id = p_task_id
    AND task_type = 'assigned'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Assigned task was not found.' USING ERRCODE = 'P0002';
  END IF;

  SELECT count(*) INTO v_active_count
  FROM public.employees
  WHERE id = ANY(v_assignee_ids)
    AND account_status = 'active';

  IF v_active_count <> cardinality(v_assignee_ids) THEN
    RAISE EXCEPTION 'One or more assignees are not active.' USING ERRCODE = '23503';
  END IF;

  IF p_team_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.teams WHERE id = p_team_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'The selected team is not active.' USING ERRCODE = '23503';
  END IF;

  UPDATE public.tasks
  SET title = p_title, description = p_description, priority = p_priority, due_date = p_due_date, team_id = p_team_id
  WHERE id = p_task_id;

  DELETE FROM public.task_assignees
  WHERE task_id = p_task_id
    AND employee_id <> ALL(v_assignee_ids);

  INSERT INTO public.task_assignees (task_id, employee_id)
  SELECT p_task_id, employee_id FROM unnest(v_assignee_ids) AS input(employee_id)
  ON CONFLICT (task_id, employee_id) DO NOTHING;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
  )
  VALUES (
    'user',
    p_actor_employee_id,
    'task.assignment_updated',
    'task',
    p_task_id,
    v_before,
    jsonb_build_object('teamId', p_team_id, 'dueDate', p_due_date, 'assigneeEmployeeIds', to_jsonb(v_assignee_ids)),
    p_request_id
  );

  RETURN p_task_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_task_assignee_progress(
  p_task_id UUID,
  p_employee_id UUID,
  p_status TEXT,
  p_progress SMALLINT,
  p_blocked_reason TEXT,
  p_actor_employee_id UUID,
  p_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_before JSONB;
BEGIN
  IF p_actor_employee_id <> p_employee_id THEN
    RAISE EXCEPTION 'Assignees can update only their own progress.' USING ERRCODE = '42501';
  END IF;

  IF p_status = 'done' AND p_progress <> 100 THEN
    RAISE EXCEPTION 'Completed work must have 100 percent progress.' USING ERRCODE = '22023';
  END IF;

  IF p_status = 'blocked' AND length(btrim(COALESCE(p_blocked_reason, ''))) < 3 THEN
    RAISE EXCEPTION 'A blocked task needs a reason.' USING ERRCODE = '22023';
  END IF;

  SELECT jsonb_build_object('status', status, 'progress', progress, 'blockedReason', blocked_reason)
  INTO v_before
  FROM public.task_assignees
  WHERE task_id = p_task_id
    AND employee_id = p_employee_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.task_assignees
  SET status = p_status, progress = p_progress, blocked_reason = p_blocked_reason
  WHERE task_id = p_task_id
    AND employee_id = p_employee_id;

  INSERT INTO public.account_audit_events (
    actor_type, actor_employee_id, action, resource, resource_id, before_data, after_data, request_id
  )
  VALUES (
    'user',
    p_actor_employee_id,
    'task.assignee_progress_updated',
    'task',
    p_task_id,
    v_before,
    jsonb_build_object('employeeId', p_employee_id, 'status', p_status, 'progress', p_progress, 'blockedReason', p_blocked_reason),
    p_request_id
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.create_assigned_task(UUID, UUID, TEXT, TEXT, TEXT, DATE, UUID[], UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_assigned_task(UUID, UUID, UUID, TEXT, TEXT, TEXT, DATE, UUID[], UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_task_assignee_progress(UUID, UUID, TEXT, SMALLINT, TEXT, UUID, UUID)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_assigned_task(UUID, UUID, TEXT, TEXT, TEXT, DATE, UUID[], UUID)
  TO project_admin;
GRANT EXECUTE ON FUNCTION public.update_assigned_task(UUID, UUID, UUID, TEXT, TEXT, TEXT, DATE, UUID[], UUID)
  TO project_admin;
GRANT EXECUTE ON FUNCTION public.update_task_assignee_progress(UUID, UUID, TEXT, SMALLINT, TEXT, UUID, UUID)
  TO project_admin;
