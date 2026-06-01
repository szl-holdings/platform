# Technical Due Diligence Index

> SZL Holdings · Series A Package · April 2026

This index maps common technical due diligence questions to the authoritative documentation sources in this repository. All documents listed are in the public repository unless marked **[Internal]**.

---

## 1. Architecture and Stack

| Question | Document |
|----------|----------|
| What is the system architecture? | [`docs/architecture/architecture.md`](../architecture/architecture.md) |
| What are the platform primitives? | [`docs/architecture/platform-primitives.md`](../architecture/platform-primitives.md) |
| What is the data model? | [`docs/architecture/data-model.md`](../architecture/data-model.md) |
| What is the technology stack? | README — Architecture section |
| How are services deployed? | [`docs/operations/deployment-guide.md`](../operations/deployment-guide.md) |
| What is the production infrastructure? | [`ops/infra/target-production-architecture.md`](../../ops/infra/target-production-architecture.md) |
| How are environments separated? | [`ops/infra/environment-matrix.md`](../../ops/infra/environment-matrix.md) |
| What is the monorepo structure? | README — Repository Map; [`CONTRIBUTING.md`](../../CONTRIBUTING.md) |
| How is the API typed and documented? | [`docs/architecture/api-spec.md`](../architecture/api-spec.md) |

---

## 2. Security and Compliance

| Question | Document |
|----------|----------|
| What is the security policy? | [`SECURITY.md`](../../SECURITY.md) |
| What is the access control model? | [`docs/security/access-control-matrix.md`](../security/access-control-matrix.md) |
| What are the security controls? | [`SECURITY-CHECKLIST.md`](../../SECURITY-CHECKLIST.md) |
| How is the audit trail implemented? | [`docs/architecture/platform-primitives.md`](../architecture/platform-primitives.md) — Proof Chain |
| How is AI governance enforced? | [`docs/architecture/platform-primitives.md`](../architecture/platform-primitives.md) — Covenant Policy |
| How are multi-tenant boundaries enforced? | README — Trust section; architecture docs |
| What is the secret scanning posture? | [`docs/audit/SECURITY_POSTURE_AUDIT.md`](../audit/SECURITY_POSTURE_AUDIT.md) |
| What is the vulnerability disclosure process? | [`SECURITY.md`](../../SECURITY.md) |

---

## 3. Engineering Quality

| Question | Document |
|----------|----------|
| What does CI look like? | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) |
| What is tested? | [`docs/audit/FINAL_VALIDATION_REPORT.md`](../audit/FINAL_VALIDATION_REPORT.md) |
| What is the code review process? | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — PR Workflow |
| What are the branch protection rules? | [`.github/BRANCH_PROTECTION.md`](../../.github/BRANCH_PROTECTION.md) |
| What are the TypeScript practices? | [`CONTRIBUTING.md`](../../CONTRIBUTING.md) — Engineering Standards |
| What is the known technical debt? | [`docs/operations/known-gaps.md`](../operations/known-gaps.md) |
| What is the test coverage? | [`docs/audit/FINAL_VALIDATION_REPORT.md`](../audit/FINAL_VALIDATION_REPORT.md) |

---

## 4. Product and Platform

| Question | Document |
|----------|----------|
| What is the platform thesis? | [`docs/investor/platform-thesis.md`](platform-thesis.md) |
| What artifacts are GA/Beta/Archived? | [`docs/APP_STATUS.md`](../APP_STATUS.md) |
| What is the product portfolio? | README — Product Portfolio |
| What are the platform metrics? | [`docs/platform-facts.md`](../platform-facts.md) |
| How does the mobile app work? | [`ops/mobile/flagship-release-readiness.md`](../../ops/mobile/flagship-release-readiness.md) |
| What is the demo path? | [`docs/investor/DEMO_PATHS.md`](DEMO_PATHS.md) |

---

## 5. Operations and Scalability

| Question | Document |
|----------|----------|
| How is the platform operated? | [`docs/operations/operations-runbook.md`](../operations/operations-runbook.md) |
| What is the backup and recovery plan? | [`ops/infra/recovery-and-backup-model.md`](../../ops/infra/recovery-and-backup-model.md) |
| What are the SLOs and alerting? | [`docs/SLOS_AND_ALERTS.md`](../SLOS_AND_ALERTS.md) |
| What is the release process? | [`RELEASE_CHECKLIST.md`](../../RELEASE_CHECKLIST.md) |
| What is the go/no-go launch scorecard? | [`ops/frontier/launch-readiness-scorecard.md`](../../ops/frontier/launch-readiness-scorecard.md) |

---

## 6. Governance

| Question | Document |
|----------|----------|
| What is the open-source policy? | [`docs/governance/OPEN_SOURCE_BOUNDARY.md`](../governance/OPEN_SOURCE_BOUNDARY.md) |
| What is the public/private strategy? | [`docs/governance/PUBLIC_PRIVATE_STRATEGY.md`](../governance/PUBLIC_PRIVATE_STRATEGY.md) |
| What is the branch protection policy? | [`docs/governance/BRANCH_PROTECTION_POLICY.md`](../governance/BRANCH_PROTECTION_POLICY.md) |
| What is the screenshot policy? | [`docs/governance/SCREENSHOT_POLICY.md`](../governance/SCREENSHOT_POLICY.md) |
| Who owns what code? | [`.github/CODEOWNERS`](../../.github/CODEOWNERS) |

---

*SZL Holdings · Series A Technical Due Diligence Package · April 2026*
