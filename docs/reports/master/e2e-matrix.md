# E2E Test Matrix
**Generated:** 2026-04-03
**Phase:** Post-Payload Phase 6-7 — Readiness Gates + Automation Coverage

---

## Overview

This matrix documents the E2E test coverage for every active web application. Tests are organized by category: smoke tests, route tests, user journey tests, and mobile viewport tests.

---

## Coverage Legend

| Symbol | Meaning |
|--------|---------|
| PASS | Test implemented and passing |
| SKIP | Test conditionally skipped (element not found, optional path) |
| TODO | Not yet implemented |
| N/A | Not applicable for this app |

---

## SZL Holdings (`szl-holdings.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| Homepage loads without fatal errors | PASS | |
| Page title is set | PASS | |
| Main content section renders | PASS | |
| Navigation links present | PASS | |
| No error boundary visible | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | Homepage |
| `/about` | PASS | |
| `/ecosystem` | PASS | |
| `/contact` | PASS | |

### User Journey: Explore Portfolio
| Step | Status | Notes |
|------|--------|-------|
| Navigate from home to ecosystem | PASS (conditional) | Clicks if link visible |
| Navigate to contact from nav | PASS (conditional) | Clicks if link visible |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Homepage renders on mobile | PASS | |
| Mobile navigation accessible | PASS | |

---

## Lyte Command Center (`lyte.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads without fatal errors | PASS | |
| Page title is set | PASS | |
| Main content renders | PASS | |
| Nav/sidebar present | PASS | |
| Substantive content | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` (dashboard) | PASS | |
| `/dashboard` | PASS | |
| `/ai-ops` | PASS | |
| `/alerts` | PASS | |
| `/action-center` | PASS | |

### User Journey: Incident Triage
| Step | Status | Notes |
|------|--------|-------|
| View dashboard → navigate to alerts | PASS (conditional) | |
| Navigate from dashboard to action queue | PASS (conditional) | |
| AI ops page is reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Dashboard renders on mobile | PASS | |
| Mobile navigation accessible | PASS | |

---

## Aegis / Firestorm (`aegis.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads without fatal errors | PASS | |
| Main navigation renders | PASS | |
| Page title is set | PASS | |
| App shell renders | PASS | |
| Substantive content | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | |
| `/incidents` | PASS | |
| `/alerts` | PASS | |
| `/cases` | PASS | |
| `/findings` | PASS | |
| `/executive-risk` | PASS | |
| `/asset-inventory` | PASS | |

### User Journey: Incident Triage
| Step | Status | Notes |
|------|--------|-------|
| View incident queue | PASS (conditional) | |
| Navigate incidents → findings | PASS (conditional) | |
| Alert center reachable | PASS | |
| Executive risk page reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| SOC dashboard renders on mobile | PASS | |
| Incidents page renders on mobile | PASS | |

---

## Terra (`terra.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads successfully | PASS | |
| Page title is set | PASS | |
| Main content renders | PASS | |
| Portfolio content present | PASS | |
| Navigation links exist | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | |
| `/dashboard` | PASS | |
| `/deals` | PASS | |
| `/documents` | PASS | |
| `/analytics` | PASS | |
| `/executive-overview` | PASS | |
| `/climate-risk` | PASS | |

### User Journey: Browse Portfolio → View Asset → Create Action
| Step | Status | Notes |
|------|--------|-------|
| Home → deals page | PASS (conditional) | |
| Deals → analytics | PASS (conditional) | |
| Documents page reachable | PASS | |
| Climate risk page reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Homepage renders on mobile | PASS | |
| Deals page renders on mobile | PASS | |
| Executive overview renders on mobile | PASS | |

---

## Vessels (`vessels.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads without fatal errors | PASS | |
| Page title is set | PASS | |
| Main content renders | PASS | |
| Navigation present | PASS | |
| Substantive content | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | |
| `/fleet-dashboard` | PASS | |
| `/fleet-map` | PASS | |
| `/exceptions-center` | PASS | |
| `/alert-center` | PASS | |
| `/command-overview` | PASS | |
| `/document-engine` | PASS | |

### User Journey: Fleet Command Triage
| Step | Status | Notes |
|------|--------|-------|
| View fleet dashboard | PASS (conditional) | |
| Fleet dashboard → exceptions center | PASS (conditional) | |
| Fleet map loads | PASS | |
| Alert center reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Fleet dashboard renders on mobile | PASS | |
| Exceptions center renders on mobile | PASS | |

---

## Carlota Jo (`carlota-jo.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads without fatal errors | PASS | |
| Page title is set | PASS | |
| Main content renders | PASS | |
| Navigation links present | PASS | |
| Substantive content | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | |
| `/about` | PASS | |
| `/approach` | PASS | |
| `/booking` | PASS | |
| `/contact` | PASS | |
| `/founder` | PASS | |

### User Journey: Client Booking Flow
| Step | Status | Notes |
|------|--------|-------|
| Home → about | PASS (conditional) | |
| Home → booking | PASS (conditional) | |
| Booking form/CTA renders | PASS | |
| Contact page reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Homepage renders on mobile | PASS | |
| Booking page renders on mobile | PASS | |

---

## Stephen Lutar (`stephen-site.spec.ts`)

### Smoke Tests
| Test | Status | Notes |
|------|--------|-------|
| App loads without fatal errors | PASS | |
| Page title is set | PASS | |
| Main content renders | PASS | |
| Navigation links present | PASS | |
| Substantive content | PASS | |

### Route Smoke Tests
| Route | Status | Notes |
|-------|--------|-------|
| `/` | PASS | |
| `/about` | PASS | |
| `/contact` | PASS | |

### User Journey: Personal Brand Exploration
| Step | Status | Notes |
|------|--------|-------|
| Home → about | PASS (conditional) | |
| Contact page reachable | PASS | |

### Mobile Viewport (390×844)
| Test | Status | Notes |
|------|--------|-------|
| Homepage renders on mobile | PASS | |
| About page renders on mobile | PASS | |

---

## Coverage Summary

| App | Smoke Tests | Route Tests | Journey Tests | Mobile Tests | Total Tests |
|-----|------------|-------------|---------------|-------------|-------------|
| SZL Holdings | 5 | 4 | 2 | 2 | 13 |
| Lyte Command Center | 5 | 5 | 3 | 2 | 15 |
| Aegis | 5 | 7 | 4 | 2 | 18 |
| Terra | 5 | 7 | 4 | 3 | 19 |
| Vessels | 5 | 7 | 4 | 2 | 18 |
| Carlota Jo | 5 | 6 | 4 | 2 | 17 |
| Stephen Lutar | 5 | 3 | 2 | 2 | 12 |
| **Total** | **35** | **39** | **23** | **15** | **112** |

---

## Failure Artifact Capture

On any test failure, CI captures:
- **Screenshots:** `test-results/**/*.png` → artifact `playwright-screenshots-<app>`
- **Traces:** `test-results/` (`.zip` trace files) → artifact `playwright-traces-<app>`
- **HTML Reports:** `playwright-report/` → artifact `playwright-report-<app>` (always uploaded, 14-day retention)
- **JUnit XML:** `playwright-report/results.xml` (for CI dashboard integration)

Trace files can be opened with `playwright show-trace trace.zip` for step-by-step replay.

---

## CI Configuration

- All E2E tests run on: push and PR to `master`/`main`
- Matrix: 7 parallel jobs, one per app
- Browser: Chromium (desktop)
- Retry on failure: 2 retries in CI
- Timeout per test: 60 seconds
- Navigation timeout: 30 seconds
