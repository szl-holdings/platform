# ZARF_BAKERS.md — Zarf, the airgap package format UDS rides on

> Zarf is the air-gap-native package manager that UDS uses to ship Kubernetes apps into disconnected environments. All claims carry primary-source URLs. — *Yachay*

---

## 1. Origin

**Zarf** = "the Airgap Native Package Manager for Kubernetes" — a single static Go binary + an init package + app packages that can stand up an entire Kubernetes environment with zero internet egress ([GitHub zarf-dev/zarf](https://github.com/zarf-dev/zarf); [zarf.dev](https://zarf.dev)).

- **Created by Defense Unicorns** as its first product (repo created **2021-08-23**), born from Platform One / Big Bang lessons — "a way to take lessons from Kessel Run and build a Kubernetes platform for everybody" ([Kubelist Ep.42, Wayne Starr](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **Governance migrated to a vendor-neutral org `zarf-dev`** (created 2023-02-13) and Zarf is now a **CNCF-ecosystem / OpenSSF Sandbox Project** ([LinkedIn — Sally Cooper / Brandt Keller, "What's in the SOSS?"](https://www.linkedin.com/posts/sally-cooper_really-enjoyed-this-conversation-with-brandt-activity-7457430586660528128-D7sA); [CNCF Sandbox](https://www.cncf.io/sandbox-projects/)).
- **Vendors** crane, k9s, kubectl into one binary; **bundles Cosign (Sigstore) for artifact signing/verification** at the package boundary ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **Stats:** 1,907 stars / 251 forks / 120 contributors ([GitHub zarf-dev/zarf](https://github.com/zarf-dev/zarf)) — by far the most-adopted project in the UDS family.

## 2. Top maintainers / commit-frequency contributors

From GitHub contributors API (bots excluded); names from GitHub profiles.

| GitHub login | Name | Commits | Note |
|---|---|---|---|
| `jeff-mccoy` | **Jeff McCoy** (DU CTO, "Megamind") | 551 | Co-founder, original author |
| `AustinAbro321` | **Austin Abro** | 409 | Core maintainer |
| `Racer159` | **Wayne Starr** | 236 | **Zarf product/maintainer lead** at Defense Unicorns; podcast voice of Zarf |
| `brandtkeller` | **Brandt Keller** | 112 | Maintainer + public Zarf advocate (OpenSSF/CNCF) |
| `phillebaba` | **Philip Laine** | 105 | External maintainer (Kvick) — non-DU community contributor |
| `YrrepNoj` | **Jonathan Perry** | 97 | @DefenseUnicorns |
| `Noxsios` | "razzle" (now @palantir) | 72 | Ex-DU, moved to Palantir |
| `RothAndrew` | **Andy Roth** | 69 | @defenseunicorns, DevSecOps |
| `mkcp` | — | 56 | — |
| `lucasrod16` | Lucas Rodriguez | 27 | — |

Source: [GitHub zarf-dev/zarf contributors](https://github.com/zarf-dev/zarf/graphs/contributors).

> Governance note: external/non-DU contributors require **two** core-maintainer reviews; security is "our highest priority" because Zarf is "used within the United States Government" ([Zarf Contributing Guide](https://docs.zarf.dev/contribute/contributor-guide/)).

## 3. Downstream users / adopters

- **USAF Platform One / Big Bang** — Zarf pulls "the right version of Flux, all the right images and manifests to have Big Bang up and running in the airgap." Defense Unicorns "still help Platform One and contribute to the Helm charts Big Bang is based upon" ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **Iron Bank** — Zarf packages are listed in Iron Bank, giving units pre-approved hardened-image paths ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **U.S. Navy submarines / SUBMEPP** — Zarf "water-gapped" deployments onto submarines; UDS platform page cites a **U.S. Navy SUBMEPP / Cloud Program Manager** ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/); [Defense Unicorns UDS Platform](https://defenseunicorns.com/platform/uds-platform/)).
- **Government procurement footprint:** purchasable via **GSA** schedule; Zarf support subscriptions sold through GSA listings ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **CISA / DHS reachable** via Defense Unicorns' GSA SBIR Phase III IDIQ (accepts task orders from DoD, DHS, and CISA) ([Defense Unicorns Start-Free / contracting](https://defenseunicorns.com/start-free/)).
- **Broad community adoption** worldwide beyond DoD ("plenty of people using it all around the world") ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).

## 4. Why Zarf matters to us (Killinchu)

Zarf is the **delivery rail**. Anything Killinchu wants fielded into an air-gapped edge (a drone ground station, a contested-EW node) ships as a **Zarf package** signed with Cosign. Our Khipu DAG receipts can be carried as Zarf package SBOM/attestation metadata — see UDS_PR_CONTRIBUTION_OPPORTUNITIES.md (Zarf issues #4917, #4794).

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
