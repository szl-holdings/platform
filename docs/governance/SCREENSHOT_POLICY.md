# Screenshot and Demo Asset Policy

> SZL Holdings Platform Governance · April 2026

---

## Purpose

This policy governs the creation, approval, storage, and retirement of screenshots and demo visual assets used in the SZL Holdings README, investor materials, org profile, and public communications.

---

## Approved Storage Locations

| Location | Purpose | Access |
|----------|---------|--------|
| `docs/assets/screenshots/current/` | All current, approved screenshots | Public (in repo) |
| `docs/assets/screenshots/archive/` | Retired screenshots (never deleted) | Public (in repo, historical) |
| `assets/readme/products/` | README-facing product screenshots | Public |
| `assets/readme/` | Architecture and brand assets | Public |

**Prohibited locations for approved screenshots:**
- Root directory
- `launch-shots/` (legacy; do not add new shots here)
- `attached_assets/` (gitignored payload dumps)

---

## Screenshot Standards

### Technical Requirements

| Requirement | Value |
|-------------|-------|
| Minimum resolution | 1440×900px |
| Preferred resolution | 2880×1800px (retina) |
| Format | JPEG at 85% quality |
| Color mode | Dark mode (except Carlota Jo — light mode) |
| Data state | Populated with demo seed data |
| Browser chrome | Hidden |
| Debug overlays | None |
| PII | None |

### Content Requirements

- Screenshots must show the current production or beta release
- All data shown must be seeded demo data — no real customer data
- No internal URLs, hostnames, or credentials visible
- No personally identifiable information (names, emails, phone numbers)
- No internal Slack/Notion/Linear screenshots without explicit approval
- Watermarks or confidential labels are optional for internal-only materials

---

## Screenshot Lifecycle

```
Capture → Review → Approve → Commit to current/ → Use in README/materials
                                                         ↓
                                               New version captured
                                                         ↓
                                       Old version moved to archive/
                                       README reference updated
```

---

## Approval Process

1. Capture screenshot per technical requirements above
2. Name file per convention: `{surface-slug}-{view-name}.jpg`
3. Place in `docs/assets/screenshots/current/`
4. Update README or material reference
5. Move previous version to `docs/assets/screenshots/archive/`
6. Commit with message: `docs(screenshots): update {surface} screenshot — {view-name}`

---

## Demo Asset Policy

Demo PDFs, carousel decks, and investor materials follow the same standards:
- Stored in `demo-assets/` (sensitive PDFs are gitignored per `.gitignore` rules)
- Never commit investor-specific pricing, term sheets, or contractual materials
- Demo scripts are stored in `docs/audit/DEMO_SCRIPT.md` and `docs/investor/DEMO_PATHS.md`

---

*SZL Holdings Platform Governance · April 2026*
