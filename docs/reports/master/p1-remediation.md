# P1 Remediation — High Priority

## P1-001: Bundle Size Optimization
- All web apps have vendor-react chunks >1.2MB
- Terra and Vessels additionally bundle mapbox-gl at 1.7MB
- **Action**: Add manual chunks, lazy-load map views, tree-shake chart libraries

## P1-002: Firestorm Route Consolidation
- 60+ routes, many decorative
- Some pages (XDR, forensics, SOAR) are presentational without real backend
- **Action**: Audit each route, mark decorative pages clearly, consolidate overlapping pages

## P1-003: Aegis Naming Drift
- Codebase uses "firestorm" directory name, product is "Aegis"
- **Action**: Align naming in user-facing copy (keep directory name for now)

## P1-004: Demo Data Labeling
- Many endpoints return seeded data without clear "Demo" labeling
- **Action**: Implement DataStateBadge consistently across all surfaces showing seeded data

## P1-005: Mobile Error/Loading/Empty States
- Mobile apps need systematic audit of error boundaries, loading skeletons, empty states
- **Action**: Audit each mobile app's state handling

## P1-006: Missing E2E Tests
- No automated E2E test suite exists
- **Action**: Create Playwright test suite for critical paths

## P1-007: Weak Copy / Generic CTAs
- Some pages have generic marketing copy
- **Action**: Rewrite with precise enterprise language

## P1-008: Accessibility Gaps
- No systematic a11y audit
- Heading hierarchy, focus management, ARIA labels likely incomplete
- **Action**: Priority a11y fixes on flagship surfaces (SZL Holdings, Lyte)
