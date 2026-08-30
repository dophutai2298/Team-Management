INSERT INTO public.allowed_email_domains (domain, is_active)
VALUES ('seed.example.com', true)
ON CONFLICT (domain) DO UPDATE
SET is_active = true;

WITH team_seed(id, name, code, parent_code, description) AS (
  VALUES
    ('30000000-0000-4000-8000-000000000001'::uuid, 'Demo Executive Office', 'DEMO-EXEC', NULL, 'Seed root team for organization hierarchy testing.'),
    ('30000000-0000-4000-8000-000000000002'::uuid, 'Demo Engineering', 'DEMO-ENG', 'DEMO-EXEC', 'Engineering department seed data.'),
    ('30000000-0000-4000-8000-000000000003'::uuid, 'Demo Product', 'DEMO-PROD', 'DEMO-EXEC', 'Product department seed data.'),
    ('30000000-0000-4000-8000-000000000004'::uuid, 'Demo Operations', 'DEMO-OPS', 'DEMO-EXEC', 'Operations department seed data.'),
    ('30000000-0000-4000-8000-000000000005'::uuid, 'Demo Sales Success', 'DEMO-SALES', 'DEMO-EXEC', 'Sales and customer success seed data.'),
    ('30000000-0000-4000-8000-000000000006'::uuid, 'Demo Platform Team', 'DEMO-PLAT', 'DEMO-ENG', 'Platform delivery team seed data.'),
    ('30000000-0000-4000-8000-000000000007'::uuid, 'Demo Web Experience Team', 'DEMO-WEB', 'DEMO-ENG', 'Web application team seed data.'),
    ('30000000-0000-4000-8000-000000000008'::uuid, 'Demo Product Discovery Team', 'DEMO-DISC', 'DEMO-PROD', 'Product discovery team seed data.'),
    ('30000000-0000-4000-8000-000000000009'::uuid, 'Demo Delivery Ops Team', 'DEMO-DOPS', 'DEMO-OPS', 'Delivery operations team seed data.'),
    ('30000000-0000-4000-8000-000000000010'::uuid, 'Demo Customer Success Team', 'DEMO-CS', 'DEMO-SALES', 'Customer success team seed data.')
)
INSERT INTO public.teams (id, name, code, parent_team_id, description, metadata, is_active)
SELECT
  seed.id,
  seed.name,
  seed.code,
  parent.id,
  seed.description,
  jsonb_build_object('seed', 'demo-organization', 'createdFor', 'issues-01-07'),
  true
FROM team_seed AS seed
LEFT JOIN public.teams AS parent ON parent.code = seed.parent_code
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_team_id = EXCLUDED.parent_team_id,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  is_active = true;

WITH employee_seed(
  employee_id,
  auth_user_id,
  email,
  full_name,
  employee_code,
  role_slug,
  manager_employee_code,
  primary_team_code,
  position_title,
  level_name,
  locale,
  phone,
  hometown
) AS (
  VALUES
    ('40000000-0000-4000-8000-000000000001'::uuid, '50000000-0000-4000-8000-000000000001'::uuid, 'linh.nguyen@seed.example.com', 'Linh Nguyen', 'DEMO001', 'system-admin', NULL, 'DEMO-EXEC', 'Director of Internal Systems', 'L7', 'vi', '+84 900 000 001', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000002'::uuid, '50000000-0000-4000-8000-000000000002'::uuid, 'minh.tran@seed.example.com', 'Minh Tran', 'DEMO002', 'department-head', 'DEMO001', 'DEMO-ENG', 'Head of Engineering', 'L6', 'vi', '+84 900 000 002', 'Da Nang'),
    ('40000000-0000-4000-8000-000000000003'::uuid, '50000000-0000-4000-8000-000000000003'::uuid, 'anh.pham@seed.example.com', 'Anh Pham', 'DEMO003', 'department-head', 'DEMO001', 'DEMO-PROD', 'Head of Product', 'L6', 'vi', '+84 900 000 003', 'Ha Noi'),
    ('40000000-0000-4000-8000-000000000004'::uuid, '50000000-0000-4000-8000-000000000004'::uuid, 'bao.le@seed.example.com', 'Bao Le', 'DEMO004', 'department-head', 'DEMO001', 'DEMO-OPS', 'Head of Operations', 'L6', 'en', '+84 900 000 004', 'Can Tho'),
    ('40000000-0000-4000-8000-000000000005'::uuid, '50000000-0000-4000-8000-000000000005'::uuid, 'chi.vo@seed.example.com', 'Chi Vo', 'DEMO005', 'department-head', 'DEMO001', 'DEMO-SALES', 'Head of Customer Growth', 'L6', 'vi', '+84 900 000 005', 'Hue'),
    ('40000000-0000-4000-8000-000000000006'::uuid, '50000000-0000-4000-8000-000000000006'::uuid, 'duy.ho@seed.example.com', 'Duy Ho', 'DEMO006', 'team-leader', 'DEMO002', 'DEMO-PLAT', 'Platform Team Lead', 'L5', 'vi', '+84 900 000 006', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000007'::uuid, '50000000-0000-4000-8000-000000000007'::uuid, 'giang.do@seed.example.com', 'Giang Do', 'DEMO007', 'team-leader', 'DEMO002', 'DEMO-WEB', 'Web Experience Lead', 'L5', 'en', '+84 900 000 007', 'Da Nang'),
    ('40000000-0000-4000-8000-000000000008'::uuid, '50000000-0000-4000-8000-000000000008'::uuid, 'hanh.bui@seed.example.com', 'Hanh Bui', 'DEMO008', 'team-leader', 'DEMO003', 'DEMO-DISC', 'Discovery Team Lead', 'L5', 'vi', '+84 900 000 008', 'Nha Trang'),
    ('40000000-0000-4000-8000-000000000009'::uuid, '50000000-0000-4000-8000-000000000009'::uuid, 'khoa.nguyen@seed.example.com', 'Khoa Nguyen', 'DEMO009', 'team-leader', 'DEMO004', 'DEMO-DOPS', 'Delivery Ops Lead', 'L5', 'vi', '+84 900 000 009', 'Hai Phong'),
    ('40000000-0000-4000-8000-000000000010'::uuid, '50000000-0000-4000-8000-000000000010'::uuid, 'lan.truong@seed.example.com', 'Lan Truong', 'DEMO010', 'team-leader', 'DEMO005', 'DEMO-CS', 'Customer Success Lead', 'L5', 'en', '+84 900 000 010', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000011'::uuid, '50000000-0000-4000-8000-000000000011'::uuid, 'mai.dang@seed.example.com', 'Mai Dang', 'DEMO011', 'employee', 'DEMO006', 'DEMO-PLAT', 'Backend Engineer', 'L3', 'vi', '+84 900 000 011', 'Quang Nam'),
    ('40000000-0000-4000-8000-000000000012'::uuid, '50000000-0000-4000-8000-000000000012'::uuid, 'nam.vo@seed.example.com', 'Nam Vo', 'DEMO012', 'employee', 'DEMO006', 'DEMO-PLAT', 'Infrastructure Engineer', 'L3', 'en', '+84 900 000 012', 'Da Nang'),
    ('40000000-0000-4000-8000-000000000013'::uuid, '50000000-0000-4000-8000-000000000013'::uuid, 'oanh.ly@seed.example.com', 'Oanh Ly', 'DEMO013', 'employee', 'DEMO006', 'DEMO-PLAT', 'Data Engineer', 'L4', 'vi', '+84 900 000 013', 'Binh Dinh'),
    ('40000000-0000-4000-8000-000000000014'::uuid, '50000000-0000-4000-8000-000000000014'::uuid, 'phuc.tran@seed.example.com', 'Phuc Tran', 'DEMO014', 'employee', 'DEMO007', 'DEMO-WEB', 'Frontend Engineer', 'L3', 'vi', '+84 900 000 014', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000015'::uuid, '50000000-0000-4000-8000-000000000015'::uuid, 'quyen.ngo@seed.example.com', 'Quyen Ngo', 'DEMO015', 'employee', 'DEMO007', 'DEMO-WEB', 'Design Engineer', 'L3', 'en', '+84 900 000 015', 'Ha Noi'),
    ('40000000-0000-4000-8000-000000000016'::uuid, '50000000-0000-4000-8000-000000000016'::uuid, 'son.le@seed.example.com', 'Son Le', 'DEMO016', 'employee', 'DEMO007', 'DEMO-WEB', 'QA Engineer', 'L2', 'vi', '+84 900 000 016', 'Vung Tau'),
    ('40000000-0000-4000-8000-000000000017'::uuid, '50000000-0000-4000-8000-000000000017'::uuid, 'tam.huynh@seed.example.com', 'Tam Huynh', 'DEMO017', 'employee', 'DEMO008', 'DEMO-DISC', 'Product Manager', 'L4', 'vi', '+84 900 000 017', 'Da Lat'),
    ('40000000-0000-4000-8000-000000000018'::uuid, '50000000-0000-4000-8000-000000000018'::uuid, 'uyen.pham@seed.example.com', 'Uyen Pham', 'DEMO018', 'employee', 'DEMO008', 'DEMO-DISC', 'UX Researcher', 'L3', 'en', '+84 900 000 018', 'Quy Nhon'),
    ('40000000-0000-4000-8000-000000000019'::uuid, '50000000-0000-4000-8000-000000000019'::uuid, 'viet.bui@seed.example.com', 'Viet Bui', 'DEMO019', 'employee', 'DEMO008', 'DEMO-DISC', 'Product Analyst', 'L3', 'vi', '+84 900 000 019', 'Ha Noi'),
    ('40000000-0000-4000-8000-000000000020'::uuid, '50000000-0000-4000-8000-000000000020'::uuid, 'xuan.dinh@seed.example.com', 'Xuan Dinh', 'DEMO020', 'employee', 'DEMO009', 'DEMO-DOPS', 'Delivery Coordinator', 'L3', 'vi', '+84 900 000 020', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000021'::uuid, '50000000-0000-4000-8000-000000000021'::uuid, 'yen.luu@seed.example.com', 'Yen Luu', 'DEMO021', 'employee', 'DEMO009', 'DEMO-DOPS', 'People Operations Specialist', 'L3', 'en', '+84 900 000 021', 'Can Tho'),
    ('40000000-0000-4000-8000-000000000022'::uuid, '50000000-0000-4000-8000-000000000022'::uuid, 'hai.nguyen@seed.example.com', 'Hai Nguyen', 'DEMO022', 'employee', 'DEMO009', 'DEMO-DOPS', 'Process Analyst', 'L2', 'vi', '+84 900 000 022', 'Da Nang'),
    ('40000000-0000-4000-8000-000000000023'::uuid, '50000000-0000-4000-8000-000000000023'::uuid, 'nhi.tran@seed.example.com', 'Nhi Tran', 'DEMO023', 'employee', 'DEMO010', 'DEMO-CS', 'Customer Success Manager', 'L4', 'vi', '+84 900 000 023', 'Hue'),
    ('40000000-0000-4000-8000-000000000024'::uuid, '50000000-0000-4000-8000-000000000024'::uuid, 'long.pham@seed.example.com', 'Long Pham', 'DEMO024', 'employee', 'DEMO010', 'DEMO-CS', 'Implementation Specialist', 'L3', 'en', '+84 900 000 024', 'Ho Chi Minh City'),
    ('40000000-0000-4000-8000-000000000025'::uuid, '50000000-0000-4000-8000-000000000025'::uuid, 'thao.do@seed.example.com', 'Thao Do', 'DEMO025', 'employee', 'DEMO010', 'DEMO-CS', 'Support Operations Analyst', 'L2', 'vi', '+84 900 000 025', 'Bien Hoa')
),
auth_seed AS (
  INSERT INTO auth.users (id, email, email_verified, profile, metadata, is_project_admin, is_anonymous)
  SELECT
    auth_user_id,
    email,
    true,
    jsonb_build_object('name', full_name),
    jsonb_build_object('seed', 'demo-organization'),
    false,
    false
  FROM employee_seed
  ON CONFLICT (email) DO UPDATE
  SET
    email_verified = true,
    profile = auth.users.profile || EXCLUDED.profile,
    metadata = auth.users.metadata || EXCLUDED.metadata
  RETURNING id, email
),
role_ids AS (
  SELECT slug, id FROM public.roles WHERE slug IN ('system-admin', 'department-head', 'team-leader', 'employee')
)
INSERT INTO public.employees (
  id,
  auth_user_id,
  email,
  full_name,
  employee_code_claim,
  employee_code,
  account_status,
  locale,
  reports_to_employee_id,
  primary_role_id,
  position_title,
  level_name,
  phone,
  hometown,
  timezone
)
SELECT
  seed.employee_id,
  seed.auth_user_id,
  seed.email,
  seed.full_name,
  seed.employee_code,
  seed.employee_code,
  'active',
  seed.locale,
  manager.employee_id,
  role_ids.id,
  seed.position_title,
  seed.level_name,
  seed.phone,
  seed.hometown,
  'Asia/Saigon'
FROM employee_seed AS seed
INNER JOIN auth_seed ON auth_seed.id = seed.auth_user_id
INNER JOIN role_ids ON role_ids.slug = seed.role_slug
LEFT JOIN employee_seed AS manager ON manager.employee_code = seed.manager_employee_code
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  employee_code_claim = EXCLUDED.employee_code_claim,
  employee_code = EXCLUDED.employee_code,
  account_status = EXCLUDED.account_status,
  locale = EXCLUDED.locale,
  reports_to_employee_id = EXCLUDED.reports_to_employee_id,
  primary_role_id = EXCLUDED.primary_role_id,
  position_title = EXCLUDED.position_title,
  level_name = EXCLUDED.level_name,
  phone = EXCLUDED.phone,
  hometown = EXCLUDED.hometown,
  timezone = EXCLUDED.timezone,
  rejection_reason = NULL,
  rejected_at = NULL;

WITH membership_seed(employee_code, team_code, is_primary, manager_employee_code, membership_title) AS (
  VALUES
    ('DEMO001', 'DEMO-EXEC', true, NULL, 'Executive owner'),
    ('DEMO002', 'DEMO-ENG', true, 'DEMO001', 'Department owner'),
    ('DEMO003', 'DEMO-PROD', true, 'DEMO001', 'Department owner'),
    ('DEMO004', 'DEMO-OPS', true, 'DEMO001', 'Department owner'),
    ('DEMO005', 'DEMO-SALES', true, 'DEMO001', 'Department owner'),
    ('DEMO006', 'DEMO-PLAT', true, 'DEMO002', 'Team owner'),
    ('DEMO007', 'DEMO-WEB', true, 'DEMO002', 'Team owner'),
    ('DEMO008', 'DEMO-DISC', true, 'DEMO003', 'Team owner'),
    ('DEMO009', 'DEMO-DOPS', true, 'DEMO004', 'Team owner'),
    ('DEMO010', 'DEMO-CS', true, 'DEMO005', 'Team owner'),
    ('DEMO011', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO012', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO013', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO014', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO015', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO016', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO017', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO018', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO019', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO020', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO021', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO022', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO023', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO024', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO025', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO013', 'DEMO-DISC', false, 'DEMO008', 'Cross-functional analytics partner'),
    ('DEMO015', 'DEMO-DISC', false, 'DEMO008', 'Design partner'),
    ('DEMO020', 'DEMO-CS', false, 'DEMO010', 'Delivery partner')
),
resolved_memberships AS (
  SELECT
    employee.id AS employee_id,
    team.id AS team_id,
    seed.is_primary,
    manager.id AS manager_employee_id,
    seed.membership_title
  FROM membership_seed AS seed
  INNER JOIN public.employees AS employee ON employee.employee_code = seed.employee_code
  INNER JOIN public.teams AS team ON team.code = seed.team_code
  LEFT JOIN public.employees AS manager ON manager.employee_code = seed.manager_employee_code
)
UPDATE public.team_memberships AS membership
SET is_primary = false
WHERE membership.employee_id IN (SELECT employee_id FROM resolved_memberships)
  AND membership.team_id NOT IN (
    SELECT team_id
    FROM resolved_memberships AS selected
    WHERE selected.employee_id = membership.employee_id
      AND selected.is_primary = true
  );

WITH membership_seed(employee_code, team_code, is_primary, manager_employee_code, membership_title) AS (
  VALUES
    ('DEMO001', 'DEMO-EXEC', true, NULL, 'Executive owner'),
    ('DEMO002', 'DEMO-ENG', true, 'DEMO001', 'Department owner'),
    ('DEMO003', 'DEMO-PROD', true, 'DEMO001', 'Department owner'),
    ('DEMO004', 'DEMO-OPS', true, 'DEMO001', 'Department owner'),
    ('DEMO005', 'DEMO-SALES', true, 'DEMO001', 'Department owner'),
    ('DEMO006', 'DEMO-PLAT', true, 'DEMO002', 'Team owner'),
    ('DEMO007', 'DEMO-WEB', true, 'DEMO002', 'Team owner'),
    ('DEMO008', 'DEMO-DISC', true, 'DEMO003', 'Team owner'),
    ('DEMO009', 'DEMO-DOPS', true, 'DEMO004', 'Team owner'),
    ('DEMO010', 'DEMO-CS', true, 'DEMO005', 'Team owner'),
    ('DEMO011', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO012', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO013', 'DEMO-PLAT', true, 'DEMO006', 'Core member'),
    ('DEMO014', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO015', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO016', 'DEMO-WEB', true, 'DEMO007', 'Core member'),
    ('DEMO017', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO018', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO019', 'DEMO-DISC', true, 'DEMO008', 'Core member'),
    ('DEMO020', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO021', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO022', 'DEMO-DOPS', true, 'DEMO009', 'Core member'),
    ('DEMO023', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO024', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO025', 'DEMO-CS', true, 'DEMO010', 'Core member'),
    ('DEMO013', 'DEMO-DISC', false, 'DEMO008', 'Cross-functional analytics partner'),
    ('DEMO015', 'DEMO-DISC', false, 'DEMO008', 'Design partner'),
    ('DEMO020', 'DEMO-CS', false, 'DEMO010', 'Delivery partner')
)
INSERT INTO public.team_memberships (employee_id, team_id, is_primary, is_active, manager_employee_id, membership_title, metadata)
SELECT
  employee.id,
  team.id,
  seed.is_primary,
  true,
  manager.id,
  seed.membership_title,
  jsonb_build_object('seed', 'demo-organization')
FROM membership_seed AS seed
INNER JOIN public.employees AS employee ON employee.employee_code = seed.employee_code
INNER JOIN public.teams AS team ON team.code = seed.team_code
LEFT JOIN public.employees AS manager ON manager.employee_code = seed.manager_employee_code
ON CONFLICT (employee_id, team_id) DO UPDATE
SET
  is_primary = EXCLUDED.is_primary,
  is_active = true,
  manager_employee_id = EXCLUDED.manager_employee_id,
  membership_title = EXCLUDED.membership_title,
  metadata = EXCLUDED.metadata;

WITH pending_seed(employee_id, auth_user_id, email, full_name, employee_code_claim, locale) AS (
  VALUES
    ('40000000-0000-4000-8000-000000000101'::uuid, '50000000-0000-4000-8000-000000000101'::uuid, 'pending.engineer@seed.example.com', 'Pending Engineer', 'PEND001', 'vi'),
    ('40000000-0000-4000-8000-000000000102'::uuid, '50000000-0000-4000-8000-000000000102'::uuid, 'pending.designer@seed.example.com', 'Pending Designer', 'PEND002', 'en'),
    ('40000000-0000-4000-8000-000000000103'::uuid, '50000000-0000-4000-8000-000000000103'::uuid, 'pending.operator@seed.example.com', 'Pending Operator', 'PEND003', 'vi')
),
auth_seed AS (
  INSERT INTO auth.users (id, email, email_verified, profile, metadata, is_project_admin, is_anonymous)
  SELECT
    auth_user_id,
    email,
    true,
    jsonb_build_object('name', full_name),
    jsonb_build_object('seed', 'demo-pending-accounts'),
    false,
    false
  FROM pending_seed
  ON CONFLICT (email) DO UPDATE
  SET
    email_verified = true,
    profile = auth.users.profile || EXCLUDED.profile,
    metadata = auth.users.metadata || EXCLUDED.metadata
  RETURNING id, email
)
INSERT INTO public.employees (
  id,
  auth_user_id,
  email,
  full_name,
  employee_code_claim,
  account_status,
  locale,
  timezone
)
SELECT
  seed.employee_id,
  seed.auth_user_id,
  seed.email,
  seed.full_name,
  seed.employee_code_claim,
  'pending_approval',
  seed.locale,
  'Asia/Saigon'
FROM pending_seed AS seed
INNER JOIN auth_seed ON auth_seed.id = seed.auth_user_id
ON CONFLICT (email) DO UPDATE
SET
  full_name = EXCLUDED.full_name,
  employee_code_claim = EXCLUDED.employee_code_claim,
  account_status = 'pending_approval',
  locale = EXCLUDED.locale,
  timezone = EXCLUDED.timezone,
  employee_code = NULL,
  reports_to_employee_id = NULL,
  primary_role_id = NULL,
  position_title = NULL,
  level_name = NULL,
  rejection_reason = NULL,
  rejected_at = NULL;
