# SZL Holdings Ecosystem — Demo Screenshot Package

Captured April 16, 2026 for founder review and social media.

## Coverage Summary

| App | Folder | Screenshots | Notes |
|-----|--------|-------------|-------|
| SZL Holdings Dashboard | `szl-holdings/` | 7 | Home, Platform, Portfolio, App Ecosystem, Forge, Solutions: Aegis, Solutions: Vessels |
| Command Portal | `command/` | 3 | Home, Strategy Dashboard, Executive Briefing — API-connected live data |
| Aegis / Firestorm SOC | `aegis/` | 10 | Marketing + SOC dashboard + MITRE ATT&CK + Citadel War Room |
| Vessels Maritime | `vessels/` | 6 | Home, Fleet Dashboard, Map, Voyage Economics, Exceptions, Port Intel |
| Terra Real Estate | `terra/` | 5 | Home, Property Dashboard, Deal Flow, Market Analytics, Distress Engine |
| Carlota Jo Consulting | `carlota-jo/` | 5 | Home, Services, Approach, Who We Serve, Advisory Intel |
| Lyte Command Center | `lyte/` | — | Not captured: Replit workflow health-check conflict on port 19291 |
| CORTEX Mobile | `cortex-mobile/` | — | Not captured: native Expo app requires Expo Go on a physical/virtual device |

## Platform Constraints Noted

- **Lyte Command Center**: Workflow health-check on port 19291 fails in Replit environment when Vite process is launched as a secondary process. App is functional in the main development preview.
- **CORTEX Mobile**: React Native (Expo) app — Metro bundler serves bundles in hot-reload format incompatible with Headless Chrome. Screenshot via Expo Go QR code is required.
- **Mapbox/WebGL**: Fleet map page in Vessels shows WebGL initialization error in the screenshot environment. All other Vessels pages capture correctly.
- **Command Portal**: All pages require the API server to be running for live data. Strategy dashboard shows loading state. 3 high-quality screenshots captured.
