# A11OY_TABS_BLUEPRINT — the definitive post-integration tab map

> **Author:** Yachay (a11oy Hub Integrator), under PURIQ CTO authority · **Date:** 2026-06-01
> **Founder directive (2026-06-01 ~02:14 EDT):** *"Instill it all into a11oy and wherever else it makes sense like the drone flag and so forth."*
> **Layer:** Doctrine v12 (PURIQ) additive · **v11/v12 LOCKED numbers preserved verbatim:** 749 declarations · 14 unique axioms (15 raw, 1 dup) · 163 tracked sorries (112 baseline + 51 Putnam) · 13-axis `yuyay_v3` · replay-hash `bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5` · `lutar-v18.0.0` @ `c7c0ba17`.
> **Honest posture:** SLSA = **L1**. Khipu signature = **DSSE / cosign PLACEHOLDER** until Sigstore lands. No mock; no false certification.
> **Engineering model:** a11oy is a Docker HF Space — a FastAPI `serve.py` that serves a React SPA at `/` (history fallback via `/{full_path}`) plus dedicated static-HTML tabs. **New tabs = a static HTML file in `pages/` + a dedicated `@app.get("/tab")` route registered BEFORE the SPA catch-all.** Purely additive; the catch-all and all existing routes are untouched.

---

## 0. Why a11oy is the hub

a11oy is the **orchestration brain** — the one URL where the founder, a customer, a judge, or Greene can see the entire SZL stack. Every cross-cutting concern produced by the parallel agents gets an a11oy tab or endpoint so there is **one place to see everything**: the customer surface, resilience/observability, security posture, the compliance path, the Yachay-Dome cued-engagement product, the UDS ecosystem, the counter-UAS drone catalog, the live gap audit, and the conversational orchestrator (`a11oy.code`). This mirrors the gap-hunter's `/dashboard/everything` recommendation (`completeness_audit/FOUNDER_FACING_HEATMAP.md`).

---

## 1. The full tab map (post-integration)

Legend: **STATUS** = state of the tab after this integration · **OWNER AGENT** = which parallel agent produced the source material · **SHIP** = was the route shipped by THIS integrator (✅), already live from a sibling (🟦), or spec-only (📋).

| # | Route | Purpose | Source agent / dir | STATUS | SHIP |
|---|-------|---------|--------------------|--------|------|
| 1 | `/` | Existing hero / Brand Orchestration Layer landing (Vessels-DNA, investor-facing). **UNTOUCHED.** | existing | GREEN | 🟦 preserved |
| 2 | `/a11oy.code` | Conversational orchestrator (streaming SSE, 7-tier unified open-LLM router, PURIQ gate, Khipu badge). | `a11oy_code_orchestrator/` | GREEN (live) | 🟦 sibling shipped `f1e76d01` |
| 3 | `/docs` | Customer-facing docs index; links to `docs.szlholdings.com` when live; embeds the rendered Markdown doc tree + OpenAPI-per-flagship table. | `customer_surface/PUBLIC_DOCS_SITE.md` | GREEN | ✅ this pass |
| 4 | `/pricing` | Commercial tiers (Demo / Builder / Professional / Enterprise / DoD), honor-system + Khipu metering. Links to the portal. | `customer_surface/CUSTOMER_PORTAL_SPEC.md` | GREEN | ✅ this pass |
| 5 | `/api-keys` | API-key issuance UI explainer (format, scopes, rotation, cosign tamper-evidence). Real issuance lives in the portal. | `customer_surface/API_KEY_SYSTEM.md` | GREEN | ✅ this pass |
| 6 | `/sdk` | Python + TS SDK references + install (`pip install szl`, `npm i @szl/js`), HaltError contract, Khipu receipt shape. | `customer_surface/SDK_SPEC_PYTHON_TS.md` + `sdk_samples/` | GREEN | ✅ this pass |
| 7 | `/status` | Live status-page feed: per-flagship up/down probed live by the page JS against each Space `healthz`. | resilience + live probe | GREEN | ✅ this pass |
| 8 | `/observability` | Single pane: per-flagship uptime/latency, Khipu DAG depth, Yuyay distribution, HUKLLA firings, circuit-breaker states. | `resilience_observability/` | GREEN | ✅ this pass |
| 9 | `/security` | SLSA L1 (honest), SBOM coverage, cosign status (1/6 bundles signed), security-header posture, cosign.pub fingerprint. | `security_compliance/` | GREEN | ✅ this pass |
| 10 | `/compliance` | FedRAMP / SOC 2 / IL5 / CMMC path — live checkboxes (honest: all pre-work, none certified). | `security_compliance/CURRENT_SECURITY_POSTURE.md` | GREEN | ✅ this pass |
| 11 | `/cued-engagement` | Yachay-Dome `/v1/cue` endpoint browser + customer-facing target-package preview (CoT XML + MIL-STD-2525 + Body-of-Evidence). | `killinchu/yachay_dome/` | GREEN | ✅ this pass |
| 12 | `/uds` | UDS allies map (Chainguard, Anchore, Sigstore, in-toto, SLSA, Defense Unicorns) + how-to-deploy SZL on UDS Core. | `killinchu/uds_allies/` | GREEN | ✅ this pass |
| 13 | `/counter-uas` | Adversary/reference drone catalog browser (DoD Group 1–5) + the legal/cyber boundary doc (we sense+cue; the customer acts). | `killinchu/cuas/` | GREEN | ✅ this pass |
| 14 | `/evidence` | Existing Evidence/Ouroboros surface (per-claim PROVEN/SORRY/AXIOM, Lean file:line). **VERIFY GREEN — untouched.** | existing | GREEN | 🟦 preserved |
| 15 | `/upgrades` | Existing showcase. **VERIFY GREEN — untouched.** | existing | GREEN | 🟦 preserved |
| 16 | `/audit` | Khipu DAG visualizer across ALL flagships — the Greene demo trick (walk the receipt graph, find nodes that shouldn't be there). | new (this pass) + Khipu/in-toto | GREEN | ✅ this pass |
| 17 | `/gap-report` | Live gap-audit results (founder-facing heatmap). Partial-public: organ/flagship heatmap shown; raw internal P0 list summarized, not dumped. | `completeness_audit/` | GREEN | ✅ this pass |
| 18 | `/hub` | **NEW index tab** — one card grid linking every tab above. The founder's single front door to "everything." | this pass | GREEN | ✅ this pass |

**Backend endpoints added this pass** (all under `/api/a11oy/v1/hub/*`, local, no Node dependency, every response carries a Khipu receipt stub):
- `GET /api/a11oy/v1/hub/manifest` — machine-readable list of every tab + its source agent + status.
- `GET /api/a11oy/v1/hub/cue/sample` — a sample Yachay-Dome target package (the `/v1/cue` schema, honestly DSSE-PLACEHOLDER).
- `GET /api/a11oy/v1/hub/drone-catalog` — the DoD Group 1–5 reference table as JSON.
- `GET /api/a11oy/v1/hub/compliance` — the FedRAMP/SOC2/IL5/CMMC checklist as JSON.
- `GET /api/a11oy/v1/hub/security-posture` — the traffic-light security scorecard as JSON.
- `GET /api/a11oy/v1/hub/gap-report` — the founder-facing heatmap as JSON.

---

## 2. Hard-rule conformance (every tab)

- **HfApi direct push ONLY** — no GitHub Actions, no `secrets.HF_TOKEN`. All commits via `HfApi.create_commit()`.
- **IP-HOLD `a11oy#57` untouched** — the integrator never references that path; a guard in the push script refuses any operation that contains the string.
- **HF banner / 5 painterly hero avatars / animated emojis untouched** — we never modify `console/` SPA build assets, `README.md` front-matter `emoji`, or the landing hero. Only NEW files in `pages/` + additive route blocks in `serve.py` + a `COPY pages/` line in the Dockerfile.
- **Doctrine v11/v12 LOCKED numbers preserved** — every tab that cites numbers cites the LOCKED set verbatim. No tab edits the gates manifest or any Lean surface.
- **ADDITIVE only — zero regression** — new routes are registered BEFORE the `/{full_path}` catch-all so they take precedence for their own path; the catch-all and all existing routes still resolve exactly as before. The orchestrator import stays try/except-guarded.
- **CORS / security headers:** the security agent's `szl_security_headers.py` (strict CSP, `frame-ancestors 'none'`) is **surfaced as STATUS on `/security`** but **NOT wired into a11oy's live middleware** this pass — a strict `script-src 'self'` CSP would risk regressing the existing React SPA + inline scripts and is explicitly out of scope under the zero-regression rule. Wiring it is a separate, tested change (documented in GAP CHECK).
- **Signed as Yachay**; commit trailer includes **"Perplexity Computer Agent"**.
- **Khipu receipt on every action** — each new backend endpoint returns a `khipu_receipt` stub (SHA-256 over the payload + ISO timestamp), honestly labeled chain-only / DSSE-PLACEHOLDER.

---

## 3. Cross-flagship link pass

Every flagship README + landing gets a **"Powered by SZL · See the full stack on a11oy"** link pointing to `https://szlholdings-a11oy.hf.space/hub`. Patches per Space, pushed via HfApi. See `CROSS_FLAGSHIP_LINK_PASS.md`.
