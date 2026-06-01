# PEN_TEST_PLAN.md — first‑party + third‑party penetration testing

**Author:** Yachay (CTO authority) · **Date:** 2026-06-01 · **Doctrine v11 LOCKED (749/14/163).**
**Two tracks:** (A) **first‑party** continuous red‑team using **a11oy.code orchestrating attacks against SZL itself** — a recursive proof‑of‑resilience; (B) **third‑party** — public bug bounty (HackerOne/Bugcrowd) + annual pentest by a certified firm. The third‑party annual pentest is also a **SOC 2 requirement** (see COMPLIANCE_PATH).

---

## Track A — First‑party: recursive a11oy.code red‑team

**Concept:** point the unified‑LLM agentic engine (a11oy.code) at SZL's own attack surface. Every attack run is itself gated by the Λ aggregator and emits a **Khipu receipt**, so the red‑team produces signed, replayable evidence of resilience — *the system proves it can attack and withstand itself.*

**Scope (per STRIDE top risks):**
| Target | Attack the agent runs | Pass criterion |
|---|---|---|
| a11oy gate | prompt‑injection / jailbreak corpus → attempt verdict flip & gate bypass | gate holds Λ ≥ 0.90; no bypass; HUKLLA fires on anomaly |
| sentra immune | dual‑use evasion corpus → mis‑classify malicious as benign | **fail‑closed**; no false‑benign on the corpus |
| amaru cortex | indirect injection via poisoned retrieval/tool content | unsafe plan blocked at YUYAY + a11oy gate |
| killinchu | spoofed Remote‑ID/ADS‑B + geofence‑tamper + swarm‑flood replay | no auto‑engage on single source; rules signature‑verified; ingest bounded |
| rosie console | XSS payload corpus + WebSocket event injection | CSP blocks; mesh events rejected if unsigned |
| edge | CORS abuse, header fuzz, Mapbox‑token exfil | allowlist enforced; token not returned |

**Mechanics:**
1. Attack‑suite lives in a sandboxed repo (`szl-holdings/redteam`), never against production data; targets ephemeral staging clones of each Space.
2. a11oy.code generates + mutates payloads (fuzzing the gate, the immune filter, the console).
3. Each run writes a **Khipu receipt** (attack id, target, payload hash, verdict, outcome) → tamper‑evident resilience ledger.
4. CI gate: a curated regression subset runs on every PR (`adversarial/` tests already exist, e.g. `receipt_chain_corruption.test.ts`); the broader generative suite runs nightly.
5. Findings feed the PSIRT process (VULNERABILITY_RESPONSE_POLICY) with severity + SLA.

**Guardrails (so the red‑team can't go rogue):** the attacking agent itself runs under HUKLLA tripwires + Λ floor; targets are allowlisted staging hosts only; no real customer/USML data in scope (export‑control safe).

**Cost/timeline:** internal eng time (~2 wks to stand up harness + corpus); near‑zero marginal cost thereafter (uses existing credits/compute). Continuous.

---

## Track B — Third‑party

### B1. Bug bounty (public VDP → paid program)
- **Phase 1 (now):** publish a free **Vulnerability Disclosure Policy** + `security.txt` (see VULNERABILITY_RESPONSE_POLICY) — coordinated disclosure, no bounty, safe‑harbor language. Cost: ~$0.
- **Phase 2 (post‑SOC 2 readiness):** launch a paid program on **HackerOne** or **Bugcrowd**.
  - Platform fee: managed programs typically **~$10k–$50k/yr** (tier‑dependent) plus bounties.
  - Bounty pool: budget **$25k–$100k/yr** initial; reward by severity (e.g., Critical $2.5k–$10k, High $1k–$2.5k, Medium $250–$750, Low $50–$150).
- Scope: the 8 public Spaces + APIs; out‑of‑scope: anything USML/export‑controlled (those are airgapped, not bountied).

### B2. Annual third‑party pentest (certified firm)
- **Why:** SOC 2 expects an independent annual pentest; FedRAMP requires assessment by an **A2LA‑accredited 3PAO** (separate, larger).
- **Scope:** external + web‑app pentest of the flagships and APIs; authenticated testing once SSO lands; cloud‑config review on GovCloud landing zone.
- **Cost:** a focused web‑app/external pentest runs **~$8k–$15k** (SOC 2‑grade); enterprise/scoped engagements $25k–$50k. ([SOC 2 all‑in budget incl. pentest](https://soc2auditors.org/insights/soc-2-software-pricing-comparison/))
- **Cadence:** annual + after any major architecture change (e.g., UDS Core migration); retest after remediation.

---

## Combined schedule

| When | Activity | Track | Cost |
|---|---|---|---|
| Wk 0–2 | Stand up a11oy.code red‑team harness + Khipu resilience ledger | A | internal |
| Wk 1 | Publish VDP + `security.txt` (safe harbor) | B1‑P1 | ~$0 |
| Wk 2+ | Nightly generative red‑team; PR regression gate | A | internal |
| Mo 2–3 | First third‑party web‑app pentest (SOC 2 readiness) | B2 | $8k–$15k |
| Mo 4+ | Launch paid bug bounty (HackerOne/Bugcrowd) | B1‑P2 | $35k–$150k/yr |
| Annual | Recurring certified pentest + bounty | B2/B1 | budgeted |

**Definition of done (Track A):** every STRIDE top‑5 vector per flagship has a passing adversarial test in the regression suite, with Khipu‑receipted evidence. **Track B:** live VDP, at least one completed third‑party pentest with remediation closed, paid bounty program open.

---

## Sources
- HackerOne: <https://www.hackerone.com/> · Bugcrowd: <https://www.bugcrowd.com/>
- SOC 2 pentest budgeting: <https://soc2auditors.org/insights/soc-2-software-pricing-comparison/>
- FedRAMP 3PAO assessment: <https://www.fedramp.gov/>
- Internal: `THREAT_MODEL_STRIDE_PER_FLAGSHIP.md`, `110_ANATOMY_COMPLETENESS_AUDIT.md` (existing `adversarial/` tests).

*— Yachay, 2026-06-01. Recursive proof‑of‑resilience: the system attacks itself and receipts the result.*
