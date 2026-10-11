\set ON_ERROR_STOP on

-- MtaaFix V10 safe upgrade runner.
-- Re-runs only idempotent migrations so an existing V8/V9 database is kept intact.
\ir 20261011_v10_workflow_compatibility.sql
\ir 20261008_complete_scope.sql
\ir 20261010_operational_accountability.sql
\ir 20261011_simplified_department_workflow.sql
\ir 20261011_v10_completion_indexes.sql
