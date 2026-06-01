# THREAT_MODEL_STRIDE_PER_FLAGSHIP.md

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Method:** STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) applied per flagship. Each flagship lists its **top‑5 highest‑risk vectors** with a risk rating (Likelihood × Impact, 1–5) and a concrete mitigation. Ratings reflect the *current* posture (wildcard CORS, no auth, 5/6 bundles unsigned) honestly.

**Flagship roles (from anatomy audit / instill log):**
- **a11oy** — GATE ORCHESTRATION (Λ aggregator, 46 policy + 44 anchor gates, HUKLLA tripwires, LLM router). FastAPI, docker.
- **amaru** — CORTEX / reasoning (7‑chakra kernels, scheduler, YUYAY heart gate). FastAPI, docker.
- **sentra** — IMMUNE SYSTEM / dual‑use filter (`/api/sentra/*` inspect/verdict). FastAPI, docker.
- **killinchu** — COUNTER‑UAS rule engine (Remote‑ID/ADS‑B/STANAG decode, geofence/HALT policy). *Plan‑stage; inherits vessels substrate.*
- **rosie** — NERVOUS SYSTEM / operator console + brain‑jack mesh (11 tabs, a11oy `/v1/*` mirror, Khipu viz). docker.

> **Cross‑cutting vectors present on ALL flagships (counted once here, referenced below):**
> CC‑1 **Wildcard CORS** (`allow_origins=["*"]`) → any origin calls the API (Info disclosure / Spoofing). CC‑2 **No auth/IdP** → no caller identity (Spoofing / Elevation). CC‑3 **No security headers** (no CSP/HSTS/XFO) → XSS/clickjacking (Tampering). CC‑4 **5/6 UDS bundles unsigned** → supply‑chain substitution (Tampering). CC‑5 **In‑process receipts, no off‑box WORM** → receipt withholding (Repudiation/availability).

---

## 1. a11oy — Gate Orchestration

| # | STRIDE | Vector | L×I | Mitigation |
|---|---|---|---|---|
| 1 | **E**levation | Λ‑gate **bypass**: caller hits a downstream organ endpoint directly, skipping the a11oy gate (no network policy enforces "all traffic through the gate") | 4×5=**20** | Deploy in **UDS Core / Istio**: mTLS + AuthorizationPolicy so organs ONLY accept gate‑signed requests; reject unsigned. Enforce Λ floor ≥ 0.90 server‑side. |
| 2 | **T**ampering | **Prompt/policy injection** into the LLM router to coerce a gate verdict (jailbreak the conjunctive AND‑gate) | 4×4=**16** | NeMo‑Guardrails Colang input/output rails (already in design); adversarial red‑team suite (see PEN_TEST_PLAN); HUKLLA tripwire on anomalous verdict flips. |
| 3 | **S**poofing | CC‑2 + CC‑1: unauthenticated caller forges "approved" context; wildcard CORS lets a malicious site drive the gate from a victim's browser | 4×4=**16** | Keycloak SSO + per‑client API keys; lock CORS to allowlist (SECURITY_HEADERS_PATCH). |
| 4 | **R**epudiation | Receipt **withholding** (CC‑5): box‑local actor drops receipts so a denied‑then‑forced action isn't logged | 3×4=**12** | Anchor receipt heads to Rekor / append‑only WORM; alert on chain‑gap; Wire C completion for cross‑organ corroboration. |
| 5 | **I**nfo disclosure | Verbose error/stack or gate‑internal policy leak via open API + no CSP | 3×3=**9** | Generic error envelopes; disable debug; CSP; redact policy internals from responses. |

## 2. amaru — Cortex / Reasoning

| # | STRIDE | Vector | L×I | Mitigation |
|---|---|---|---|---|
| 1 | **T**ampering | **Indirect prompt injection** via retrieved/tool content poisoning the 7‑chakra reasoning chain → unsafe plan emitted | 4×5=**20** | Content provenance (sign retrieved corpus); YUYAY heart‑gate conjunctive check before act; route every plan through a11oy Λ‑gate. |
| 2 | **D**oS | Unauthenticated, unbounded reasoning requests (CC‑1/CC‑2) → token/compute exhaustion (chakra kernels are expensive) | 4×4=**16** | Rate limiting + per‑client quotas; Bekenstein‑bound action space (already doctrine); request size caps. |
| 3 | **E**levation | Tool/function‑calling escapes sandbox (model invokes a privileged action outside policy) | 3×5=**15** | Strict tool allowlist behind the gate; deny‑by‑default; HUKLLA halt on out‑of‑policy tool. |
| 4 | **I**nfo disclosure | Memory bleed across sessions (YUYAY is a gate, not an isolated store → no proven session isolation) | 3×4=**12** | Add per‑tenant memory namespace + replay test; scope YUYAY honestly until store exists. |
| 5 | **S**poofing | Model‑identity spoof: caller claims a higher‑trust persona to relax gating | 3×3=**9** | Caller identity from IdP, not from request body; bind trust to authenticated principal. |

## 3. sentra — Immune System / Dual‑Use Filter

| # | STRIDE | Vector | L×I | Mitigation |
|---|---|---|---|---|
| 1 | **T**ampering | **Filter evasion**: adversary crafts dual‑use input that the immune filter mis‑classifies as benign (the highest‑consequence failure for an immune system) | 5×5=**25** | Adversarial test corpus + continuous red‑team (recursive a11oy.code attack, PEN_TEST_PLAN); ensemble + conservative default‑deny; Wire B verdict cross‑check. |
| 2 | **E**levation | Verdict **override**: caller forges an "inspected OK" verdict to skip the immune layer (CC‑2) | 4×5=**20** | Verdicts must be DSSE‑signed by sentra and verified by a11oy gate; reject unsigned verdicts (mTLS in UDS). |
| 3 | **D**oS | Flood `/api/sentra/inspect` to delay/starve verdicts → fail‑open risk | 4×4=**16** | **Fail‑closed** semantics (no verdict ⇒ HALT, not allow); rate limit; queue backpressure. |
| 4 | **R**epudiation | Inspected‑item log gaps (CC‑5) hide a bad verdict after the fact | 3×4=**12** | Off‑box receipts; dual‑attestation already in Khipu — extend to sentra verdicts. |
| 5 | **I**nfo disclosure | Filter‑rule disclosure via open API → adversary learns exactly how to evade | 3×4=**12** | Don't return rule rationale to untrusted callers; lock CORS; tier responses by auth level. |

## 4. killinchu — Counter‑UAS Rule Engine (plan‑stage)

> **Highest‑sensitivity flagship** — touches drone telemetry that is likely **ITAR/EAR‑controlled** (see COMPLIANCE_PATH). Threats are both cyber and mission‑safety.

| # | STRIDE | Vector | L×I | Mitigation |
|---|---|---|---|---|
| 1 | **S**poofing | **Spoofed Remote‑ID / ADS‑B** broadcasts (these protocols are unauthenticated by design) → engine mis‑identifies a friendly as hostile or vice‑versa | 5×5=**25** | Multi‑sensor fusion + plausibility checks (kinematics, RF fingerprint); never auto‑actuate on a single unauthenticated source; emit Λ‑receipt with confidence + human‑in‑the‑loop on HALT. |
| 2 | **I**nfo disclosure | **Export‑control breach**: USML technical data exposed to a foreign person or via open/CORS endpoint (deemed export) | 4×5=**20** | ITAR registration + Technology Control Plan; segregate controlled repo; no‑foreign‑person access; deploy airgapped (UDS/Zarf), never on open HF for controlled data. |
| 3 | **T**ampering | **Geofence/policy tamper**: altering the counter‑UAS rule set (e.g., disabling a HALT geofence) to permit an incursion | 4×5=**20** | Sign the rule set (cosign); digest‑pin policy in deploy.yaml; Λ‑gate floor on policy changes; tamper‑evident receipts on every rule edit. |
| 4 | **D**oS | **Swarm flood**: thousands of spoofed broadcasts overwhelm the swarm‑topology graph → engine blind during a real attack | 4×5=**20** | Bounded ingest + sampling; degrade‑gracefully to coarse detection; backpressure; alert on ingest saturation. |
| 5 | **E**levation | Compromise of the airgap deploy bundle (CC‑4) substitutes a malicious rule engine at the tactical edge | 3×5=**15** | Sign + verify the UDS bundle at deploy (cosign verify gate); Reed‑Solomon k‑of‑n integrity; NeuVector runtime security in UDS Core. |

## 5. rosie — Nervous System / Operator Console + Brain‑Jack Mesh

| # | STRIDE | Vector | L×I | Mitigation |
|---|---|---|---|---|
| 1 | **T**ampering | **Stored/Reflected XSS** in the 11‑tab console (no CSP, CC‑3) → operator session hijack, can drive every mirrored a11oy `/v1/*` action | 4×5=**20** | Strict CSP (SECURITY_HEADERS_PATCH); output encoding; sanitize Khipu‑viz inputs; SRI on assets. |
| 2 | **E**levation | Console **mirrors a11oy `/v1/*`** — a hijacked console = full gate control; no operator auth (CC‑2) | 4×5=**20** | Keycloak SSO + RBAC on the console; per‑action re‑auth for HALT/override; audit every operator action to Khipu. |
| 3 | **S**poofing | **Brain‑jack mesh WebSocket** (Wire C half‑wired) accepts unauthenticated event injection → forged organ state on the live mesh | 4×4=**16** | Authenticate + sign mesh events; complete Wire C with a signed `/v1/events` receiver; origin checks. |
| 4 | **D**oS | Open WebSocket fan‑out (Wire G to 6 Spaces) → connection exhaustion blinds the operator view during an incident | 3×4=**12** | Connection limits, heartbeat/timeout, authenticated subscriptions, backpressure. |
| 5 | **I**nfo disclosure | Console surfaces cross‑organ receipts/telemetry to any viewer (CC‑1) → leaks operational detail | 3×4=**12** | AuthZ‑scope the data per role; lock CORS; redact sensitive receipt fields for lower roles. |

---

## 6. Aggregate top risks (fix order)

| Rank | Risk | Flagship(s) | Score | Fix |
|---|---|---|---|---|
| 1 | Immune‑filter evasion (fail‑open) | sentra | 25 | Adversarial corpus + fail‑closed default |
| 1 | Remote‑ID/ADS‑B spoofing → wrong engagement | killinchu | 25 | Multi‑sensor fusion + human‑in‑loop |
| 3 | Λ‑gate bypass / verdict override | a11oy, sentra | 20 | UDS Istio mTLS + signed‑verdict enforcement |
| 3 | Console XSS / hijack → full gate control | rosie | 20 | CSP + Keycloak SSO + RBAC |
| 3 | Export‑control / geofence tamper / swarm flood | killinchu | 20 | ITAR + signed rules + bounded ingest |
| 3 | Prompt‑injection of reasoning/gate | amaru, a11oy | 16–20 | Guardrails rails + provenance + HUKLLA halt |

**Single highest‑leverage mitigation:** deploy the fleet inside **UDS Core** (Istio mTLS + Keycloak SSO + NeuVector + Pepr policy). It closes CC‑1, CC‑2, CC‑3 (network/identity) and most "bypass/override/XSS‑to‑gate" elevation paths in one move — and aligns with the IL5 compliance trajectory.

---

## Sources
- STRIDE (Microsoft Threat Modeling): <https://learn.microsoft.com/en-us/azure/security/develop/threat-modeling-tool-threats>
- Internal roles: `320_INSTILL_ALL_INTO_EVERY_AGENT.md`, `91_OPUS_SENTRA_FULL_SHIP.md`, `93_OPUS_ROSIE_FULL_SHIP.md`, `110_ANATOMY_COMPLETENESS_AUDIT.md`, `470_WAMANI_DRONE_PIVOT_PLAN.md`, `killinchu_research_notes.md`.
- Remote‑ID is unauthenticated (ASTM F3411 / FAA RID): see `killinchu_research_notes.md §5`.
- UDS Core controls: <https://github.com/defenseunicorns/uds-core>

*— Yachay, 2026-06-01.*
