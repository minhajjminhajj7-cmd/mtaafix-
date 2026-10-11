# MtaaFix UI Translation — Heavy-Duty Public Service Direction

## Visual direction applied
The interface has been translated around three principles:
- TGSD-inspired clean search, information density, cards and register structure.
- GePG-inspired direct mobile navigation and low-friction public-service actions.
- e-Mrejesho-inspired report lifecycle visibility, tracking and authority workflow.

The resulting product direction is a Tanzanian smart-city infrastructure operations platform rather than a generic SaaS dashboard.

## Web portal changes
- Role-aware navigation for Super Admin/Admin vs Service Provider.
- Command Centre dashboard with operational header, KPI strip, urgent queue, workflow pulse and incident register.
- Provider dashboard wording focuses on assigned workload and field delivery.
- `resolution_submitted` is represented in incident filters/status UI.
- Provider incident workflow supports resolution image/video evidence selection.
- Admin approval uses dedicated approve-resolution endpoint.
- Request More Work uses the dedicated provider-return endpoint.
- Existing incident details, live map and provider management foundations are preserved.

## Mobile changes
- Onboarding is now action-first: Report, Track, or Sign In.
- Guest reporting is visually first-class rather than hidden behind account creation.
- Logged-in Home is simplified around Report, Track, My Reports and active incident visibility.
- Bottom navigation keeps the most important citizen actions one tap away.
- Tracking screen now renders the complete Reported -> Review -> Assigned -> In Progress -> Resolution Submitted -> Resolved workflow.
- Shared theme uses tighter radii, more institutional spacing and the navy/teal MtaaFix design system.

## Design system
- Navy `#0B2438`: institutional identity / command surfaces.
- Teal `#00A896` / `#087D72`: action and active state.
- Background `#F3F6F7`: operational workspace.
- Critical `#B93636`, warning/priority amber/orange, resolved green.
- White cards, thin borders, low shadow usage, compact status badges.

## Local validation
Backend JavaScript syntax checks passed for the core modified controllers/app in the working environment.

The extracted archive did not contain a complete runnable Vite dependency installation (`vite` executable missing), so the web production build should be rerun on the user's Mac after `npm install` using the existing project package files.

Flutter/Dart SDK was not available in the working environment, so run `flutter analyze` and `flutter run` locally before final presentation packaging.
