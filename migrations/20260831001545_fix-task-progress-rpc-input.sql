DROP FUNCTION public.update_task_assignee_progress(UUID, UUID, TEXT, SMALLINT, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION public.update_task_assignee_progress(
  p_task_id UUID,
  p_employee_id UUID,
  p_status TEXT,
  p_progress INTEGER,
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

REVOKE ALL ON FUNCTION public.update_task_assignee_progress(UUID, UUID, TEXT, INTEGER, TEXT, UUID, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_task_assignee_progress(UUID, UUID, TEXT, INTEGER, TEXT, UUID, UUID)
  TO project_admin;
