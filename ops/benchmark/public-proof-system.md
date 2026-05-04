# Public Proof System

**Last updated:** April 2026
**Purpose:** Define how SZL proves its claims publicly, inspired by Vanta/Drata/Chainguard trust patterns

---

## Competitive Trust Patterns

### Vanta Trust Center
- Customer-facing branded portal for sharing security posture
- Auto-updated compliance status (SOC 2, ISO 27001, HIPAA)
- NDA-gated document sharing for sensitive artifacts
- Self-serve access for prospects — no sales call required
- Trust center as GTM asset, not legal checkbox

### Drata Trust Center
- Real-time control monitoring (350+ controls)
- Compliance automation across 14+ frameworks
- Evidence auto-collection from infrastructure
- Public-facing compliance dashboard
- API-driven evidence gathering

### Chainguard
- "The trusted source for open source"
- Zero-CVE container images as proof of supply chain security
- Transparency logs for build provenance
- Trust positioning as competitive differentiator
- Makes security a *feature*, not a cost center

---

## SZL's Proof Architecture

SZL's proof system operates at three levels:

### Level 1: Platform Proof (Internal)
Every decision in the platform produces a Proof Chain record — immutable, attributed, hashable. This is the operational proof layer.

| Proof Artifact | What It Proves |
|---------------|---------------|
| ProofRecord | AI recommendation was governed — model, confidence, sources, review state |
| DecisionReceipt | Human approved action based on evidence and simulation |
| ActionReceipt | Execution was attributed and timed |
| OutcomeRecord | Predicted outcome was compared to actual result |

### Level 2: Trust Center (External)
A public-facing trust center that proves SZL's platform governance claims, inspired by Vanta/Drata:

| Artifact | Access | Auto-Updated |
|----------|--------|-------------|
| Security posture summary | Public | Yes |
| Encryption standards | Public | No |
| Role hierarchy and access control matrix | Public | No |
| API security standards | Public | No |
| Compliance framework coverage | Public | No |
| Audit trail architecture documentation | Public | No |
| Penetration test summary | NDA-gated | No |
| SOC 2 Type II report (target) | NDA-gated | Annual |

### Level 3: Open Source Proof (Maximum Transparency)
Open-source the governance primitives to prove the architecture is real:

| Artifact | Purpose |
|----------|---------|
| `lib/proof-chain/` on GitHub | Proves immutable audit trail is real code, not marketing |
| `lib/covenant-policy/` on GitHub | Proves policy engine is real, not a UI wrapper |
| `lib/monte-carlo/` on GitHub | Proves simulation is real probabilistic computation |
| `lib/prism-bus/` on GitHub | Proves event fabric is a real pub/sub system |
| `lib/outcome-graph/` on GitHub | Proves outcome tracking is a real closed-loop system |

---

## SZL-Specific Trust Differentiators

### 1. Proof Chain as Differentiator
Vanta proves you follow rules. SZL proves you make good decisions. The Proof Chain records:
- WHO recommended (agent attribution)
- WHAT evidence was cited (input sources)
- HOW confident the AI was (calibrated confidence score)
- WHO approved (human attribution)
- WHAT the policy said (Covenant verdict)
- WHAT actually happened (outcome tracking)

### 2. Open Governance Primitives
Chainguard made supply chain security transparent. SZL can make decision governance transparent by open-sourcing the primitive libraries. Investors and buyers can inspect the actual code, not just marketing claims.

### 3. Decision Receipts as Export Artifacts
Every governed decision can be exported as a structured receipt — PDF or JSON — for external compliance, legal discovery, or investor diligence. This is unique to SZL.

---

## Implementation Priority

1. **Trust center page** on flagship site with security posture summary (P0)
2. **GitHub repo** visibility for governance primitive libraries (P0 for growth capital)
3. **NDA-gated document sharing** for sensitive compliance artifacts (P1)
4. **Decision receipt export** as PDF/JSON for enterprise buyers (P1)
5. **Real-time control monitoring** dashboard for internal ops (P2)
