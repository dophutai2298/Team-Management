CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  author_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_comments_body_check CHECK (length(btrim(body)) BETWEEN 1 AND 2000)
);

CREATE INDEX task_comments_task_created_at_idx
  ON public.task_comments (task_id, created_at ASC);
CREATE INDEX task_comments_author_created_at_idx
  ON public.task_comments (author_employee_id, created_at DESC);

CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  uploader_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  bucket_name TEXT NOT NULL DEFAULT 'task-attachments',
  storage_key TEXT NOT NULL,
  storage_url TEXT,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  removed_at TIMESTAMPTZ,
  removed_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT task_attachments_storage_key_key UNIQUE (storage_key),
  CONSTRAINT task_attachments_bucket_not_blank CHECK (length(btrim(bucket_name)) > 0),
  CONSTRAINT task_attachments_file_name_check CHECK (length(btrim(file_name)) BETWEEN 1 AND 255),
  CONSTRAINT task_attachments_content_type_check CHECK (length(btrim(content_type)) BETWEEN 1 AND 255),
  CONSTRAINT task_attachments_file_size_check CHECK (file_size_bytes BETWEEN 1 AND 10485760),
  CONSTRAINT task_attachments_removed_by_check CHECK (
    (removed_at IS NULL AND removed_by_employee_id IS NULL)
    OR (removed_at IS NOT NULL AND removed_by_employee_id IS NOT NULL)
  )
);

CREATE INDEX task_attachments_task_created_at_idx
  ON public.task_attachments (task_id, created_at DESC)
  WHERE removed_at IS NULL;
CREATE INDEX task_attachments_uploader_created_at_idx
  ON public.task_attachments (uploader_employee_id, created_at DESC);

ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_attachments ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.task_comments FROM anon, authenticated;
REVOKE ALL ON TABLE public.task_attachments FROM anon, authenticated;

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON public.task_comments
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

CREATE TRIGGER task_attachments_updated_at
  BEFORE UPDATE ON public.task_attachments
  FOR EACH ROW EXECUTE FUNCTION system.update_updated_at();

