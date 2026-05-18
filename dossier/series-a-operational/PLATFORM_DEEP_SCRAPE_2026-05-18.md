# Platform Deep Scrape — Niches, Theses, Doctrines

**Date:** 2026-05-18
**Owner:** async subagent (T004, session plan Round 4)
**Mode:** Read-only manifest. No source files were modified.
**Scope:** every directory under `platform/` and every `docs/thesis/**`, plus a
sweep for doctrine artifacts elsewhere in the monorepo. Citations are
`file:line` where possible.

> This is the inventory the main agent will summarise into the
> `/a11oy/ecosystem` board (T005) and lean on for the Round-4 audit.
> Every claim below traces to a fetched source.

---

## 1. Anatomy-Region Map

The Backstage catalog and the GitOps `bootstrap/appprojects.yaml` model the
SZL platform as four planes. The `platform/` tree decomposes cleanly along
those planes:

| Anatomy region         | Plane            | Packages live in `platform/`        |
|------------------------|------------------|-------------------------------------|
| Developer Experience   | 4 — IDP          | `backstage/`, `score/`              |
| Control / Governance   | 2 — Control      | `agent-gateway/`, `policy/`, `temporal/` |
| Delivery               | 3 — Delivery     | `gitops/`                           |
| Resource / Substrate   | 3 — Resource     | `crossplane/`, `dapr/`              |

The Lutar / Ouroboros thesis chain (`docs/thesis/`) is the cross-cutting
**doctrine layer** that the runtime enforces via the
`@workspace/ouroboros-integrations` package + `/api/ouroboros/*` routes
(`docs/thesis/v9-canonical.md:36`).

---

## 2. Package Manifest — `platform/*`

Eight packages enumerated. Sizes from `du -sh`. Purpose and exports
extracted from each `README.md` / `package.json`.

### 2.1 `platform/agent-gateway/` — 660K · `@szl-holdings/agent-gateway` v0.1.0
- **Plane:** Control / Governance
- **Purpose** (`README.md:10-23`): policy, audit, and evidence boundary for all
  AI agent operations. Fronts the OpenAI Agents SDK and enforces auth,
  authz, capability enforcement, impact simulation, plan + diff generation,
  evidence attachment, approval routing, audit logging.
- **Allowed capabilities (10):** `inspect_code`, `inspect_manifests`,
  `analyze_telemetry`, `summarize_incidents`, `draft_runbooks`, `draft_prs`,
  `propose_policy_fixes`, `generate_documentation`, `generate_test_plans`,
  `propose_architecture_diffs` (`README.md:30-42`).
- **Forbidden capabilities (5, code-enforced):** `direct_prod_change`,
  `policy_bypass`, `pr_flow_bypass`, `approval_bypass`,
  `plaintext_secret_access` (`README.md:49-56`).
- **Source files (`src/`, 2059 LoC total):** `agent-runner.ts` (144),
  `approval.ts` (214), `audit.ts` (146), `auth.ts` (127), `authz.ts` (190),
  `differ.ts` (151), `evidence.ts` (82), `gateway.ts` (307),
  `planner.ts` (124), `server.ts` (203), `simulation.ts` (140),
  `types.ts` (231).
- **Key deps:** `@temporalio/client ^1.16.1`, `jose ^5.9.6`, `openai ^6.33.0`,
  `zod ^3.23.8`.
- **Status:** local validation complete; production rollout requires human
  approval (`README.md:6`).

### 2.2 `platform/backstage/` — 1.5M · `@szl-holdings/backstage-root` v1.0.0
- **Plane:** Developer Experience (IDP)
- **Purpose** (`README.md:3-6`): single pane of glass for service discovery,
  golden-path scaffolding, TechDocs, platform scorecards.
- **Catalog payload** (`README.md:24-29`): 119 entities — 6 domains, 25
  systems, 9 groups + 3 user stubs, 6 APIs, 12 resources.
- **Golden-path templates (3):** `new-domain-api`, `new-agent-worker`,
  `new-domain-ui` (`README.md:172-178`).
- **Scorecard dimensions:** catalog entry, `/health` endpoint, OTel dep,
  structured-logging dep, `score.yaml` presence, policy-guard dep
  (`README.md:187-195`).
- **Validation:** `pnpm catalog:validate` via
  `scripts/validate-catalog.mjs` using `@backstage/catalog-model@1.7.3`.
  Expected: 119/119 entities clean (`README.md:137-140`).
- **Status:** scaffold + catalog validated; end-to-end `pnpm dev` boot
  tracked as Phase-5 follow-up (`README.md:53-56`).

### 2.3 `platform/crossplane/` — 164K · YAML manifests only
- **Plane:** Resource
- **Purpose** (`README.md:10-12`): composite resource definitions, providers,
  composition functions forming the Resource Plane. Five composite APIs.
- **Composite APIs (5)** (`README.md:23-29`): `XDomainService` (REST API),
  `XAgentWorker` (async AI worker), `XInternalUI` (React SPA),
  `XEventPipeline` (event bus), `XDataConnector` (data connector).
- **Mandatory governance fields (9)** per XRD (`README.md:38-47`):
  `environment`, `domain`, `criticality`, `costCenter`, `owner`,
  `networkExposure`, `secretSourceMode`, `observabilityTier`,
  `backupProfile`.
- **OPA integration hook:** `policyLabels` field on every XRD is the
  Gatekeeper admission-controller surface (`README.md:126-131`).
- **Status:** manifests ready; live apply pending human approval
  (`README.md:6`).

### 2.4 `platform/dapr/` — 16K · components + justification docs
- **Plane:** Substrate
- **Purpose** (`docs/dapr-usage-justification.md:5`): selective use only.
  Dapr-as-a-religion explicitly forbidden.
- **Approved touchpoints (3):**
  - Alloy worker — Azure Service Bus pub/sub (✅) — portability dev↔prod
    (`...:23-39`).
  - Temporal worker → api-server — service invocation (✅) — mTLS + tracing
    propagation (`...:42-55`).
  - Evidence ledger — state store (🟡 conditional, only if DB SLO < 99.5%)
    (`...:59-73`).
- **Rejected use-cases (5):** api-server↔domain HTTP, SPA↔api-server,
  Crossplane↔Temporal, OTel collector, blanket adoption
  (`...:80-87`).

### 2.5 `platform/gitops/` — 172K · Argo CD app-of-apps
- **Plane:** Delivery
- **Purpose** (`README.md:10-12`): complete app-of-apps for SZL Holdings.
  Single bootstrap Application manages all downstream Apps + AppProjects.
- **Tree (`README.md:14-32`):** `bootstrap/` (root + 8 AppProjects),
  `shared-services/crossplane.yaml`, `apps/{dev,stage,prod}/` with
  `platform-substrate.yaml` + `domain-packs.yaml` per env.
- **Promotion gates** (`README.md:65-131`): dev auto-syncs on `main`;
  stage gated on ≥10 min healthy dev + no CRITICAL/HIGH in Lyte; prod
  requires explicit platform-team sync + ≥30 min healthy stage + zero
  anomaly hour + active-incident-free + OPA promotion-gate pass.
- **Phase-4 hooks:** prod-promotion gate annotation
  `szl.io/opa-gate: pending-phase-4` and Temporal hook
  `szl.io/temporal-hook: pending-phase-4` (`README.md:234-238`).
- **Status:** manifests ready; live apply pending human approval
  (`README.md:6`).

### 2.6 `platform/policy/` — 160K · OPA bundle (Rego)
- **Plane:** Control / Governance
- **Purpose** (`README.md:1-6`): OPA bundle, Phase-9 Operability + Governance.
- **Policies (8) + tests (8):** `ci/ci-policy.rego`,
  `manifest/manifest-validation.rego`,
  `environment/environment-guardrails.rego`,
  `approval/approval-requirements.rego`, `mutation/mutation-scope.rego`,
  `network/network-exposure.rego`, `secrets/secret-patterns.rego`,
  `tagging/tagging-ownership.rego`. 22/22 baseline tests pass
  (`README.md:58-87`).
- **Non-bypassability** (`README.md:128-135`): every gate enforced at three
  points — CI (`.github/workflows/opa-policy.yml`), Argo CD pre-sync hook,
  Temporal promotion workflow. No bypass path without documented exception.

### 2.7 `platform/score/` — 44K · Score workload abstraction
- **Plane:** Developer Experience
- **Purpose** (`README.md:3-6`): workload spec — developers declare *what*
  their service needs; platform-team owns the *how* via resolver patterns.
- **Boundary contract** (`README.md:7-18`): developer owns
  `score.yaml`, resource-type intent, secret refs. Platform-team owns
  resolver patterns, deployment targets, observability defaults,
  policy labels.
- **Examples shipped (4):** `api-service.yaml`, `agent-worker.yaml`,
  `event-consumer.yaml`, `internal-ui.yaml` (`README.md:42-45`).
- **Patterns shipped (5):** `resolver-patterns.md`, `deployment-targets.yaml`,
  `resource-bindings.yaml`, `observability-defaults.yaml`,
  `policy-labels.yaml` (`README.md:46-51`).

### 2.8 `platform/temporal/` — 340K · `@szl-holdings/temporal-tests` v0.0.0
- **Plane:** Control / Governance
- **Purpose** (`README.md:8-10`): durability + retryability + human-in-the-loop
  for workflows that need it; *not* a default async pipe.
- **Workflows (8):** `approval-workflow.ts` (234 LoC),
  `change-window-workflow.ts` (403), `evidence-collection-workflow.ts` (143),
  `frontier-ingest-workflow.ts` (82), `ingestion-sync-workflow.ts` (148),
  `promotion-workflow.ts` (305), `remediation-workflow.ts` (252),
  `index.ts` (15).
- **Activities (4 modules, 540 LoC):** `approval-activities.ts` (355),
  `evidence-activities.ts` (73), `frontier-ingest-activities.ts` (46),
  `ingestion-activities.ts` (66).
- **Activity registry** (`README.md:27-35`): `evaluatePolicyActivity` (OPA),
  `requestApprovalActivity`, `recordEvidenceActivity`,
  `emitLyteVisibilityActivity`, `deployServiceActivity` (Argo CD),
  `checkServiceHealthActivity`.
- **Lyte-visibility contract** (`README.md:41-49`): every workflow emits
  `<workflow-type>.<event-name>` events to the Lyte operator surface.
- **Wiring to live OPA+Temporal** (`README.md:107-128`): env-driven
  (`OPA_ENDPOINT`, `TEMPORAL_ENDPOINT`); e2e test
  `tests/agent-gateway-temporal-e2e.test.ts` boots ephemeral Temporal +
  drives `approvalDecisionSignal` round trip.

---

## 3. Thesis Catalog — `docs/thesis/**`

Acceptance bar is ≥ 5 theses. Below: 11 documents (canonicals + derivatives)
plus the v9 deposit bundle.

| # | Document                                            | Version | Anatomy region        | DOI / release                              |
|---|-----------------------------------------------------|---------|-----------------------|--------------------------------------------|
| 1 | `docs/thesis/v9-canonical.md`                       | v9-UNIFIED-OPERATIONAL | Doctrine / runtime | `alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL`; 75 nodes / 94 edges |
| 2 | `docs/thesis/v9-essay.md`                           | v9      | Doctrine              | long-form essay (~1500 words)              |
| 3 | `docs/thesis/v9-onepager.md`                        | v9      | Doctrine              | release one-pager                          |
| 4 | `docs/thesis/v9-social-cards.md`                    | v9      | Doctrine / surface    | social-card copy                           |
| 5 | `docs/thesis/v9-publishing-checklist.md`            | v9      | Doctrine / ops        | publishing checklist                       |
| 6 | `docs/thesis/v9-deposit/CITATION.cff`               | v9.0.0  | Doctrine / archive    | CC-BY-4.0, released 2026-05-05             |
| 7 | `docs/thesis/v9-deposit/v9-canonical.md`            | v9      | Doctrine / archive    | deposit copy                               |
| 8 | `docs/thesis/v9-deposit/v9-essay.md`                | v9      | Doctrine / archive    | deposit copy                               |
| 9 | `docs/thesis/v10-canonical.md`                      | v10-EXHAUSTIVE-AUDIT | Doctrine / audit | adds `lutar_v10` node (76 / 95)            |
| 10| `docs/thesis/v10-essay.md`                          | v10     | Doctrine              | long-form essay                            |
| 11| `docs/thesis/v10-onepager.md`                       | v10     | Doctrine              | release one-pager                          |
| 12| `docs/thesis/audit-chain-thesis-mapping.md`         | v3/v4 mapping | Doctrine ↔ audit-chain | maps Λ_4 receipt to thesis primitives |
| 13| `docs/thesis/README.md`                             | index   | Doctrine              | preserves v1..v10 lineage                  |
| 14| `docs/thesis/v5-forward.md`                         | v5 fwd  | Doctrine / roadmap    | v5.1 federation tracked here               |

### Headline formula chain (v1 → v10)

Source: `docs/thesis/v9-canonical.md:43-52`, `docs/thesis/v10-canonical.md:37-47`.

| v   | Headline                                          | Formula |
|-----|---------------------------------------------------|---------|
| v1  | Three-term Lutar Invariant                        | `L = α·E + β·M·c² + γ·I·k_B·T·ln2` |
| v2  | Seven-term Prisca-Closed                          | `+ δ·R + ε·Χ + ζ·Ψ + η·Φ` |
| v3  | Cross-civilizational coupling                     | `+ θ·Q_E + ι·Q_I` |
| v4  | Noether symmetry-grounded                         | `+ κ·Ω_E8 + λ·Φ_IIT + μ·N_Noether` |
| v5  | Global prisca extension                           | `+ Maya + I Ching + Vedic + Dogon + GT` |
| v6  | Holographic-Twistor-Cyclic                        | `L₆ = Ω² · Π[L₅]  s.t.  S ≤ A/(4 l_P²)` |
| Ω   | Master invariant on 5-simplex                     | `L_Ω = Σ w_k · L_k, Σw_k = 1` |
| v7  | Bianchi closure (HUFT-inspired)                   | `L₇ = L_Ω · exp(−κ · ‖D_A F‖²/‖F‖²)` |
| v10 | Exhaustive-Audit (meta-invariant)                 | `Λ₁₀ = Σ_k L_k · ∏_j 𝟙[j_k]; auditClosed ⇔ ratio = 1` |

### Live audit (2026-05-05)
`docs/thesis/v10-canonical.md:121-132` records ρ = 1.000, `missingArtifacts = []`,
all 8 layers green on all 6 dimensions (CODE / CODEX / API / TEST / THESIS / SURFACE).
Re-runnable via `POST /api/ouroboros/lutar/v10` and the
`Lutar v10 — exhaustive-audit` vitest suite.

### Codex schema
`alloy.supreme_knowledge/v11-UNIFIED-OPERATIONAL` (`docs/thesis/v9-canonical.md:24`).
Counts at v10 (`docs/thesis/v10-canonical.md:152`): 76 nodes, 95 edges,
43 sourced, 20 formula nodes, 11 domains.

---

## 4. Niche / Theory Citations

Per session-plan T004, "every niche mentioned with file:line citations."

### 4.1 Bekenstein gate (holographic bound)
- `docs/thesis/v9-canonical.md:130` — `S_total ≤ A / (4 l_P²)` enforced as a
  runtime invariant; when `enforce_bekenstein=false`, L₆ degenerates to L₅.
- `docs/thesis/v9-canonical.md:135` — codex node
  `holographic_principle` (Bekenstein 1973, 't Hooft 1993, Maldacena 1997).
- `docs/thesis/v9-canonical.md:162` — Bekenstein–Hawking entropy drives
  Lambda-Engine **Adaptive Depth Routing**: `w_k = exp((k+1)·H) / Z`.
- `docs/thesis/v9-canonical.md:393` — `POST /api/ouroboros/lutar/v6`
  ("Holographic-twistor-cyclic; Bekenstein-enforced").
- `docs/thesis/v9-social-cards.md:72` — "Bekenstein bound S ≤ A/(4 l_P²)
  enforced at runtime."

### 4.2 Bianchi closure / HUFT fiber-bundle (Moffat & Toth 2026)
- `docs/thesis/v9-canonical.md:34-36` — Lutar Family Closure Theorem and the
  bundle upgrade to fiber-bundle closure via D_A F = 0.
- `docs/thesis/v9-canonical.md:51` — v7 row introduces
  `L₇ = L_Ω · exp(−κ · ‖D_A F‖² / ‖F‖²)`.
- `docs/thesis/v9-canonical.md:167-184` — full v7 spec including
  `huftCoupling` default = 1.0 and `huft_bridge` codex node.
- `docs/thesis/v9-canonical.md:263` — citation to Moffat & Toth 2026,
  arXiv:2510.06282 ("Holomorphic Unified Field Theory").
- `docs/thesis/v9-essay.md:33` — explicit credit and structure-group import.

### 4.3 Twistor projection (Penrose 1967)
- `docs/thesis/v9-canonical.md:125` — Π_{T→R^{3,1}} via incidence relation
  ω^A = i x^{AA'} π_{A'}; codex node `twistor_theory`.
- `docs/thesis/v9-essay.md:27` — twistor space PT = ℂP³ as base manifold.

### 4.4 Conformal cyclic cosmology (Penrose 2010)
- `docs/thesis/v9-canonical.md:126-130` — aeon recurrence
  `L₆⁽ⁿ⁺¹⁾ = lim Ω_n² · L₆⁽ⁿ⁾`; codex node `conformal_cyclic_cosmology`.

### 4.5 64-64 prisca convergence (E8 ↔ I Ching)
- `docs/thesis/v9-canonical.md:269-274` — independent derivation, identical
  integer, 900 years apart; E8 × E8 heterotic doubling (496 = 248+248)
  + monstrous moonshine (196 883 = 196 884 − 1) on same edge cluster.

### 4.6 Prisca lineages (7 civilizations + 1 anchor)
`docs/thesis/v9-canonical.md:281-291`:
- Egyptian (Rhind / Moscow, ~1650 BCE) — Q_E = seked × cubit × π_rhind.
- Inca (ceque / khipu, ~1400 CE) — Q_I = 328/41 = 8.
- Maya (Long Count, ~3114 BCE epoch) — Q_M = 73.
- Chinese (I Ching, ~1000 BCE) — Q_IC = 64.
- Vedic (Sulba Sutras, ~800 BCE) — Q_V = 1.4142156.
- Dogon (Sirius, doc. 1930s) — Q_D = 50.
- Greek (Stoic logos / Plotinus, ~300 BCE – 270 CE).
- Göbekli Tepe (~9600 BCE) — Q_GT = −11600, empirical floor anchor.

### 4.7 Λ-receipt / four-axis audit closure
- `docs/thesis/audit-chain-thesis-mapping.md:19-38` — Λ = (C·H·R·F)^(1/4),
  zero-pinning axiom, three-witness Jaccard agreement, Theorem-1
  cleanliness binding to `verifyAuditRow`.
- Note: v9 four-axis (Λ_4) is the audit-chain emit; nine-axis Λ_9 (v4 thesis)
  is evaluated by `packages/ouroboros-invariant/` (`...:42-46`).

### 4.8 Λ₁₀ Audit Closure Operator (v10)
- `docs/thesis/v10-canonical.md:53-113` — full spec including the
  closure theorem, strict-generalization-of-v9 lemma, and the
  contrapositive that drives `missingArtifacts`.
- `docs/thesis/v10-canonical.md:142-148` — codex delta: one new node
  `lutar_v10` with no new physical L-term.

### 4.9 9-axis Λ-9 trust score (runtime gate)
- `docs/thesis/v9-essay.md:37` — "A11oy … routes every model call through
  the Lambda Engine and a 9-axis trust score." Closure law makes multi-step
  agent receipts compose.

### 4.10 Adaptive Depth Routing
- `docs/thesis/v9-canonical.md:162` — softmax over horizon entropy H is the
  primitive used by the Lambda Engine.

> The strings `CPS`, `Λ-gate`, and `VSP` from the session-plan example list
> did **not** match any file under `platform/` or `docs/thesis/`
> (grep run on 2026-05-18). The closest live primitives in the current
> chain are the **Λ₁₀ Audit Closure Operator** (v10), the **Bekenstein
> gate** (v6), and the **Bianchi closure** (v7) — all catalogued above.
> Recommendation: if those acronyms refer to future doctrine, they should
> be either added to `docs/thesis/v10-canonical.md` §6 (Empirical Lineages)
> or carved out into a v11 stub before being referenced as live.

---

## 5. Doctrine Artifacts

`docs/thesis/` contains no file named `DOCTRINE.md`. The doctrine-marker
files that exist in the monorepo (read-only references only):

| Path                                                                                   | Marker  |
|----------------------------------------------------------------------------------------|---------|
| `.local/payload-v1/05_DOCTRINE/DOCTRINE_V6.md`                                         | V6      |
| `.local/payload-v8/02_doctrine/DOCTRINE_V6.md`                                         | V6 (v8 payload) |
| `packages/payload/raw_v7/01_doctrine/DOCTRINE_V6.md`                                   | V6 (v7 raw) |
| `attached_assets/_v7_unzip/fly_v7_replit_payload/01_doctrine/DOCTRINE_V6.md`           | V6 (v7 unzip) |
| `packages/payload/raw/_files/thesis/fly_high_v6/DOCTRINE_SWEEP_V6.md`                  | V6 sweep |

The **live** doctrine for the current shipping repo is the thesis chain in
`docs/thesis/v9-canonical.md` + `docs/thesis/v10-canonical.md`. The above
five files are historical payload bundles preserved for provenance.

---

## 6. Next-Publication Recommendations

Concrete, ranked. Each item names the file(s) to write and the
already-existing artifact that justifies it.

1. **v11 stub for unresolved niches (CPS / Λ-gate / VSP).**
   Open `docs/thesis/v11-stub.md` with explicit "name claimed, formula TBD,
   blocker: missing physical or prisca grounding" rows. Today these names
   appear in the session-plan example list with no codex node, no API, no
   test. Until v11 lands, every reference to them in surface copy is a
   v10-audit-closure liability (a `missingArtifacts` row waiting to land).

2. **Lutar Λ₁₀ surface in a11oy `/thesis` table.**
   `docs/thesis/v10-canonical.md:237` already lists `Thesis.tsx` as the
   surface. Verify the v10 row deep-links to `POST /api/ouroboros/lutar/v10`
   so the audit oracle is a single click for the operator.

3. **Cross-link `platform/agent-gateway/` capabilities to the v10 audit
   matrix.** The gateway's 10 allowed / 5 forbidden capabilities are the
   *operational* CODE artefact for every L_k that ships behind an agent.
   Adding a "policy capability ↔ Lutar layer" appendix to v10 would make
   the audit closure auditable without leaving the doctrine document.

4. **Promote `docs/thesis/audit-chain-thesis-mapping.md` to the canonical
   chain.** It is the only document that connects v3/v4 audit primitives
   to the live `audit_chain_events.prevHash` Merkle implementation. Today
   it sits one level below `README.md` (`docs/thesis/README.md:31` does
   not link it). Either link it from the README or fold it into v10 §5.

5. **Backstage scorecard for thesis-artefact closure.**
   `platform/backstage/README.md:187-195` enumerates six scorecard
   dimensions, none of which is "thesis CODEX node present." Adding a
   `thesis-coverage` scorecard dimension that consumes
   `POST /api/ouroboros/lutar/v10` gives the IDP a live read on Λ₁₀
   per-service.

6. **Wire `platform/temporal/` Lyte-visibility events into the v9 codex.**
   The Lyte event taxonomy (`platform/temporal/README.md:41-49`) is rich
   enough to back a `temporal_workflow_*` node family in the Supreme
   Codex. Wiring it would tie governance workflows to the thesis chain
   the same way the OPA bundle is already tied via
   `evaluatePolicyActivity`.

7. **Publish v10 to arXiv per `paper/v10/` bundle.** Bundle is described
   ready in `docs/thesis/v10-canonical.md:241`. Publication closes the
   external-citation loop on Λ₁₀.

8. **Public Series-A pack: bind the eight platform packages to the eight
   Lutar layers.** Today the dossier this document seeds is the only place
   the two ladders sit side by side. A one-page exhibit mapping
   `{agent-gateway, backstage, crossplane, dapr, gitops, policy, score,
   temporal}` to `{v1..v7+Ω}` would be the single best slide for a
   technical investor read-out.

---

## 7. Provenance

Every datapoint in §2 traces to a `platform/<pkg>/README.md`,
`package.json`, or `src/*` line read at audit time. Every datapoint in §3
and §4 traces to a `docs/thesis/**` line. Every doctrine path in §5 traces
to a `glob` match run on 2026-05-18. No numbers fabricated. No source
files were modified — this is a read-only manifest as required by the T004
acceptance criteria.

— async subagent, T004, Round 4
