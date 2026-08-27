ALTER TABLE public.registration_claims
  DROP CONSTRAINT registration_claims_pkey;

ALTER TABLE public.registration_claims
  ALTER COLUMN auth_user_id DROP NOT NULL;

DROP INDEX public.registration_claims_email_key;

ALTER TABLE public.registration_claims
  ADD PRIMARY KEY (email);

CREATE UNIQUE INDEX registration_claims_auth_user_id_key
  ON public.registration_claims (auth_user_id)
  WHERE auth_user_id IS NOT NULL;
