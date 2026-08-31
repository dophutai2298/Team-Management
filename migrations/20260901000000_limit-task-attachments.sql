ALTER TABLE public.task_attachments
  DROP CONSTRAINT IF EXISTS task_attachments_file_size_check;

ALTER TABLE public.task_attachments
  ADD CONSTRAINT task_attachments_file_size_check
  CHECK (file_size_bytes BETWEEN 1 AND 2097152);

CREATE OR REPLACE FUNCTION public.enforce_task_attachment_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.removed_at IS NULL
    AND (
      SELECT count(*)
      FROM public.task_attachments
      WHERE task_id = NEW.task_id
        AND removed_at IS NULL
        AND id <> NEW.id
    ) >= 5
  THEN
    RAISE EXCEPTION 'Each task can have up to 5 attachments.'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS task_attachments_limit ON public.task_attachments;

CREATE TRIGGER task_attachments_limit
  BEFORE INSERT OR UPDATE OF task_id, removed_at ON public.task_attachments
  FOR EACH ROW EXECUTE FUNCTION public.enforce_task_attachment_limit();
