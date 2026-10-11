# MtaaFix V7 — Accountability & Workflow

Implemented on 2026-10-10.

## Web
- KPI cards for Active, Critical, In Progress, Awaiting Approval and Resolved now open filtered incident registers.
- Incident workflow records who reviewed, assigned, accepted, started work and approved resolution.
- Admin/Super Admin explicit Review action.
- Super Admin assignment/reassignment to a service provider.
- Service Provider must accept an assignment before starting work.
- Service Provider can upload in-progress photo/video evidence and notes.
- Service Provider can submit final resolution note + photo/video evidence.
- Admin/Super Admin can approve resolution or request more work.
- After resolution, Admin/Super Admin can upload final verification photo/video evidence.
- Incident detail page shows responsibility matrix, accountability trail, citizen evidence, progress evidence, provider resolution evidence and admin verification evidence.
- Landing page cards animate; How It Works uses a gradient surface.
- Web operations login supports email/phone + password and phone OTP.

## Mobile
- Splash now opens the login screen.
- Login keeps Continue as Guest and Track Report actions.
- Password login accepts email or phone.
- Phone OTP flow added.
- Detached/floating bottom navigation retained on citizen home.
- Citizen reporting accepts up to 5 photo/video files.
- Current GPS and manual map/search location selection remain supported.
- Citizen can delete their own report while its incident is still Open/Under Review.
- Tracking shows Reported → Under Review → Assigned → In Progress → Resolution Submitted → Resolved and identifies the responsible actors where available.

## OTP delivery
The OTP flow is fully implemented. In development, if no SMS gateway is configured, the code is logged by the backend and returned as `developmentOtp` for prototype testing. For real SMS delivery set `SMS_GATEWAY_URL` and optionally `SMS_GATEWAY_TOKEN` in backend `.env` for a gateway accepting JSON `{ "to": "+255...", "message": "..." }`.

## Database migration
Existing databases should run:

`backend/src/db/20261010_operational_accountability.sql`

The upgraded full database SQL also contains this migration for fresh restores.
