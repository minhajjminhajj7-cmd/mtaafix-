# MtaaFix V8 — Simplified Department Workflow

## Operating model

MtaaFix now uses three actors only:

1. Citizen — reports and tracks infrastructure problems.
2. Department — receives automatically routed incidents and owns the operational response from review to resolution.
3. Super Admin — configures departments/report types, monitors the platform, corrects routing, archives invalid records and escalates delayed incidents by message or phone.

The separate Admin approval layer has been removed from the normal workflow.

## Incident workflow

Reported -> Reviewed -> Accepted -> In Progress -> Resolved

New reports are automatically routed using the selected problem type. Each problem type can now be mapped directly to a responsible department. Category routing remains as a backward-compatible fallback.

The department can review a new incident, accept responsibility, start work, upload photo/video progress evidence and resolve the incident with mandatory completion photo/video evidence.

The Super Admin does not approve department resolutions. It can re-route an incident when necessary, contact the responsible department, archive records and monitor critical or delayed work.

## Report type management

The Super Admin web portal contains a Report Types page. Problem types support create, read, update, deactivate/reactivate and safe permanent delete. A used problem type cannot be permanently deleted because historical citizen reports must remain valid; it should be deactivated instead.

Problem types include category, responsible department, default priority, description, safety message and emergency-contact recommendation.

## Database migration

Run this once on an existing V7 database:

```bash
PGOPTIONS='-c search_path=public' psql mtaafix -f backend/src/db/20261011_simplified_department_workflow.sql
```

The migration preserves existing incident/report data.
