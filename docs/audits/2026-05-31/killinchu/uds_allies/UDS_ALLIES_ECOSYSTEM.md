# UDS_ALLIES_ECOSYSTEM.md — the symbiotic-ally landscape

> The American-led open-source supply-chain + cloud-native ecosystem UDS is built on. Every ally we should credit, partner with, and build alongside. — *Yachay*

---

## A. Image substrate & supply-chain backbone

### Chainguard — minimal/distroless image substrate
- **Founded** October 2021. **Founders:** **Dan Lorenc** (CEO), **Matt Moore** (CTO), **Kim Lewandowski** (CPO), **Ville Aikas** (Distinguished Engineer), Scott Nichols (left 2022) — all ex-Google / ex-VMware ([Contrary Research — Chainguard](https://research.contrary.com/company/chainguard); [GeekWire, 2025-04-23](https://www.geekwire.com/2025/cybersecurity-startup-chainguard-lands-356m-now-valued-at-3-5b/)).
- **Funding:** Series C **$140M** at $1.1B (Jul 2024, Redpoint/Lightspeed/IVP); Series D **$356M** at **$3.5B** (Apr 2025, Kleiner Perkins + IVP). Total raised >$600M; backers incl. Sequoia, Spark, Amplify, Salesforce Ventures, Datadog Ventures ([Chainguard Series C](https://www.chainguard.dev/unchained/chainguard-raises-140-million-in-series-c-funding-to-secure-the-next-frontier-of-ai-workloads); [GeekWire Series D](https://www.geekwire.com/2025/cybersecurity-startup-chainguard-lands-356m-now-valued-at-3-5b/)).
- **Why they matter to us:** Chainguard Images = near-zero-CVE distroless base images, the cleanest possible substrate for a "fully American-made, defense-grade" container. **US-founded, US-based.** Strong DFARS-friendly story (see AMERICAN_MADE_SUPPLY_CHAIN.md). Dan Lorenc also co-created **Sigstore** — overlapping ally.

### Anchore — SBOM + vulnerability scanning
- **Founded** 2016 by **Saïd Ziouani** (CEO, ex-Ansible) and **Daniel Nurmi** (CTO, ex-Eucalyptus). Santa Barbara, CA ([Anchore Series A](https://anchore.com/press/20200122-series-a/); [Fortune, 2016](https://fortune.com/2016/04/06/anchore-startup-safer-software/)).
- **Funding:** $20M Series A (2020, SignalFire-led) ([Anchore Series A](https://anchore.com/press/20200122-series-a/)).
- **OSS:** **Syft** (SBOM generator) and **Grype** (vuln scanner) — the de-facto open-source SBOM/scan tools. Anchore won an **AFWERX SBIR Phase II** with the USAF ([Anchore growth, 2021-01-14](https://anchore.com/press/anchore-continues-remarkable-growth-and-business-momentum/)).
- **Why they matter to us:** Syft/Grype are the supply-chain backbone for generating + scanning our SBOMs. US-founded; already inside the DoD via AFWERX. OpenSSF general member ([Linux Foundation OpenSSF, 2021](https://www.linuxfoundation.org/press/press-release/press-release-open-source-security-foundation-raises-10-million-in-new-commitments-to-secure-software-supply-chains)).

## B. Signing & attestation chain (what UDS bundles use)

### Sigstore — Cosign / Fulcio / Rekor (signing)
- Launched **2021** as a collaboration of **Google, Red Hat, Purdue University, and Chainguard**; keyless signing; **CNCF-graduated**. Components: **Cosign** (signing), **Fulcio** (CA), **Rekor** (transparency log) ([sbomify — What is Sigstore](https://sbomify.com/2024/08/12/what-is-sigstore/); [sigstore/cosign GitHub](https://github.com/sigstore/cosign); [OpenSSF Sigstore](https://openssf.org/community/sigstore/)).
- **UDS link:** **Zarf bundles Cosign** to sign/verify packages at the airgap boundary ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)). This is *the* signature primitive we conform to.

### in-toto — attestation framework (what we produce)
- Developed at **NYU Tandon** under Prof. **Justin Cappos**, led by **Santiago Torres-Arias** (now Purdue). First published USENIX Security 2019. **Graduated from CNCF April 2025** ([USENIX 2019 paper](https://www.usenix.org/conference/usenixsecurity19/presentation/torres-arias); [NYU Cyber — in-toto CNCF graduation](https://cyber.nyu.edu/2025/09/09/software-supply-chain-framework-in-toto-graduates-from-cncf/); [CNCF graduation announcement](https://www.cncf.io/announcements/2025/04/23/cncf-announces-graduation-of-in-toto-security-framework-enhancing-software-supply-chain-integrity-across-industries/)).
- **Our link:** Khipu DAG receipts ≈ an in-toto provenance graph ("walk the graph, find nodes that shouldn't be there"). We **produce** in-toto attestations; Sigstore signs them. American-academic origin.

### SLSA — Supply-chain Levels for Software Artifacts (what we conform to)
- An **OpenSSF** project (housed at slsa.dev); SLSA provenance uses the **in-toto attestation format**, typically signed via Sigstore ([OpenSSF SLSA](https://openssf.org/projects/slsa/); [slsa.dev](https://slsa.dev); [slsa-framework GitHub](https://github.com/slsa-framework/slsa)).
- **Our target:** declare and prove a SLSA build level for every Killinchu artifact. This is the measurable "American-made operational and functional" claim.

> **Chain summary:** *Syft/Grype (Anchore) → SBOM → in-toto attestation (NYU/Purdue) → SLSA level (OpenSSF) → Cosign signature (Sigstore) → Zarf package (Defense Unicorns) → UDS Core admission (Pepr policy)*. Every link is US-led or US-academic.

## C. CNCF projects in the UDS Core stack

Per [UDS Core Features docs](https://docs.defenseunicorns.com/core/concepts/core-features/overview/) and [UDS networking docs](https://docs.defenseunicorns.com/core/v1-4/how-to-guides/networking/configure-core-network-access/):

| Project | Role in UDS Core | CNCF status |
|---|---|---|
| **Istio** | Service mesh — mTLS, ingress/egress, zero-trust networking boundary | Graduated |
| **Keycloak** (+ Authservice) | SSO / OIDC / group-based authz | CNCF-adjacent (CNCF: Keycloak incubating) |
| **Flux** | GitOps reconciliation; Zarf pulls "the right version of Flux" for Big Bang | Graduated |
| **Prometheus** (+ Alertmanager, Blackbox Exporter) | Metrics + alerting | Graduated |
| **Grafana** | Dashboards / visualization | (Grafana Labs) |
| **Loki** | Log aggregation + log-based alerting | (Grafana Labs) |
| **Tempo** | Distributed tracing | (Grafana Labs) |
| **OpenTelemetry** | Telemetry instrumentation standard | Incubating |
| **Vector** | Log shipping/transform (Datadog OSS) | — |
| **Falco** | Runtime threat detection in containers | Graduated |
| **Velero** | Backup & restore of K8s + PV data | (VMware/Broadcom OSS) |
| **Pepr** | Admission control + policy (Defense Unicorns) | OpenSSF/CNCF ecosystem |

## D. Adjacent / co-existence allies

- **Red Hat / IBM (OpenShift):** UDS/NVIDIA airgap docs include explicit **OpenShift** certificate-injection paths — UDS Core co-exists with OpenShift clusters ([NVIDIA NIM Operator air-gap docs](https://docs.nvidia.com/nim-operator/latest/air-gap.html)). Red Hat is also a **Sigstore co-founder**. Co-existence, not competition.
- **HashiCorp (Vault, Consul):** acquired by **IBM** for **$6.4B**, closed Feb 2025; Vault Enterprise now in IBM portfolio with OpenShift integrations — relevant for airgap secrets management touch-points ([IBM Newsroom](https://newsroom.ibm.com/2025-02-27-ibm-completes-acquisition-of-hashicorp,-creates-comprehensive,-end-to-end-hybrid-cloud-platform); [Red Hat OpenShift + Vault](https://www.redhat.com/en/blog/red-hat-openshift-enhances-vault-integrations)).
- **GitLab + Mattermost:** commonly co-deployed collab/DevSecOps tools in Big Bang; Zarf explicitly packages "Big Bang components like GitLab or Istio" ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)). Both OpenSSF members ([Linux Foundation OpenSSF](https://www.linuxfoundation.org/press/press-release/press-release-open-source-security-foundation-raises-10-million-in-new-commitments-to-secure-software-supply-chains)).
- **Replicated / Replicated KOTS:** the **competitive frame** in airgap k8s. KOTS supports airgap installs with Admin Console + airgap bundles ([Replicated airgap docs](https://docs.replicated.com/enterprise/installing-existing-cluster-airgapped); [Replicated FAQs](https://docs.replicated.com/vendor/kots-faq)). Note: Zarf maintainer Wayne Starr and Kubelist host Marc Campbell (Replicated) discussed the overlap directly — they share the airgap problem space but Zarf is FOSS/CLI-first vs. KOTS's vendor-portal model ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).
- **NVIDIA (GPU Operator + NIM):** directly relevant to our Vector-DB + NVIDIA mapping. NVIDIA ships **air-gapped NIM** deployment paths (download model profiles connected, transfer cache, run disconnected) and a **NIM Operator** with OpenShift support — exactly the workflow Zarf packages would wrap for edge GPU inference ([NVIDIA NIM Operator air-gap](https://docs.nvidia.com/nim-operator/latest/air-gap.html); [NVIDIA NIM visual-genai air-gap](https://docs.nvidia.com/nim/visual-genai/latest/deploy-air-gap.html)). Defense Unicorns' own **LeapfrogAI** brings open-source AI into the airgap as Zarf packages ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).

## E. Credit / partner / sell map (one-glance)

- **Credit publicly:** Defense Unicorns (UDS/Zarf/Pepr), Chainguard, Anchore, Sigstore.
- **Partner (governance):** CNCF (in-toto, Istio, Flux, Falco), OpenSSF (SLSA, Sigstore community).
- **Build atop:** NVIDIA NIM/GPU Operator, Grafana stack, Istio, Keycloak.
- **Frame against:** Replicated KOTS (airgap competitor — position UDS+Khipu as the FOSS, attestation-native alternative).

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
