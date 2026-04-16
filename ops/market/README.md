# ops/market/ — Source-of-Truth Index

**Last updated:** April 2026  
**Purpose:** Index of all market readiness documents with the canonical upstream source for technical and security claims.

---

## Document Index

### Phase A: Category and Positioning
| Document | Source Truth |
|---|---|
| `category-story-final.md` | `CATEGORY_POSITIONING.md`, `PLATFORM_PRIMITIVES.md` |
| `public-buyer-journey-final.md` | `ops/growth/funnel-map.md` |
| `no-commodity-positioning-pass.md` | `CATEGORY_POSITIONING.md`, `COMPANY_FACT_SHEET.md` |

### Phase B: Trust and Diligence
| Document | Source Truth |
|---|---|
| `diligence-fast-path-final.md` | `ops/security/threat-model-summary.md`, `ops/backend/authz-matrix.md` |
| `trust-center-launch-pass.md` | `ops/security/threat-model-summary.md`, `ops/security/secret-inventory.md` |
| `buyer-evaluation-map.md` | `COMPANY_FACT_SHEET.md`, `docs/buyer/` |

### Phase C: Proof Engine
| Document | Source Truth |
|---|---|
| `proof-engine-final.md` | Internal design — no upstream dependency |
| `pilot-to-case-study-playbook.md` | Internal design |
| `referenceability-ladder.md` | Internal design |

### Phase D: Design Partner Operations
| Document | Source Truth |
|---|---|
| `design-partner-offer.md` | `COMPANY_FACT_SHEET.md`, `DESIGN_PARTNER_PROGRAM.md` |
| `design-partner-operating-model.md` | Internal design |
| `first-30-days-partner-plan.md` | Internal design |

### Phase E: Packaging and Commercial
| Document | Source Truth |
|---|---|
| `packaging-model-final.md` | `COMPANY_FACT_SHEET.md`, `PRODUCT_PACKAGING.md`, `PRICING_PACKAGING.md` |
| `founder-pricing-notes-final.md` | Internal — not for external sharing |
| `pilot-to-production-commercial-path.md` | Internal design |

### Phase H: Environment and Operations
| Document | Source Truth |
|---|---|
| `environment-and-release-final.md` | `ops/replit/deployment-decision.md`, `ops/github/release-plan.md` |
| `post-deploy-verification-final.md` | `ops/observability/post-deploy-smoke-tests.md` |
| `founder-support-control-room.md` | `ops/observability/slo-catalog.md`, `docs/internal/ops/incident-response-runbook.md` |

### Phase I: API and Technical
| Document | Source Truth |
|---|---|
| `api-commercial-readiness.md` | `ops/backend/api-standards.md` |
| `integration-priority-map.md` | `ops/backend/api-standards.md` |
| `technical-evaluator-brief.md` | `ops/backend/api-standards.md`, `ops/backend/authz-matrix.md`, `COMPANY_FACT_SHEET.md` |

### Phase J: Mobile and Manual Operations
| Document | Source Truth |
|---|---|
| `mobile-beta-final.md` | `ops/mobile/testflight-play-internal-runbook.md`, `ops/mobile/flagship-mobile-release-plan.md` |
| `manual-console-actions-master-final.md` | `ops/mobile/testflight-play-internal-runbook.md`, `ops/security/secret-inventory.md`, `ops/github/release-plan.md` |
| `beta-support-flow.md` | Internal design |

### Phase K: Launch Kit
| Document | Source Truth |
|---|---|
| `founder-launch-kit.md` | Synthesizes all phases |
| `founder-next-90-days.md` | Synthesizes all phases |
| `weekly-operating-pack.md` | `ops/observability/slo-catalog.md` |

### Final Deliverables
| Document | Source Truth |
|---|---|
| `executive-summary.md` | Synthesizes all phases |
| `what-changed.md` | Synthesizes all phases |
| `manual-actions-left.md` | `ops/security/secret-inventory.md`, `ops/mobile/testflight-play-internal-runbook.md` |
| `market-readiness-scorecard.md` | Synthesizes all phases |
| `founder-next-15-actions.md` | Synthesizes all phases |
| `go-to-market-readiness-verdict.md` | `market-readiness-scorecard.md` |

---

## Key Canonical Sources for Technical Claims

When any market document makes a claim about platform capabilities, that claim must be traceable to one of these canonical sources:

| Claim Category | Canonical Source |
|---|---|
| **API behavior** (auth, rate limits, endpoints, error codes) | `ops/backend/api-standards.md` |
| **Authorization** (roles, permissions, endpoint access) | `ops/backend/authz-matrix.md` |
| **Security controls** (threat model, STRIDE, residual risks) | `ops/security/threat-model-summary.md` |
| **Secret management** (what is in Replit Secrets, what is unknown) | `ops/security/secret-inventory.md` |
| **Deployment model** (Autoscale vs Reserved VM, env vars) | `ops/replit/deployment-decision.md` |
| **Platform scale metrics** (table count, package count, artifact count) | `COMPANY_FACT_SHEET.md` |
| **Technology stack** | `COMPANY_FACT_SHEET.md` |
| **Mobile operations** | `ops/mobile/testflight-play-internal-runbook.md` |
| **SLO targets** | `ops/observability/slo-catalog.md` |
| **Release process** | `ops/github/release-plan.md` |

---

## RBAC Canonical Reference

The role hierarchy has 6 external-facing levels as defined in `ops/backend/authz-matrix.md`:

```
super_admin > ops > manager > analyst > viewer > guest
```

`COMPANY_FACT_SHEET.md` references "11-role RBAC" — this reflects the internal granularity of the RBAC system (which includes additional sub-roles and domain-specific role variants beyond the 6 top-level tiers). For external communications and diligence, use the 6-level description from `authz-matrix.md`. Reference the authz matrix directly for authoritative access control documentation.

---

## Validation Cadence

These documents should be reviewed and updated when:
- Any upstream ops or security document is updated
- Platform capabilities or technical stack changes
- Commercial terms or packaging model changes
- Compliance status changes (SOC 2 milestone, pen test completion)
- Quarterly at minimum (set a calendar reminder)

**Owner:** Founder (currently). Transition to commercial ops role when hired.
