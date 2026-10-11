BEGIN;

-- MtaaFix V10 completion indexes.
-- These are safe, additive indexes for the operational dashboard, analytics,
-- automatic routing, tracking and duplicate checks.
CREATE INDEX IF NOT EXISTS idx_incidents_status_priority_updated
  ON incidents(status, priority, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_authority_status_updated
  ON incidents(authority_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_category_problem_status
  ON incidents(category_id, problem_type_id, status);

CREATE INDEX IF NOT EXISTS idx_incidents_resolved_at
  ON incidents(resolved_at DESC) WHERE resolved_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_user_created
  ON reports(user_id, created_at DESC) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reports_incident_created
  ON reports(incident_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_incident_history_actor_created
  ON incident_history(actor_user_id, created_at DESC) WHERE actor_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created
  ON notifications(user_id, is_read, created_at DESC);

COMMIT;
