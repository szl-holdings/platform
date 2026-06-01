# PEPR_BAKERS.md — Pepr, the policy/admission engine UDS uses

> Pepr is the Kubernetes admission-controller + middleware framework UDS Core uses for policy and runtime enforcement. — *Yachay*

---

## 1. Origin

**Pepr** = "Type-safe K8s middleware for humans" — a TypeScript framework for building Kubernetes admission controllers (mutating + validating webhooks) and operators without hand-writing webhook plumbing ([GitHub defenseunicorns/pepr](https://github.com/defenseunicorns/pepr); [pepr.dev](https://pepr.dev)).

- **Created by Defense Unicorns**; repo created **2023-03-08** ([GitHub defenseunicorns/pepr](https://github.com/defenseunicorns/pepr)).
- **Role inside UDS Core:** Pepr is the **Policy & Compliance** layer — "admission control and pod-security enforcement via Pepr, with explicit exemption management for auditable exceptions" ([UDS Core Features docs](https://docs.defenseunicorns.com/core/concepts/core-features/overview/)). The "UDS Operator" itself is implemented as Pepr modules.
- **Stats:** 228 stars / 15 forks ([GitHub defenseunicorns/pepr](https://github.com/defenseunicorns/pepr)) — the most-starred repo in the `defenseunicorns` org.
- Depends on the org's own `kubernetes-fluent-client` library.

## 2. Top maintainers (by commit count)

From GitHub contributors API (bots excluded); names from GitHub profiles.

| GitHub login | Name | Commits | Note |
|---|---|---|---|
| `cmwylie19` | **Case Wylie** | 433 | **Lead on Pepr** (per GitHub bio) — the contact for any policy contribution |
| `jeff-mccoy` | **Jeff McCoy** (DU CTO) | 210 | Co-founder, original author |
| `samayer12` | **Sam Mayer** | 173 | Core maintainer |
| `btlghrants` | Barrett | 127 | Core contributor |
| `AmberFryar` | **Amber Fryar** | 52 | Core contributor |
| `tamirazrab` | Tamir Azrab | 14 | — |
| `mjnagel` | Micah Nagel (UDS Core lead) | 10 | Cross-project |
| `naveensrinivasan` | Naveen Srinivasan | 4 | OpenSSF/supply-chain notable |

Source: [GitHub defenseunicorns/pepr contributors](https://github.com/defenseunicorns/pepr/graphs/contributors).

## 3. Adoption

- **UDS Core** is the flagship consumer — Pepr enforces pod-security, network policy CRs, and exemption management across every UDS deployment ([UDS Core Features docs](https://docs.defenseunicorns.com/core/concepts/core-features/overview/)).
- Discussed publicly alongside Zarf, Lula, and LeapfrogAI as part of the Defense Unicorns open-source stack ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- Maintains a public `pepr-excellent-examples` repo and community media page ([Pepr media docs](https://docs.pepr.dev/community/pepr-media/)).

## 4. Why Pepr matters to us (Killinchu)

Pepr is **where policy lives**. The open issue **uds-core #789 ("Research UDS Operator Pepr policy to validate image signatures")** is the natural insertion point for a Killinchu contribution: a Pepr policy that, on Pod admission, verifies Sigstore/Cosign signatures **and** checks for a Khipu DAG attestation / RemoteID-compliance label before allowing a drone-payload workload to schedule. See UDS_PR_CONTRIBUTION_OPPORTUNITIES.md.

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
