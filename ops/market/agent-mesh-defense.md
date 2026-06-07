# Agent Mesh Defense — Market Differentiation Brief

**Product Area:** Sentra — Cyber Resilience Command
**Feature:** Agent Mesh (Mesh Map, Exposures, Containment Rules, Mesh Drift, Connectors)
**Positioning:** Governed AI supply chain defense as an operational discipline, not a dashboard

---

## The Category

AI agents reading configs, holding tokens, calling MCP tools, and chaining to external services have created an entirely new attack surface. The 2025–26 market saw a wave of standalone products attempt to address pieces of this:

- **Runlayer** — MCP gateway / traffic proxy
- **Lakera** — API-layer prompt injection classifier
- **GitGuardian** — Secrets in repositories and configs
- **Emerging entrants** — Various "agent scanner" tools focused on single-dimension detection

Each of these ships as a dedicated scanner or proxy. None of them embed detection results into a governed decision workflow, route fixes through policy approvals, generate immutable proof chains, or model the financial blast radius of a compromised agent token.

---

## What SZL Ships Instead

Sentra's Agent Mesh is the only solution that treats AI-agent security as a **governed operational discipline** — not a dashboard you look at, but a decision system you act through.

### The Five Dimensions Competitors Cannot Match

**1. Governed Remediation via Guardian**
Every finding in Mesh Exposures produces a `Run Fix` button. That button does not silently execute — it opens a ProofEnvelope and routes through Guardian's approval flow. The fix is tier-policy aware: critical-tier changes require principal sign-off before execution. No other agent security product has a governed approval gate.

**2. Immutable Proof Chain via Trust Provenance**
Every detection, rule change, and fix execution writes an immutable proof row tagged `agent-mesh` into Trust Provenance. This creates a complete, auditable history that is ready for SOC 2, ISO 27001, and insurance carrier review. Competitors produce alerts; we produce evidence.

**3. Mesh Resilience Index (Not a Score)**
The Mesh Resilience Index is a composite of seven named sub-indices: Secret Hygiene, Permission Surface, Supply Chain, Egress Containment, Schedule Hygiene, Instruction-Tampering Risk, and Cross-Agent Blast Radius. Each sub-index is independently inspectable, has documented weights, and ties to specific OWASP LLM 2025 / OWASP Agentic 2026 categories. No competitor offers this decomposed, auditable index.

**4. Cross-Asset Financial Blast Radius**
Sentra can model what a compromised GITHUB_TOKEN is worth in dollar terms by linking to the Asset Risk Graph and Exposure Board. If an agent token grants push access to the production deployment repository, Sentra can estimate the downstream operational loss, insurance clause impact, and regulatory exposure. No standalone agent scanner does this.

**5. Policy-Aware Containment Rules**
Containment Rules define what each agent class is permitted to do — which MCP servers it can connect to, which tools it can invoke, which filesystem paths it can read, which egress domains it can reach. Violations automatically become Exposures. Rules are tier-aware (critical / elevated / standard) and integrated with Guardian's existing policy tier system. Runlayer offers a gateway, but not a policy engine tied to organizational governance tiers.

---

## Attack Surface Coverage

| Category | SZL Agent Mesh | Runlayer | Lakera | GitGuardian |
|---|---|---|---|---|
| Secret detection in MCP configs | ✓ | — | — | Partial |
| Egress domain enforcement | ✓ | ✓ (proxy) | — | — |
| Supply chain version pinning | ✓ | — | — | — |
| Instruction tampering detection | ✓ | — | Partial | — |
| Cross-agent blast radius graph | ✓ | — | — | — |
| Governed approval workflow | ✓ | — | — | — |
| Immutable proof chain | ✓ | — | — | — |
| Financial impact modeling | ✓ | — | — | — |
| Pulse executive briefing integration | ✓ | — | — | — |

---

## OWASP Mapping

The Exposures view maps every finding to OWASP LLM Top 10 2025 and OWASP Agentic AI Top 10 2026 categories:

- **LLM01** — Prompt Injection / Instruction Tampering (CLAUDE.md permissions)
- **LLM06** — Excessive Permissions (filesystem MCP unrestricted home access)
- **LLM08** — Excessive Agency / Credential Exfiltration (GITHUB_TOKEN blast radius)
- **Agentic-03** — Supply Chain Injection / MCP Trojan (ext-scraper-v2 quarantine)

Known CVE references are surfaced where applicable (e.g., CVE-2025-6514 for mcp-remote token exfiltration, CVE-2025-32711 for EchoLeak context injection).

---

## Vocabulary & Originality

SZL uses original terminology throughout. The following competitor product names and terms are **permanently disallowed** from all code, UI copy, file names, and documentation:

- RootShield, Skill Shield, Context Shield
- Posture Score (we use Mesh Resilience Index)
- Lakera Guard, Lakera
- Runlayer
- GitGuardian
- prompt-armor, shield-score, agent-score

The CI originality check (`scripts/check-originality.sh`) enforces this at commit time.

---

## Demo Scenario

1. Operator opens Sentra → Agent Mesh → Mesh Map
2. Mesh Resilience Index shows D/38 — immediately visible at top
3. Sub-indices reveal Secret Hygiene (22) and Cross-Agent Blast Radius (18) as worst-performers
4. Click on GITHUB_TOKEN node in the middle column — blast radius shows 4 agents and 2 MCP servers connected
5. Navigate to Exposures — top finding: "GITHUB_TOKEN reachable by 4 agents" with CVE-2025-6514 reference
6. Click Run Fix → ProofEnvelope opens → routes to Guardian Approvals
7. Operator approves in Guardian → fix executes → proof row added to Trust Provenance tagged `agent-mesh`
8. Pulse daily briefing (next morning) shows Mesh Resilience Index ticked up, top exposure resolved, zero pending approvals
9. Investor/auditor asks for evidence → Trust Provenance shows full immutable chain from detection to approved fix

---

*Last updated: April 2026*
