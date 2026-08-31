CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  creator_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  assigner_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  progress SMALLINT NOT NULL DEFAULT 0,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT tasks_type_check CHECK (task_type IN ('personal', 'assigned')),
  CONSTRAINT tasks_title_check CHECK (length(btrim(title)) BETWEEN 2 AND 160),
  CONSTRAINT tasks_description_length_check CHECK (description IS NULL OR length(description) <= 2000),
  CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  CONSTRAINT tasks_progress_check CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT tasks_personal_assignment_check CHECK (
    task_type <> 'personal' OR (assigner_employee_id IS NULL AND team_id IS NULL)
  )
);

CREATE INDEX tasks_creator_updated_at_idx
  ON public.tasks (creator_employee_id, updated_at DESC);
CREATE INDEX tasks_team_updated_at_idx
  ON public.tasks (team_id, updated_at DESC)
  WHERE team_id IS NOT NULL;
CREATE INDEX tasks_type_updated_at_idx
  ON public.tasks (task_type, updated_at DESC);

CREATE TABLE public.task_assignees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'todo',
  progress SMALLINT NOT NULL DEFAULT 0,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_assignees_task_employee_key UNIQUE (task_id, employee_id),
  CONSTRAINT task_assignees_status_check CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'cancelled')),
  CONSTRAINT task_assignees_progress_check CHECK (progress BETWEEN 0 AND 100),
  CONSTRAINT task_assignees_blocked_reason_check CHECK (
    blocked_reason IS NULL OR length(blocked_reason) <= 1000
  )
);

CREATE INDEX task_assignees_employee_task_idx
  ON public.task_assignees (employee_id, task_id);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.tasks FROM anon, authenticated;
REVOKE ALL ON TABLE public.task_assignees FROM anon, authenticated;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER task_assignees_updated_at
  BEFORE UPDATE ON public.task_assignees
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();
