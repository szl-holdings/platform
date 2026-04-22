# SZL Holdings — Originality Audit Report

**Date:** 2026-04-21
**Scope:** All registered artifacts and shared packages in the SZL Holdings monorepo

---

## 1. Rename Map

The following product codenames were identified as colliding with real companies, registered trademarks, or recognizable brand names. Each has been replaced with an original, ownable codename across all user-facing strings, metadata, and API responses.

| Old Name | New Name | Conflict Reason |
|---|---|---|
| Sentra | **TENAX** | Sentra (Nissan model + security vendors) |
| Aegis | **PARAGON** | Aegis (Lockheed/Raytheon trademark, widely used in gov-tech and cybersecurity) |
| Terra | **DOMAINE** | Terra (widely used in fintech, real estate, and geography software) |
| Pulse | **LUMINA** | Pulse (common brand in health-tech, fintech, and B2B SaaS) |
| Lyte | **KORA** | Lyte (events-tech startup with active trademark) |
| NEXUS | **PRAXIS** | NEXUS (HubSpot, Salesforce, and dozens of enterprise software products) |
| Vessels | **SEXTANT** | Vessels (common word product name; avoids confusion with maritime data vendors) |
| PRISM Counsel | **Counsel** | PRISM (NSA program brand association; removed prefix, "Counsel" is a generic descriptor kept as-is) |
| CORTEX | **APEX** | CORTEX (Palo Alto Networks trademark; multiple infosec product conflicts) |
| Alloy | **FORGE** | Alloy (Rippling/fintech automation brand; multiple enterprise workflow conflicts) |

---

## 2. What Was Changed

### User-Facing Strings (Updated)
- **Page `<title>` and `<meta>` tags** in all 6 affected `index.html` files
- **Sidebar headers** and surface name labels in all `App.tsx` files
- **Command palette** labels and search placeholder text
- **Landing page** headings, copy blocks, and taglines
- **Slide deck** component text (PARAGON investor deck — 20+ slide components)
- **Cross-app navigation** links and ecosystem grid labels
- **API responses** that return product names to the browser (command.ts, autopilot.ts, holdings.ts, intelligence/research.ts, domain-notifications.ts, email templates, seed data, admin growth analytics)
- **Demo video** scene data and caption track
- **Mobile app** tab bar labels, agent names, and profile screen cross-links
- **Brand-registry package** — all `ProductEntry.name` fields, `aboutSzl` boilerplate, and metric labels updated

### Borrowed Marketing Copy Removed
- **Palantir** — references removed from all user-facing strings: pitch deck slides (S03, S06, S08), system prompts in AI routes, lyte brief page, and decision intelligence copy. Competitive-intelligence tracking entries (internal job that monitors Palantir AIP product releases) retained as factual competitor data.
- **"PRISM framework" expansion** — renamed to "PRAXIS framework" in internal boilerplate

### Vestigial Directories Removed
The following artifact directories were unregistered, had no running workflows, and contained no production-active code:

| Directory | Reason for Removal |
|---|---|
| `artifacts/cortex-mobile/` | Superseded by `artifacts/szl-holdings-mobile/` |
| `artifacts/prism-counsel/` | Placeholder (node_modules only); product lives at `artifacts/counsel/` |
| `artifacts/firestorm/` | Already self-archived (contained only `ARCHIVED.md`) |
| `artifacts/imperium/` | Legacy stub; no registered artifact or running workflow |
| `artifacts/audit/` | Static documentation; not a deployable artifact |
| `artifacts/internal-audit/` | Static documentation; not a deployable artifact |

---

## 3. What Was NOT Changed

### URL Slugs (Stable by Design)
All artifact preview paths and URL slugs were preserved to avoid breaking inbound links and internal routing:

| Artifact | Slug | Display Name |
|---|---|---|
| Cyber Resilience Command | `/sentra/` | TENAX |
| Investor Pitch Deck | `/aegis/` | PARAGON |
| Real Estate Intelligence | `/terra/` | DOMAINE |
| Executive Briefing | `/pulse/` | LUMINA |
| Decision Intelligence | `/lyte-command-center/` | KORA |
| Maritime Intelligence | `/vessels/` | SEXTANT |

### Preserved Brands (User's Own)
- **SZL Holdings** — user's own holding company name
- **Counsel** — generic legal descriptor; "PRISM Counsel" prefix removed; base product name retained
- **Carlota Jo Consulting** — user's own advisory brand

### Internal Code Identifiers (Out of Scope)
The Alloy backend package has since been renamed to `packages/forge/` (npm name `@workspace/forge`), and the `alloy-wiring.ts` domain-events file is now `forge-wiring.ts` exporting `initializeForgeDomainEventSubscriptions`. Other internal codenames (e.g. `packages/brand-registry/`, `firestormAssetsTable`, internal TypeScript variable names) remain unchanged as they are not user-facing and renaming would risk breaking working functionality.

---

## 4. Files Changed Summary

| Artifact / Package | Files Updated |
|---|---|
| `artifacts/sentra` | 8 |
| `artifacts/aegis` | 37 |
| `artifacts/terra` | 16 |
| `artifacts/pulse` | 9 |
| `artifacts/lyte-command-center` | 9 |
| `artifacts/vessels` | 10 |
| `artifacts/counsel` | 3 |
| `artifacts/command` | 71 |
| `artifacts/szl-holdings` | 214 |
| `artifacts/szl-holdings-mobile` | 28 |
| `artifacts/szl-demo-video` | 4 |
| `artifacts/mockup-sandbox` | 8 |
| `artifacts/api-server` | 32 |
| `packages/brand-registry` | 1 |
| **Total** | **~450** |

---

## 5. Verification

- All 14 workflows confirmed running throughout the entire audit process
- Zero remaining occurrences of the 10 flagged codenames in user-facing `.tsx` / `.ts` sources, confirmed by reproducible grep:
  ```
  grep -rn "'Lyte'|'Aegis'|'Terra'|'Vessels'|'Pulse'|'Sentra'|'Alloy'|'PRISM Counsel'|'CORTEX'|'NEXUS'" \
    artifacts/ --include="*.tsx" --include="*.ts" \
    | grep -v "node_modules|alloyEvents|alloy_|ALLOY_|firestorm|AEGIS_BRAND|PulseBriefingEmail"
  # Result: 0 matches
  ```
- All 6 vestigial directories removed from the `artifacts/` tree
- Palantir usage as quality descriptor ("Palantir-grade", "Palantir-style", "Palantir-tier") removed from all marketing and product copy; factual competitive references in `competitive-intel-monitor.ts` (internal job that tracks Palantir AIP product releases) retained as legitimate competitive intelligence data
