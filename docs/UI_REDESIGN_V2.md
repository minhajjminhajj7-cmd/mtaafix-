# MtaaFix Civic UI Redesign V2

Implemented 2026-10-08.

## Direction
The public experience is now intentionally warm and human rather than a generic dark SaaS dashboard. The visual language uses civic green, cream, warm gold, larger typography, hand-drawn community illustration, friendlier motion and less repetitive card geometry.

## Web
- New public landing page at `/` when signed out.
- Community hero illustration that explains reporting visually before login.
- Public sections for report categories and "how it works".
- Redesigned operations login with warm illustration-led layout.
- Portal-wide color migration away from navy/blue dominance.
- Larger operational typography and warmer dashboard header.
- Existing admin/provider workflow, maps, incident pages and permissions preserved.

## Mobile
- New warm splash identity.
- Illustration-led public onboarding.
- Guest report and report tracking promoted before sign-in.
- Redesigned citizen login.
- Redesigned signed-in home with community illustration, friendlier quick actions and floating navigation.
- Existing reporting/tracking/backend integration preserved.

## Local development
The package includes `backend/.env` for local development only. Replace the JWT secret before any non-local deployment.
