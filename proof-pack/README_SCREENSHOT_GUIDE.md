# Screenshot Guide — Rules for Future Refreshes

**Date:** 2026-04-25  
**Applies to:** All screenshots in `docs/assets/screenshots/current/`

---

## When to Refresh

| Trigger | Action |
|---------|--------|
| Major UI overhaul (new design system, color scheme) | Full refresh of all surfaces |
| New artifact or major route added | Capture new surfaces; don't remove old |
| Quarterly investor deck update | Refresh hero shots and boardroom views |
| Stale caption mismatches README | Refresh affected surfaces |
| Pre-launch milestone | Full refresh, security review of all images |

**Do NOT refresh:** Individual components in isolation. Always capture full page at the recommended viewport.

---

## Naming Convention

```
{surface}-{view}-{date}--{viewport}.png
```

Examples:
```
a11oy-now-board-2026-04--desktop-1440.png
a11oy-workcell-detail-2026-04--desktop-1440.png
counsel-matter-list-2026-04--desktop-1280.png
```

**Date format:** `YYYY-MM` (month precision, not day)  
**Viewport:** `desktop-1440`, `laptop-1280`, `tablet-768`, `mobile-390`

---

## Required Viewports

| Surface type | Required viewports |
|-------------|-------------------|
| Primary investor shots | `desktop-1440`, `laptop-1280` |
| Mobile command (CORTEX) | `mobile-390` only |
| All other surfaces | `desktop-1440` minimum; `laptop-1280` recommended |

---

## Capture Procedure

1. **Start the full platform:** `pnpm start` — all services must be running
2. **Seed demo data:** `pnpm seed:demo` — ensures consistent, investor-safe data
3. **Run the capture script:** `pnpm capture:screens` (or `pnpm screenshots:proof` for A11oy)
4. **Review captures in `screenshots/raw/`** — this directory is gitignored
5. **Move approved captures to `docs/assets/screenshots/current/`**
6. **Update `proof-pack/CURRENT_SCREENSHOTS.md`** with the new index entry
7. **Update `proof-pack/SCREENSHOT_CAPTIONS.md`** if new surfaces were added

---

## Security Review Before Publishing

Before any screenshot is used in public-facing materials, verify:

- [ ] No real customer names, emails, or phone numbers visible
- [ ] No real org IDs visible in URL params or data tables
- [ ] No error messages containing stack traces, internal paths, or credentials
- [ ] No admin-only routes or internal tooling captured
- [ ] "Demo mode" label visible where appropriate
- [ ] No browser extensions, bookmarks bar, or system UI visible
- [ ] Full screen / presentation mode used for capture

---

## Raw vs. Approved

| Directory | Purpose | Gitignored? |
|-----------|---------|-------------|
| `screenshots/raw/` | Capture output, review in progress | ✓ Yes |
| `docs/assets/screenshots/current/` | Approved, indexed, public-ready | ✗ No (tracked) |
| `docs/assets/screenshots/archive/` | Prior approved captures, retained for reference | ✗ No (tracked) |

Move screenshots from `raw/` to `current/` only after completing the security review checklist above.

---

## Tools

| Tool | Command | Purpose |
|------|---------|---------|
| Capture all proof screenshots | `pnpm screenshots:proof` | A11oy + domain surfaces |
| Capture custom route | `pnpm capture:screens` | Manual capture script |
| Validate README assets | `pnpm validate:markdown-assets` | Check for broken image refs |

---

*Prepared by SZL Holdings — Task #3474 — 2026-04-25*
