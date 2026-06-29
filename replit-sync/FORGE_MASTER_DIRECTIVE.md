# FORGE MASTER DIRECTIVE — execute in GitHub (2026-06-10)

**From:** Perplexity Computer (parent) → **Forge** (SZL build agent)
**Path:** `platform/replit-sync/` (canonical). Supersedes/consolidates the day's work-orders + payloads.
**Mandate:** Do it all in GitHub. One source of truth. No band-aids. Honest at Series-A scrutiny.

---

## 0. HARD RULES (non-negotiable)
- **Numbers/formulas:** read from `.github/.github/data/lean_numbers.json` (`locked_formula_count: 8`, `locked_formula_ids`) and `lutar-lean@main`. **Never invent or estimate.** locked-proven = **8** {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel `c7c0ba17` (749/14/163), enforced by `locked_count_eight` (no axioms).
- **Λ = Conjecture 1** (machine-checked FALSE unconditionally; conditional = Theorem U). **Khipu BFT = Conjecture 2.** Never call either "proven"/"theorem" unqualified.
- **SLSA L1 honest.** L2 = build-attested on a11oy/killinchu container images only; bundle L2 / L3 / FedRAMP / Iron Bank / CMMC = **roadmap**. Use the local guard before push: `make doctrine` (advisory) / `DOCTRINE_BLOCK=1` to enforce.
- **Crypto:** a11oy receipts = **ECDSA P-256** (verified vs a11oy `/cosign.pub`); shared `szl-receipts` chain = **Ed25519**. Two layers — don't unify without proving cross-verify.
- **MOBILE + TABLET = MANDATORY** on every web surface you build or touch. Verified-good today: a11oy console (≤820px drawer + hamburger), killinchu console (≤880px grid collapse + reduced-motion), founder-page (mobile-first min-width breakpoints, 0 overflow at 390/820), anatomy v4 (bottom-sheet + FAB). **Keep this standard:** never `display:none` a primary feature on phones — use a drawer/bottom-sheet + FAB; tablet = sized panels; respect `prefers-reduced-motion`; keyboard + ARIA; verify headless at 390px and 820px with 0 horizontal overflow.
- Conventional Commits + DCO (`git commit -s`) + SHA-pinned actions (40-char SHAs). One branch per task. **CI green for a REAL reason before merge** — never disable a test/threshold/gate to force green.

---

## 1. OPEN PRs — resolve each (current state as of handoff)
1. **stephenlutar2-hash/founder-page #1** (security workflows) — MERGEABLE/UNSTABLE; only `trivy` fails. Root cause: `trivy-action` internally pulls `setup-trivy@v0.2.2` which is unresolvable in the HF/CI egress class. **Fix:** pin `trivy-action` to a release whose internal `setup-trivy` resolves, OR install trivy directly + scan (mirror the Grype fix in szl-uds-deployment #73). gitleaks already fixed (OSS CLI).
2. **szl-holdings/lambda-bounty #3** (docs) — CONFLICTING + `verify` fails. Repo is **archived/read-only** — confirm whether to unarchive or close. If keeping: the Lean `verify` fails on `unknown identifier 'Function.Bijective'` (missing Mathlib import) + a `sorry`; fix import + discharge or scope the sorry, then rebase.
3. **szl-holdings/szl-cookbook #68** (TS5→6 + @types/node 20→25 dev-deps) — `build-and-test` fails. Real TS6 migration: `tsconfig.test.json moduleResolution:"node"` → TS6 fatal `TS5107` (needs `ignoreDeprecations:"6.0"` or move to `node16`), then `@types/node@25` needs explicit `"types":["node"]`. **Recommend:** split the safe `@types/node` bump from the TS major; do the TS6 migration deliberately with the full smoke suite.
4. **szl-holdings/szl-uds-deployment #51** (SLSA L2 provenance, 5 organs) — rebase onto main (post-#73 Grype fix + post-#334 doctrine fix). The Grype/Lint/doctrine fails are now fixed org-wide; rebasing should clear them. Resolve conflicts on publish workflow + 5 organ `zarf.yaml`. Keep SLSA language L1-honest. Fix the `Lint PR title` (Conventional Commits) — retitle if needed.
5. **szl-holdings/szl-uds-deployment #57** (verify receipt signing) — same: rebase onto main to inherit the Grype + commit-lint fixes; resolve the `verify_receipts_ed25519.py` conflict; retitle for Conventional Commits.

## 2. PLATFORM main — green the suite (Series-A blocker)
- **`Tests`/vitest job fails despite individual test files passing** → a non-test gate in the job (coverage threshold / test-less package / post-test step). Find the exact non-zero exit; fix the cause (add tests or `--passWithNoTests`, fix real type/lint), **do not lower thresholds**.
- Triage `CI`, `Build Check`, `E2E`, `Lighthouse`, `Accessibility`, `Runtime Audit` the same way — real regression vs infra flake; stabilize harness if flaky, fix UI if real. Detail in `replit-sync/forge-testsuite-workorder-20260610.md`.
- ✅ Already fixed this session: `check / doctrine` (PR #334), commit-lint SHA (PR #332), Grype stale-DB (szl-uds-deployment #73).

## 3. REAL-TIME TAB WIRING (per LIVE_SOURCES_VERIFIED.md + UNIFICATION_CAPABILITY_TAB_MAP.md)
Server-side polls only (FastAPI httpx, 10–15s jittered, honest cached/stale labels, 0 client CDN). cve/kev → NVD + CISA KEV; finance → Yahoo v8 + Coinbase + Treasury; threats/arena/llm/mcp → GitHub REST + HF models + Hatun-MCP `tools/list` (**25 tools**); killinchu mission/fleet/mesh → drone routes + ROE + fusion. PAUSED/503 = show real state, never mock. Mobile/tablet per §0.

## 4. DEPLOY / SURFACES
- **HF Spaces:** deploy anatomy v4 (sdk: static) + flagship consoles; confirm **GitHub↔HF byte-identical (md5)** after each.
- **Permanent pplx.app link for anatomy v4 is BLOCKED** — org "Website Publishing" is off in Computer settings (needs a Perplexity org admin to enable). Not a code issue.
- No prod (Hetzner/a-11-oy.com DNS) changes without explicit human approval.

## 5. FOUNDER-ONLY (cannot be delegated)
- Run kernel `#print axioms` ceremony → then unflag the served-8 surfaces (a11oy/killinchu consoles already publish locked=8, set-verified equal to kernel; this is confirmation, not correctness).
- Decide the HIGH-RISK archived duplicate `PROVEN_STATE_CANONICAL.md` / `CANONICAL_PROOF_SUMMARY_SHARED.json` (still read 5; intertwined with protected historical wave notes).

## 6. RECOMMENDED NEXT (parent proposes)
- Roll real-time tab wiring + the mobile bottom-sheet pattern to any remaining surfaces.
- Per-organ "dissect detail" in anatomy v4: inline Lean permalink + exact `#print axioms` line (data already in data.js); receipt-overlay tying interactions to Khipu provenance.
- Wave24 Lean: admissibility-certification soundness (conditional, axiom-clean); connect Wave23 BFT to the signed execution certificate; first honest Semantic Linearizability def + one proven property. Statement-only until kernel-verified.

---

## DONE THIS SESSION (merged) — context
5→8 alignment ×7 (a11oy #299, killinchu #98, developers #5, docs-site #20, .github #149, pitch-collateral #2, platform #329) · anatomy v4 + mobile + deepen (#1,#2,#3,#4,#5) · canonical numbers (.github #150) · doctrine pre-check + hardening (.github #151,#152; a11oy #300; killinchu #99) · doctrine L2 fix (#334) · commit-lint SHA (#332) · Grype (#73) · payloads/work-orders (platform #330,#331,#333,#335,#336).

---
*Co-Authored-By: Forge (SZL agent) · Doctrine v11.*
