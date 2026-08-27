CREATE TABLE public.allowed_email_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT allowed_email_domains_domain_format
    CHECK (domain = lower(domain) AND domain ~ '^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$')
);

CREATE UNIQUE INDEX allowed_email_domains_domain_key
  ON public.allowed_email_domains (domain);

CREATE TABLE public.registration_claims (
  auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_code_claim TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT registration_claims_email_format
    CHECK (email = lower(email))
);

CREATE UNIQUE INDEX registration_claims_email_key
  ON public.registration_claims (email);

CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE RESTRICT,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  employee_code_claim TEXT NOT NULL,
  employee_code TEXT,
  account_status TEXT NOT NULL DEFAULT 'pending_approval',
  locale TEXT NOT NULL DEFAULT 'vi',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT employees_email_format CHECK (email = lower(email)),
  CONSTRAINT employees_account_status_check
    CHECK (account_status IN ('pending_approval', 'active', 'disabled', 'terminated')),
  CONSTRAINT employees_locale_check CHECK (locale IN ('vi', 'en'))
);

CREATE UNIQUE INDEX employees_email_key ON public.employees (email);
CREATE UNIQUE INDEX employees_employee_code_key
  ON public.employees (employee_code)
  WHERE employee_code IS NOT NULL;
CREATE INDEX employees_account_status_idx ON public.employees (account_status);

ALTER TABLE public.allowed_email_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registration_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.allowed_email_domains FROM anon, authenticated;
REVOKE ALL ON TABLE public.registration_claims FROM anon, authenticated;
REVOKE ALL ON TABLE public.employees FROM anon, authenticated;
