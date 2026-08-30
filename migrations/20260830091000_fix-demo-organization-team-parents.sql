WITH team_parent_seed(code, parent_code) AS (
  VALUES
    ('DEMO-EXEC', NULL),
    ('DEMO-ENG', 'DEMO-EXEC'),
    ('DEMO-PROD', 'DEMO-EXEC'),
    ('DEMO-OPS', 'DEMO-EXEC'),
    ('DEMO-SALES', 'DEMO-EXEC'),
    ('DEMO-PLAT', 'DEMO-ENG'),
    ('DEMO-WEB', 'DEMO-ENG'),
    ('DEMO-DISC', 'DEMO-PROD'),
    ('DEMO-DOPS', 'DEMO-OPS'),
    ('DEMO-CS', 'DEMO-SALES')
)
UPDATE public.teams AS team
SET parent_team_id = parent.id
FROM team_parent_seed AS seed
LEFT JOIN public.teams AS parent ON parent.code = seed.parent_code
WHERE team.code = seed.code
  AND team.parent_team_id IS DISTINCT FROM parent.id;
