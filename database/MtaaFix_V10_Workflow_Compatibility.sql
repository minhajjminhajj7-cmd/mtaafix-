BEGIN;

-- V10 compatibility layer for older MtaaFix development databases.
-- Every change is additive/idempotent; existing data is preserved.

ALTER TABLE authorities
  ADD COLUMN IF NOT EXISTS contact_person VARCHAR(150),
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS authority_id INTEGER REFERENCES authorities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Collapse legacy operational roles into the V10 model.
-- Drop the older role constraint first so databases that only allowed admin/officer can migrate safely.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
UPDATE users SET role='super_admin', updated_at=CURRENT_TIMESTAMP WHERE role='admin';
UPDATE users SET role='service_provider', updated_at=CURRENT_TIMESTAMP WHERE role='officer';
ALTER TABLE users
  ADD CONSTRAINT users_role_check CHECK (role IN ('citizen','super_admin','service_provider'));

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS authority_id INTEGER REFERENCES authorities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS problem_type_id INTEGER REFERENCES problem_types(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS work_started_at TIMESTAMP WITHOUT TIME ZONE,
  ADD COLUMN IF NOT EXISTS resolution_note TEXT,
  ADD COLUMN IF NOT EXISTS resolution_submitted_at TIMESTAMP WITHOUT TIME ZONE;

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS problem_type_id INTEGER REFERENCES problem_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_authority_id ON users(authority_id);
CREATE INDEX IF NOT EXISTS idx_incidents_authority_id ON incidents(authority_id);
CREATE INDEX IF NOT EXISTS idx_incidents_problem_type_id ON incidents(problem_type_id);
CREATE INDEX IF NOT EXISTS idx_reports_problem_type_id ON reports(problem_type_id);

COMMIT;
