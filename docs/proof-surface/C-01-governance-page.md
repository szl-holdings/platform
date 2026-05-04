# Track C-01 — Public Governance Page (`szlholdings.com/governance`)

**Document ID:** PROOF-C-01
**Target route:** `/governance` on `artifacts/szl-holdings/`
**Purpose:** A single public, unauthenticated page where any procurement officer, Empire APEX reviewer, prime contractor, journalist, or researcher can read and download SZL Holdings' actual governance posture and audit evidence, *without an NDA*.

This page is the customer-facing index of the work in Track A and the entry point for the work in Track C-02.

---

## 1. Why a public governance page changes the procurement conversation

The default vendor pattern is "trust us; the details are in the data room." Government buyers and primes have learned to pattern-match on this and discount it. A public, durable, hash-anchored, dated governance page does three things:

1. Eliminates the "send me your security packet" round trip.
2. Lets reviewers triangulate against your prior posture (because the page is anchored at every change).
3. Shifts the burden of proof from the vendor making claims to the reviewer discovering exceptions.

## 2. Page sections (in order)

### 2.1 Hero

**Headline:** "Governance you can replay."

**Sub:** "Every decision our AI makes is anchored in an append-only evidence ledger. Anyone, anywhere, can replay any production run to its primary source. This page is the index."

**CTAs:**
- Replay an attestation (deep link to `/replay-attestation`)
- Watch the 90-second demo (deep link to `/demo`)
- Email procurement (mailto: `inquiries@szlholdings.com`)

### 2.2 Live evidence-ledger header

A four-tile live block, fetched from the API at page-load:

| Tile | Source | Today |
|---|---|---|
| Anchored events (last 24h) | `GET /api/governance/stats` | _live count_ |
| Replay attestations served (last 24h) | `GET /api/governance/stats` | _live count_ |
| Open security findings | `GET /api/governance/findings/open` (count only) | _live count_ |
| Last-published trust update | latest dated entry from §2.3 | _live date_ |

These tiles are not decorative — they're the page demonstrating its own claim that the evidence layer is real and live.

### 2.3 Trust & compliance documents

A clean list, alphabetical by document ID, with last-reviewed date and downloadable link, of every document in Track A:

- A11OY-01 — FedRAMP Authorization Disclosure
- A11OY-02 — CMMC 2.0 / NIST SP 800-171 Rev. 3 Gap Assessment
- A11OY-03 — Bias Testing Methodology
- A11OY-04 — US Data Residency Policy
- A11OY-05 — 72-Hour Incident Response Procedure
- SENTRA-01 — SOC 2 Type II Plan
- SENTRA-02 — Incident Response Runbook
- SENTRA-03 — Threat Feed Catalog
- SENTRA-04 — Penetration Testing Plan
- AMARU-01 — Data Classification Policy (CUI/PII/Public)
- AMARU-02 — Retention and Deletion Policy
- AMARU-03 — COTS-ERP Integration Posture
- AMARU-04 — Privacy Impact Assessment Template

Each document has:
- Title (link to markdown rendering on the public site)
- Last-reviewed date
- Document version
- Download (PDF) — generated at deploy via the docs build (`scripts/build-trust-pdfs.sh`)
- Source (link to the file on GitHub for non-repudiation)

### 2.4 Replay attestation explainer

Three short paragraphs (≤ 250 words) explaining what a replay attestation is, why SZL builds them, and how a reviewer can use them. End with a prominent button: "Try a replay now" → `/replay-attestation`.

### 2.5 Empire APEX alignment summary

A simple 3×N table mapping each Empire APEX gap (from the April 2026 pre-briefing) to the document that closes it and the current status:

| Product | Empire APEX gap | Closing document | Status |
|---|---|---|---|
| A11oy | FedRAMP authorization disclosure | A11OY-01 | Published |
| A11oy | CMMC / NIST SP 800-171 | A11OY-02 | Published |
| A11oy | Bias testing methodology | A11OY-03 | Published |
| A11oy | US-only data residency | A11OY-04 | Published |
| A11oy | 72-hr incident response | A11OY-05 | Published |
| Sentra | SOC 2 Type II | SENTRA-01 | Plan published; Type II issuance 2027-Q4 |
| Sentra | Incident response runbook | SENTRA-02 | Published |
| Sentra | Threat feed catalog | SENTRA-03 | Published |
| Sentra | Penetration testing | SENTRA-04 | Plan published; current letter on request |
| Amaru | Data classification | AMARU-01 | Published |
| Amaru | Retention / deletion | AMARU-02 | Published |
| Amaru | COTS-ERP integration | AMARU-03 | Published |
| Amaru | Privacy impact assessment | AMARU-04 | Template published |

### 2.6 Public attestations log

A reverse-chronological list of every public attestation we issue. Each entry has a date, a one-line description, the SHA of the attestation file, and a download.

Examples:
- 2026-05-DD — Penetration test attestation letter (redacted), Verified by [Vendor]
- 2026-05-DD — US Data Residency Attestation — public sample
- 2026-Q3 — Quarterly residency posture
- 2026-Q4 — Sub-processor list update

### 2.7 Sub-processors

A live, dated list of sub-processors with role, country, certification (where applicable), and notification date. Sourced from `docs/security/subprocessors.md`.

### 2.8 Researchers and disclosure

The coordinated-disclosure policy summary + email + PGP key fingerprint. Link to the full policy at `docs/security/disclosure.md`.

### 2.9 Status and changelog

A small block linking to:
- `status.szlholdings.com` (operational status)
- `/changelog` (product changes)
- The git history of this page (so anyone can see when this page changed)

### 2.10 Contact

`inquiries@szlholdings.com` — procurement and partnerships
`security@szlholdings.com` — security disclosure
`privacy@szlholdings.com` — privacy and data subject rights
SZL Holdings · United States

## 3. Implementation

### 3.1 Page location

Create or replace: `artifacts/szl-holdings/src/pages/governance.tsx`

(The existing `governance-posture.tsx`, `trust-governance.tsx`, etc. are useful internal pages but are different in audience. This page replaces or supersedes the public-facing slot.)

### 3.2 Routing

Add to whatever router this site uses (likely Wouter or React Router given the existing files):

```tsx
<Route path="/governance" component={GovernancePage} />
```

If `governance` already routes to an internal-only page, move that to `/internal/governance` and reserve the public `/governance` for this version.

### 3.3 Data sources

```ts
// in artifacts/api-server/src/routes/governance.ts (additive — do not break existing)
router.get("/api/governance/stats", async (_, res) => {
  const stats = await ledger.publicStats({
    windows: ["24h"],
    metrics: ["anchors", "replays", "findings_open", "last_trust_publish"],
  });
  res.json(stats);
});
```

Stats queries are aggregate-only and never expose tenant-identifying information. Verified by a unit test.

### 3.4 Document rendering

Mount the markdown files from `operational_payload/specs/track-a-nystec/` into the site at `/trust/[document-id]`. Each is rendered with a date stamp and a link to the GitHub source.

### 3.5 PDF generation

Add `scripts/build-trust-pdfs.sh` that runs at deploy:

```bash
for f in docs/trust/*.md; do
  pandoc "$f" -o "dist/trust/$(basename $f .md).pdf" \
    --pdf-engine=xelatex \
    --variable mainfont="Inter" \
    --variable geometry:margin=1in
done
```

### 3.6 SEO + crawlability

- `robots.txt` allows all on `/governance`, `/trust/*`, `/replay-attestation`.
- A signed `sitemap.xml` lists the canonical routes.
- A small JSON-LD block on `/governance` declares the SZL Holdings organization with a `governancePolicy` link to itself.

### 3.7 Performance

The page must be statically rendered (Next.js `getStaticProps` equivalent or Vite + react-static). Live-stats tile refreshes asynchronously after first paint.

## 4. Acceptance criteria

- The page is reachable at `https://szlholdings.com/governance` without authentication.
- All 13 trust documents render and download as PDFs.
- All four live tiles return real values from the production evidence ledger.
- The page passes Lighthouse accessibility ≥ 95.
- The replay attestation deep link works.
- The page is indexable by search engines.
- The page renders cleanly on mobile (375px) and 16:9 desktop (1920×1080).

## 5. Honest disclosure

The whole point of this page is honesty under load. We will not:

- Display green "compliant" badges for things we have not yet completed (e.g., FedRAMP).
- Show metrics without dating them.
- Surface user-personal information from the ledger; only aggregate counts.
- Hide gaps. Open findings are shown as a count and reconciled monthly.
