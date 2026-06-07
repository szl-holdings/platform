# A11OY_SCREENSHOT_DOCTRINE.md — Screenshot Quality and Proof Rules

Screenshots are evidence. They are not illustrations, marketing assets, or decorative elements in documentation. A screenshot submitted as proof that a feature works must meet the quality bar defined here.

---

## Required Screenshot Qualities

Every screenshot submitted as proof must:

1. **Be a live capture.** Taken from the running application in this Replit workspace using the PixelProof agent or equivalent live capture method. Not from a design tool, not from a static HTML file rendered outside the app, not from a prior session.

2. **Show the correct surface.** The screenshot must display the exact route or UI surface that the associated patch modified. A screenshot of the wrong page does not prove the right page works.

3. **Show real or realistic demo data.** Seed data, demo data, and realistic placeholder data are acceptable. Text labeled "LOREM", "TODO", "PLACEHOLDER", "EXAMPLE DATA", or "YOUR TEXT HERE" is not acceptable.

4. **Include a visible browser chrome or app frame.** The screenshot must be recognizable as a running application — not a cropped design or exported asset. The URL bar (or app route indicator for mobile) should be visible or noted in the catalog entry.

5. **Be stored with the correct naming convention.** Files go in `docs/assets/screenshots/current/`. Filename format: `{surface-name}-{YYYY-MM-DD}.jpg` (e.g., `a11oy-now-board-2026-04-25.jpg`).

6. **Have a corresponding catalog entry.** Every screenshot used as proof must have an entry in `audit/screenshot-catalog.md` with filename, route, capture date, capturing agent, and associated Workcell ID or task number.

7. **Show the application in a stable, loaded state.** No loading spinners, skeleton screens, or transitional states unless the patch specifically relates to loading or transition behavior.

---

## Blocked Screenshots

The following are explicitly prohibited as proof screenshots:

| Blocked Type | Reason |
|-------------|--------|
| Figma or design tool exports | Not a running application |
| Prior-session screenshots passed off as current | Must be fresh for the current patch |
| Screenshots taken before the patch was applied | Does not prove the patch works |
| Blank or white screen | Application is not running or has an error |
| Error page screenshot (for non-error patches) | Does not prove the feature works |
| Loading spinner screenshot (for non-loading patches) | Does not prove the feature works |
| Cropped/edited screenshots with text overlaid | Altered evidence is not evidence |
| Screenshots of the wrong route | Does not prove the patched surface |
| AI-generated or mocked images | Not a running application |

---

## Manifest Fields

Every entry in `audit/screenshot-catalog.md` must include:

| Field | Description |
|-------|-------------|
| `filename` | The filename as stored in `docs/assets/screenshots/current/` |
| `route` | The URL path or route name shown in the screenshot |
| `surface` | Human-readable name of the surface (e.g., "A11oy Now Board", "TENAX SOC Command") |
| `capture_date` | ISO 8601 date of capture |
| `captured_by` | Named agent (e.g., PixelProof) or human contributor |
| `workcell_id` | Associated Workcell ID or task number |
| `proof_level` | The proof level this screenshot contributes to |
| `status` | `current` (valid) or `superseded` (replaced by a newer capture) |
| `notes` | Any relevant context (e.g., "captured after seed data reload", "demo mode active") |

---

## Screenshot Freshness Policy

Screenshots older than 30 days are considered stale and must be recaptured before being used as current proof. The Screenshot Freshness Score (tracked in Pathfinder Scan outputs) measures the percentage of screenshots that are within the freshness window.

A screenshot may be marked `superseded` when the surface it depicts has changed. Superseded screenshots are retained in the catalog for audit history but are not used as current proof.
