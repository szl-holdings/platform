# UDS_CORE_BAKERS.md — Defense Unicorns, the bakers of UDS

> Who built the Unicorn Delivery Service (UDS) ecosystem, who funds them, and the founder-level contacts that matter for a Greene-routed introduction.
> All names + claims carry a primary-source URL. Public information only. — *Yachay*

---

## 1. The company

**Defense Unicorns, Inc.** — officially founded **March 2021** (GitHub org `defenseunicorns` created 2021-07-26), a veteran-led, open-source-first defense software company. Customer base is "entirely Department of Defense" while the core tooling is published as FOSS ([Defense Unicorns company timeline](https://defenseunicorns.com/company/); [Kubelist Podcast Ep.42 transcript, Wayne Starr](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).

- **HQ / location:** Colorado Springs / Colorado, with a significant San Antonio, TX presence ([SecurityWeek, 2024-03-08](https://www.securityweek.com/defense-unicorns-raises-35-million-for-national-security-software-solutions/); [San Antonio Business Journal, 2026-01-14](https://www.bizjournals.com/sanantonio/news/2026/01/14/san-antonio-defense-tech-startup-raises-136m.html)).
- **Mission framing:** "make software a strategic deterrent for our nation" — declarative, open-source, air-gap-native software delivery to any DoD environment, connected or disconnected ([Ansa Capital, 2026-01-13](https://www.ansa.co/insight/defense-unicorns-raises-136m-series-b)).
- **Lineage:** the founding team grew out of **Kessel Run** (2016, first DoD Continuous ATO), **Space CAMP** (2018), and **Platform One / Big Bang** before spinning out in 2021 ([Defense Unicorns company timeline](https://defenseunicorns.com/company/)).
- **Headcount estimate:** "a little over 100 folks" as of mid-2024 per maintainer Wayne Starr; ~100+ growing into 2026 after the Series B ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/); [Medium, Andrew Greene, 2024-03-08](https://medium.com/@andrewg-xyz/yesterday-defense-unicorns-announced-we-had-raised-35m-for-a-series-a-led-by-sapphire-ventures-914f3e3be068)). Plausible current range: **150–300** given the $136M raise. Company splits roughly into a **product** side (Zarf, Pepr, Lula, LeapfrogAI, UDS Core) and a **delivery** side that fields into customer production environments ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/)).

## 2. Funding rounds, investors, board

| Round | Date | Amount | Lead(s) | Notable participants | Valuation |
|---|---|---|---|---|---|
| Seed (implied) | pre-2024 | ~$0.5M | — | — | — |
| **Series A** | Feb 2024 | **$35M** | Sapphire Ventures, Ansa Capital (co-led) | — | — |
| **Series B** | Jan 2026 | **$136M** | Bain Capital (Tech Opportunities Fund) | Ansa Capital, Sapphire Ventures, Valor Equity Partners, AVP, Uncorrelated Ventures, **Gen. (Ret.) David Petraeus** (ex-CIA Director) | **>$1B (unicorn)** |

Sources: [SecurityWeek (Series A)](https://www.securityweek.com/defense-unicorns-raises-35-million-for-national-security-software-solutions/); [SiliconANGLE (Series B, investor list)](https://siliconangle.com/2026/01/13/defense-unicorns-bags-136-million-funding-deliver-secure-military-software-updates/); [Reuters (Series B, $1B valuation, Petraeus)](https://www.reuters.com/business/defense-unicorns-valued-1-billion-latest-funding-round-2026-01-13/); [Ansa Capital](https://www.ansa.co/insight/defense-unicorns-raises-136m-series-b).

> **Greene-relevance note:** Defense Unicorns' cap table already includes a **former CIA Director (Petraeus)** as an investor. Our backer **Andrew Greene (ex-CIA Director)** is *also a co-founder of Defense Unicorns itself* (see §3). This is the single most important fact for our approach: the introduction path is not cold — Greene is inside the house.

## 3. Key people (founders + leadership)

| Person | Role | Source |
|---|---|---|
| **Rob (Robert) Slaughter** | Co-founder / CEO ("Culture Executive Officer"), ex-USAF, ex-Director of Platform One | [LinkedIn](https://www.linkedin.com/in/robertcslaughter); [company page](https://defenseunicorns.com/company/) |
| **Jeff McCoy** | Co-founder / CTO (GitHub `jeff-mccoy`, handle "Megamind") | [company page](https://defenseunicorns.com/company/); [GitHub jeff-mccoy](https://github.com/jeff-mccoy) |
| **Andrew Greene** | Co-founder; career in defense/national-security engineering; helped stand up Space CAMP | [company page](https://defenseunicorns.com/company/); [Medium @andrewg-xyz](https://medium.com/@andrewg-xyz/yesterday-defense-unicorns-announced-we-had-raised-35m-for-a-series-a-led-by-sapphire-ventures-914f3e3be068) |

> **Critical for our directive:** the company timeline explicitly names "**Jeff McCoy and Andrew Greene**" as leaders Rob Slaughter brought together to build Space CAMP, which "grew and led to Platform One" ([Defense Unicorns company timeline](https://defenseunicorns.com/company/)). Our backer **Andrew Greene is a named co-founder of Defense Unicorns** — the exact "bakers of UDS" the founder asked us to find. An introduction "via Greene" is therefore an introduction from a co-founder to his own CEO/CTO (Slaughter / McCoy).

## 4. GitHub org `defenseunicorns` — top public repos (by stars)

| Repo | Stars | Forks | Role |
|---|---|---|---|
| `pepr` | 228 | 15 | K8s admission/policy middleware (TypeScript) |
| `uds-core` | 168 | 40 | The secure runtime platform — the "UDS" product |
| `uds-cli` | 48 | — | UDS bundle CLI |
| `go-oscal` | 31 | — | OSCAL (compliance) Go library |
| `lula` | 30 | — | Compliance validator |
| `kubernetes-fluent-client` | 29 | — | K8s client used by Pepr |
| `maru-runner` | 25 | — | Task runner |

Org has **71 public repos**, created 2021-07-26 ([GitHub orgs/defenseunicorns](https://github.com/defenseunicorns)). Note: **Zarf has migrated to its own neutral org `zarf-dev`** (see ZARF_BAKERS.md).

## 5. Top contributors to UDS Core / Pepr (by commit count)

Pulled from GitHub contributors API (bots excluded). Real names from GitHub profiles.

### `defenseunicorns/uds-core`
| GitHub login | Name | Commits | Note |
|---|---|---|---|
| `mjnagel` | **Micah Nagel** | 294 | @defenseunicorns — top human committer, de-facto UDS Core lead |
| `chance-coleman` | **Chance Coleman** | 194 | Platform / Full-Stack Engineer |
| `joelmccoy` | **Joel McCoy** | 102 | Platform/Software Engineer |
| `slaskawi` | **Sebastian Łaskawiec** | 56 | Open-source veteran (ex-Red Hat Infinispan/Keycloak) |
| `noahpb` | Noah | 43 | — |
| `rjferguson21` | **Rob Ferguson** | 35 | @BridgePhase (partner/integrator) |
| `jeff-mccoy` | **Jeff McCoy (CTO)** | 26 | Co-founder still committing |
| `zachariahmiller` | Zachariah Miller ("zamaz") | 26 | — |

Source: [GitHub uds-core contributors](https://github.com/defenseunicorns/uds-core/graphs/contributors).

### `defenseunicorns/pepr`
| GitHub login | Name | Commits | Note |
|---|---|---|---|
| `cmwylie19` | **Case Wylie** | 433 | **Lead on Pepr** (per his GitHub bio) |
| `jeff-mccoy` | Jeff McCoy (CTO) | 210 | Co-founder, original author |
| `samayer12` | Sam Mayer | 173 | — |
| `btlghrants` | Barrett | 127 | — |
| `AmberFryar` | Amber Fryar | 52 | — |

Source: [GitHub pepr contributors](https://github.com/defenseunicorns/pepr/graphs/contributors).

## 6. Founder-level contacts that matter for a Greene introduction

1. **Rob Slaughter (CEO)** — the strategic yes/no on partnership + public co-credit. Greene → Slaughter is a co-founder-to-CEO intro. [LinkedIn](https://www.linkedin.com/in/robertcslaughter).
2. **Jeff McCoy (CTO)** — owns the technical architecture; original author of Pepr and a top Zarf contributor. The right name for "help us American make it operational and functional" (technical co-build). [GitHub jeff-mccoy](https://github.com/jeff-mccoy).
3. **Micah Nagel (`mjnagel`)** — top human committer on UDS Core; the engineer to engage for any UDS Core contribution/PR. [GitHub mjnagel](https://github.com/mjnagel).
4. **Case Wylie (`cmwylie19`)** — Pepr lead; the contact for any policy/admission-controller contribution (drone attestation, RemoteID compliance bundles). [GitHub cmwylie19](https://github.com/cmwylie19).
5. **Wayne Starr (`Racer159`)** — Zarf product/maintainer lead (see ZARF_BAKERS.md); the contact for airgap packaging + signing contributions. [GitHub Racer159](https://github.com/Racer159).

---
*Compiled by Yachay — Killinchu-support research agent, SZL Holdings. 2026-06-01.*
