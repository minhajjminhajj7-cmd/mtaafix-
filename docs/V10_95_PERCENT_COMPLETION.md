# MtaaFix V10 - 95% Completion Build

## Purpose

V10 moves the project from feature development into completion, integration and testing. The scope is intentionally locked so the prototype can be demonstrated reliably rather than expanded with additional roles or approval layers.

## Final role model

### Citizen
Reports infrastructure problems, supplies photo/video evidence and a location, confirms possible duplicate incidents, and tracks progress.

### Responsible Department
Receives only incidents routed to its department. It reviews the report, accepts responsibility, starts work, uploads progress evidence and resolves the incident with final evidence.

### Super Admin
Manages departments, accounts, categories and problem types; monitors all incidents; corrects routing or priority; follows up on delays; views analytics; archives/restores records; and manages exceptions.

## Operational lifecycle

Reported -> Reviewed -> Accepted -> In Progress -> Resolved.

Every workflow action records the responsible actor and timestamp where supported by the database history model.

## Major V10 additions

1. Analytics API and web analytics page.
2. Department performance and overdue/SLA monitoring.
3. Live map filters and hotspot watch.
4. Super Admin incident CRUD/exception controls.
5. Department CRUD and portal-account management.
6. Category and problem-type CRUD.
7. Citizen duplicate-awareness UI and explicit same-problem attachment.
8. End-to-end image/video evidence paths.
9. Department progress and resolution evidence.
10. Super Admin follow-up messages delivered to department notifications.
11. Mobile tracking responsibility details.
12. Database indexes for common operational queries.
13. Automated V10 API verification script.
14. iOS/Android camera, microphone and location permission polish.

## Database upgrade

Keep the current database and run the safe V10 upgrade runner:

```bash
PGOPTIONS='-c search_path=public' psql mtaafix -f backend/src/db/20261011_v10_full_upgrade.sql
```

The runner safely re-applies the required idempotent scope, accountability, simplified-workflow and completion-index migrations. Do not drop the database.

## Verification

After starting the backend, run:

```bash
cd ~/development/mtaafix
./scripts/verify-v10.sh
```

The script checks health, category/problem-type coverage, routing configuration, Super Admin access, incident statistics, analytics, department access and notifications.

Then run the non-destructive operational workflow test (it creates a temporary manual incident and deletes it automatically after the test):

```bash
./scripts/verify-v10-workflow.sh
```

A final presentation sign-off should also manually test a citizen photo/video report, duplicate confirmation, automatic routing, department review/accept/start/progress/resolve, web video playback, analytics refresh, department creation/account management and Super Admin follow-up messaging.
