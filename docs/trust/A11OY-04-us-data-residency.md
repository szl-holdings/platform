# A11oy — US Data Residency Policy

**Document ID:** A11OY-COMP-RES-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** Empire APEX, US public-sector buyers, healthcare customers, data-sovereignty-sensitive procurements
**Classification:** Public

---

## 1. Statement

SZL Holdings offers A11oy in two production postures:

| Posture | Default region | Data-residency guarantee |
|---|---|---|
| **Commercial (default)** | Hetzner — Falkenstein, Germany (EU) | Customer data resides in EU. No US-origin guarantee. |
| **US-only ("A11oy US")** | AWS GovCloud (US) — `us-gov-west-1` and/or `us-gov-east-1` | All customer data, derived data, telemetry, logs, and backups remain in the US. No data leaves US borders at rest, in transit, or in processing. |

**A11oy US** is the posture intended for any buyer subject to US data-residency requirements (including most US state governments, federal agencies, US healthcare entities under HIPAA, US-only contracts with data-localization clauses, and any deployment where CUI may be present).

This document defines what "US-only" means in operational terms, including the corner cases that often go undocumented.

## 2. Architecture under "A11oy US"

### 2.1 Compute and storage

- **Application servers:** AWS GovCloud (US) — EC2 / ECS / EKS within a customer-dedicated VPC
- **Database (Postgres):** AWS RDS for PostgreSQL in the same GovCloud region
- **Object storage:** AWS S3 in GovCloud
- **Queue:** AWS SQS in GovCloud
- **Secrets:** AWS Secrets Manager + AWS KMS (FIPS 140-2/3 validated endpoints) in GovCloud
- **Backups:** Cross-AZ within the same GovCloud region; cross-region backup is opt-in to the secondary GovCloud region only

### 2.2 Identity and access

- SZL operator access uses hardware-key MFA-bound principals into GovCloud only.
- No SZL operator account in commercial AWS has access to A11oy-US tenants.
- Just-in-time elevation through AWS IAM Identity Center; sessions logged to the customer's CloudTrail.

### 2.3 LLM and tool calls — the corner case most vendors fudge

The single most common failure point in vendor "US data residency" claims is third-party LLM calls leaving the residency boundary. SZL Holdings is explicit:

| Setting | Behavior |
|---|---|
| `A11OY_LLM_ROUTER_MODE=us_only` (default for A11oy US) | Only US-region LLM endpoints are allowed. Today: AWS Bedrock (US regions), Azure OpenAI on Azure Government, AWS-hosted open-weights models. |
| `A11OY_LLM_ROUTER_ALLOW_NON_US=false` (enforced) | Any attempt to route to a non-US endpoint is hard-blocked at the policy guard, logged, and surfaces as a `policy_violation` event. |
| Customer-provided model | Customers may bring their own US-hosted model endpoints; A11oy will not call any endpoint outside the explicit allowlist. |

LLM **provider-side data retention** is also disclosed:

- AWS Bedrock — no model-provider retention by default; data does not leave AWS GovCloud.
- Azure OpenAI on Azure Government — Microsoft commercial OpenAI not available; Azure-hosted models only; no provider-side training on customer data.
- Self-hosted open-weights models — fully under customer control.

### 2.4 Outbound integrations

A11oy hosts customer-defined connectors. For "A11oy US" deployments, the customer's connectors are subject to the same US-only egress allowlist enforced by `aef-policy-guard`. If a customer connector targets a non-US endpoint, the customer is making the residency choice explicitly via signed policy.

### 2.5 Support and operator location

- **SZL Holdings is a US entity.** Founder and primary operator is a US person (US citizen, US-resident).
- For "A11oy US" deployments, support access is **US-persons-only.** SZL will execute a US-persons-only support attestation per contract.
- Support tickets, screen-shares, and incident-response sessions never copy customer data out of the GovCloud boundary.

## 3. Telemetry and observability

| Telemetry stream | Default destination under "A11oy US" |
|---|---|
| Application metrics (Prometheus) | AWS Managed Prometheus in GovCloud |
| Application logs | AWS CloudWatch Logs in GovCloud |
| Distributed tracing | AWS X-Ray in GovCloud |
| Error tracking | Self-hosted in customer GovCloud account; commercial Sentry **not** used in A11oy US |
| Product analytics | Disabled. SZL does not collect product-analytics telemetry from A11oy US tenants. |
| Crash dumps | Stored in customer GovCloud S3 bucket with `aws:kms` encryption |

## 4. Cross-border safeguards

For commercial deployments where customer data may transit between EU and other jurisdictions, SZL relies on:

- EU Standard Contractual Clauses (2021/914) for processor-to-processor transfers
- DPF (Data Privacy Framework) where applicable for transfers from EU to US
- Customer-specific data processing addenda

For "A11oy US" deployments, no cross-border transfer occurs by design.

## 5. What is NOT in scope of "US-only"

We disclose this honestly because most vendors don't:

- **Customer-supplied data destinations.** If a customer connector explicitly writes to a non-US endpoint (e.g., a non-US Slack workspace), A11oy enforces the customer's own policy. The customer owns that residency choice.
- **DNS resolution.** DNS queries traverse the public internet; resolver providers may be globally distributed. Query *contents* are domain names, not customer data.
- **Public CDN-fronted assets.** Public-only marketing assets on `szlholdings.com` use CloudFront (commercial). The A11oy US application plane does not.

## 6. Audit and verification

- AWS GovCloud account ID for the A11oy US tenant is shared with the customer at deployment time.
- The customer can attach the GovCloud account to their own AWS Organizations / Control Tower for direct CloudTrail visibility.
- SZL provides a quarterly residency attestation listing every region where any customer data was observed during the quarter.

## 7. Incident escalation for residency violations

A residency violation is treated as a **Severity 1 incident** (see `A11OY-05-incident-response-72hr.md`):

- Hard-block on further data egress within 5 minutes of detection.
- Customer notification within 4 hours.
- Root-cause analysis and corrective-action plan within 72 hours.
- Independent confirmation from the evidence ledger that no further violations occurred.

## 8. Buyer attestation

SZL will execute a written "US Data Residency Attestation" per active procurement, signed by the founder, containing:

- Deployment region(s) and account ID(s)
- LLM endpoint allowlist for that customer
- US-persons-only support attestation (where applicable)
- Notification commitment for any policy or scope change

Request: `inquiries@szlholdings.com`, subject `US Data Residency Attestation request — [agency]`.

## 9. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 10. Contact

Stephen P. Lutar Jr. · inquiries@szlholdings.com
