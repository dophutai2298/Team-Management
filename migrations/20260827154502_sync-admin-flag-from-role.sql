CREATE OR REPLACE FUNCTION public.sync_employee_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  SELECT name = 'System Admin' AND is_active
  INTO NEW.is_admin
  FROM public.roles
  WHERE id = NEW.primary_role_id;

  NEW.is_admin := COALESCE(NEW.is_admin, false);
  RETURN NEW;
END;
$$;

CREATE TRIGGER employees_sync_admin_flag
  BEFORE INSERT OR UPDATE OF primary_role_id ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.sync_employee_admin_flag();

UPDATE public.employees AS employee
SET is_admin = role.name = 'System Admin' AND role.is_active
FROM public.roles AS role
WHERE role.id = employee.primary_role_id
  AND employee.is_admin IS DISTINCT FROM (role.name = 'System Admin' AND role.is_active);
