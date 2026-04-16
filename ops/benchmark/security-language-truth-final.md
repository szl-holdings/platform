# Security Language Truth

**Last updated:** April 2026
**Purpose:** Ensure security claims match implemented reality

---

## Principle: Claim Only What's Implemented

Inspired by Chainguard's approach — their "zero known CVEs" claim is backed by automated scanning and public transparency logs. Every security claim SZL makes must be provably true.

---

## Security Claims Audit

| Claim | Status | Evidence |
|-------|--------|---------|
| "AES-256-GCM field-level encryption" | ✅ TRUE | `lib/encryption/src/encrypt.ts` — HMAC-SHA256 key derivation, AES-256-GCM with auth tags |
| "Role-based access control with 11-role hierarchy" | ✅ TRUE | `ACCESS-CONTROL-MATRIX.md` — super_admin through guest, server-side enforcement |
| "Org-scoped data isolation" | ✅ TRUE | `callerOrgIds` + `inArray` guards on all data queries |
| "Structured audit logging" | ✅ TRUE | Pino structured logs with request IDs and correlation IDs |
| "Rate limiting on all endpoints" | ✅ TRUE | Global 200/15m, auth 10/15m, public submissions 5/hr |
| "Input validation with Zod" | ⚠️ PARTIAL | Auth routes validated; not all write routes covered |
| "Immutable proof chain" | ✅ TRUE (in-app) | `lib/proof-chain/` — append-only records with SHA-256 hashes |
| "SOC 2 Type II compliant" | ❌ NOT YET | Target, not current state — do not claim |
| "Penetration tested" | ❌ NOT YET | No third-party pentest completed |
| "GDPR compliant" | ❌ NOT YET | No formal GDPR assessment completed |

---

## Language Guidelines

### Do Say
- "Built with AES-256-GCM encryption, role-based access control, and structured audit logging"
- "Every AI recommendation carries source attribution and confidence scores via our Proof Chain"
- "Decision governance enforced by the Covenant Policy Engine with configurable approval gates"
- "Targeting SOC 2 Type II certification" (honest about timeline)

### Don't Say
- "Enterprise-grade security" (vague, unsubstantiated)
- "SOC 2 compliant" (not yet true)
- "Military-grade encryption" (meaningless marketing)
- "Unhackable" or "100% secure" (never true)
- "Blockchain-based audit trail" (Proof Chain is not blockchain)

### Honest Caveats
- "Zod validation covers authentication routes; expansion to all write endpoints is in progress"
- "Proof Chain records are immutable within the application layer; database-level immutability requires external audit log sink"
- "Rate limiting is enforced at the application level; infrastructure-level DDoS protection depends on deployment platform"

---

## Security Documentation Inventory

| Document | Purpose | Status |
|----------|---------|--------|
| `SECURITY.md` | Responsible disclosure policy | ✅ Complete |
| `ACCESS-CONTROL-MATRIX.md` | Role permissions matrix | ✅ Complete |
| `ops/security/threat-model-summary.md` | STRIDE threat model | ✅ Complete |
| `ops/security/production-hardening-checklist.md` | Deployment security checklist | ✅ Complete |
| `TRUST_CENTER_INDEX.md` | Public trust center content | ✅ Complete |
| Third-party pentest report | External security validation | ❌ Not started |
| SOC 2 Type II report | Compliance certification | ❌ Not started |
| GDPR DPIA | Data protection impact assessment | ❌ Not started |

---

## Competitive Positioning

| Competitor | Security Claim Style | SZL Approach |
|-----------|---------------------|-------------|
| Palantir | "Built for classified environments" — backed by FedRAMP, ITAR | Claim specific implementations, not environment certifications |
| Vanta | "Automate compliance" — backed by continuous monitoring | SZL proves *decisions*, not just *controls* |
| Chainguard | "Zero known CVEs" — backed by automated scanning + SBOM | SZL should adopt measurable claims: "100% of AI outputs have proof records" |

The strongest security positioning is specific and provable. "Every AI recommendation has a proof chain record" is stronger than "enterprise-grade security."
