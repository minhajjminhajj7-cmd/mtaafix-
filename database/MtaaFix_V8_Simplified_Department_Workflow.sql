BEGIN;

-- MtaaFix V8: simplify the operating model to Citizen -> Department -> Resolution,
-- with Super Admin handling configuration, monitoring and escalation only.

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE problem_types
  ADD COLUMN IF NOT EXISTS authority_id INTEGER REFERENCES authorities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE incidents
  ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Seed each existing problem type with its current category routing department.
UPDATE problem_types pt
SET authority_id = rr.authority_id,
    updated_at = CURRENT_TIMESTAMP
FROM routing_rules rr
WHERE rr.category_id = pt.category_id
  AND rr.active = TRUE
  AND pt.authority_id IS NULL;

-- Clearer citizen-facing category names.
UPDATE categories SET name = 'Roads', description = 'Potholes, damaged roads and road obstructions', updated_at = CURRENT_TIMESTAMP WHERE id = 1;
UPDATE categories SET name = 'Water', description = 'Water leaks, burst pipes, flooding and water safety issues', updated_at = CURRENT_TIMESTAMP WHERE id = 2;
UPDATE categories SET name = 'Drainage & Sewage', description = 'Blocked drainage, overflowing drains, sewage and drainage flooding', updated_at = CURRENT_TIMESTAMP WHERE id = 3;
UPDATE categories SET name = 'Waste Management', description = 'Uncollected waste, illegal dumping and hazardous waste', updated_at = CURRENT_TIMESTAMP WHERE id = 4;
UPDATE categories SET name = 'Street Lighting & Electrical', description = 'Streetlights, electrical poles, exposed wires and electrical hazards', updated_at = CURRENT_TIMESTAMP WHERE id = 5;
UPDATE categories SET name = 'Other Infrastructure', description = 'Other physical community infrastructure issues', updated_at = CURRENT_TIMESTAMP WHERE id = 6;

CREATE INDEX IF NOT EXISTS idx_problem_types_authority_id ON problem_types(authority_id);
CREATE INDEX IF NOT EXISTS idx_problem_types_active ON problem_types(active);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(active);

-- The separate Admin role is no longer part of the portal workflow.
-- Any legacy admin account becomes a Super Admin account so existing access is not lost.
UPDATE users SET role = 'super_admin', updated_at = CURRENT_TIMESTAMP WHERE role = 'admin';

COMMIT;
