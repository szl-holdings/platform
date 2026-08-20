# A11OY_SCREENSHOT_DOCTRINE.md — Screenshot Quality and Proof Rules

Screenshots are evidence. They are not illustrations, marketing assets, or decorative elements in documentation. A screenshot submitted as proof that a feature works must meet the quality bar defined here.

---

## Required Screenshot Qualities

Every screenshot submitted as proof must:

1. **Be a live, source-bound capture.** Taken from the running application at an exact 40-character source revision in a repository-controlled environment. Accepted environments include GitHub Actions, a protected preview deployment, an authenticated cloud development environment, or a local exact-head checkout. No vendor-specific workspace is mandatory. Not from a design tool, an unrelated static export, or a prior session.

2. **Show the correct surface.** The screenshot must display the exact route or UI surface that the associated patch modified. A screenshot of the wrong page does not prove the right page works.

3. **Show real or realistic demo data.** Seed data, demo data, and realistic placeholder data are acceptable. Text labeled "LOREM", "TODO", "PLACEHOLDER", "EXAMPLE DATA", or "YOUR TEXT HERE" is not acceptable.

4. **Bind the route and application frame.** Show browser chrome or an app frame when the capture method supports it. Headless captures are acceptable only with a metadata sidecar and catalog entry containing the exact route, viewport, source revision, capture environment, capture time, and screenshot SHA-256.

5. **Be stored with the correct naming convention.** Files go in `docs/assets/screenshots/current/`. Filename format: `{surface-name}-{YYYY-MM-DD}.jpg` (e.g., `a11oy-now-board-2026-04-25.jpg`).

6. **Have a corresponding catalog entry.** Every screenshot used as proof must have an entry in `audit/screenshot-catalog.md` with filename, route, capture date, capture environment, exact source revision, workflow run or command, viewport, screenshot SHA-256, capturing agent, and associated Workcell ID or task number.

7. **Show the application in a stable, loaded state.** No loading spinners, skeleton screens, or transitional states unless the patch specifically relates to loading or transition behavior.

---

## Accepted Capture Environments

A proof capture is environment-neutral but identity-strict. One of the following is acceptable:

1. **GitHub Actions** checking out the exact PR head or protected revision and uploading an immutable artifact.
2. **Protected preview deployment** whose served build identity is read back and equals the captured source revision.
3. **Authenticated cloud development environment** such as a Codespace or Cursor Cloud workspace pinned to the exact source revision.
4. **Local exact-head checkout** with the command, operating environment, source revision, and artifact digest recorded.

The provider is not the trust root. The trust root is the bound source revision, reproducible command or workflow, route, viewport, timestamp, and screenshot digest. A copied image without that identity is not current proof.

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
| `captured_by` | Named agent (e.g., PixelProof), GitHub Actions, or human contributor |
| `capture_environment` | `github-actions`, `protected-preview`, `codespace`, `cursor-cloud`, or `local-exact-head` |
| `source_revision` | Exact 40-character Git revision used for the running application |
| `workflow_run_or_command` | Immutable workflow run URL/ID or exact local capture command |
| `viewport` | Width and height used for the capture |
| `artifact_sha256` | SHA-256 of the committed screenshot bytes |
| `workcell_id` | Associated Workcell ID or task number |
| `proof_level` | The proof level this screenshot contributes to |
| `status` | `current` (valid) or `superseded` (replaced by a newer capture) |
| `notes` | Any relevant context (e.g., "captured after seed data reload", "demo mode active") |

---

## Screenshot Freshness Policy

Screenshots older than 30 days are considered stale and must be recaptured before being used as current proof. The Screenshot Freshness Score (tracked in Pathfinder Scan outputs) measures the percentage of screenshots that are within the freshness window.

A screenshot may be marked `superseded` when the surface it depicts has changed. Superseded screenshots are retained in the catalog for audit history but are not used as current proof.
