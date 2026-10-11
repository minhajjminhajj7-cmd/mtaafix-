# MtaaFix V5 — Moving Visuals + Flexible Location

Implemented 2026-10-09.

## Web
- Public landing page now explains what MtaaFix is and what it does before staff login.
- Landing hero cycles through Roads, Water, Drainage, Waste and Street Lighting every 2.5 seconds.
- Login card is locked in the exact center of the viewport.
- Login background cycles through the same five categories every 2.5 seconds with smooth fades.
- EN/SW toggle remains available.

## Mobile
- Onboarding includes the same five-category auto slideshow every 2.5 seconds.
- Citizen login includes a compact moving category slideshow.
- Reporting location now supports:
  - Use current GPS location
  - Search a location / landmark
  - Tap any point on an OpenStreetMap map
  - Confirm the selected map point
- The selected manual/map location is passed into the normal report workflow just like current GPS.

## Database
No database migration is required for V5.
