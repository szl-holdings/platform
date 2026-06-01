# UDS_DOWNSTREAM_USERS.md — who deploys UDS in production

> Public, named government touch-points where UDS / Zarf / Pepr are fielded or reachable. Public info only; no classified-program claims. — *Yachay*

---

## 1. Headline: UDS is already fielded at scale

Defense Unicorns' technology is "trusted by the operators of some of the most critical systems in the world, including the **U.S. Navy, Army, Air Force, and Space Force**" and supports **more than 50 military systems**, already **FIELDED** ([Bain Capital Series B release, 2026-01-13](https://www.baincapital.com/news/defense-unicorns-raises-136-million-series-b-build-software-backbone-department-war); [PR Newswire, 2026-01-13](https://www.prnewswire.com/news-releases/defense-unicorns-raises-136-million-series-b-to-build-the-software-backbone-of-the-department-of-war-302658857.html); [LinkedIn — M. Slagh, "already FIELDED"](https://www.linkedin.com/posts/mslagh_flashback-to-my-friend-robert-slaughter-activity-7417293299494871041-_4o_)). The Series A statement cited "approaching 100 mission capabilities across the DoD's production mission customer environments" ([Medium, Andrew Greene](https://medium.com/@andrewg-xyz/yesterday-defense-unicorns-announced-we-had-raised-35m-for-a-series-a-led-by-sapphire-ventures-914f3e3be068)).

**Product lineup (the things customers buy):** **UDS** (airgap runtime), **UDS Registry** (American-maintained software supply-chain registry), **UDS Army** (Army delivery model w/ pre-authorized cloud + DevSecOps) ([Bain Capital release](https://www.baincapital.com/news/defense-unicorns-raises-136-million-series-b-build-software-backbone-department-war)).

## 2. USAF Platform One — the origin and closest collaborator

- Defense Unicorns founders **built / ran Platform One** before spinning out; the company "still helps Platform One and contributes to the Big Bang Helm charts" — so DU is both **spinout from** and **ongoing collaborator with** Platform One ([Kubelist Ep.42, Wayne Starr](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/); [Defense Unicorns company timeline](https://defenseunicorns.com/company/)).
- **Big Bang** (umbrella Helm chart answering RMF security controls), **Iron Bank** (hardened container images, "eliminates duplicative container hardening by a factor of 10,000"), and **Party Bus** (SaaS Big Bang) are the Platform One assets Zarf packages ride on ([Kubelist Ep.42](https://www.heavybit.com/library/podcasts/the-kubelist-podcast/ep-42-zarf-with-wayne-starr-of-defense-unicorns/); [Software Factory Coalition partners](https://coalition.dso.mil/partners/)).
- Platform One publicly partnered with Defense Unicorns + RegScale on OSCAL compliance ([NIST OSCAL workshop transcript, 2022](https://csrc.nist.gov/csrc/media/presentations/2022/oscal-mini-workshop-6-DoD_P1/images-media/10.05.2022_PlatformOne_Captions.txt)).

## 3. Service branches & software factories (named, public)

| Service | Software factory / program | UDS relevance | Source |
|---|---|---|---|
| **USAF** | **Kessel Run** (Det 12, Hanscom AFB) — first DoD CATO; DU founding lineage | direct ancestry | [Wikipedia: Kessel Run](https://en.wikipedia.org/wiki/Kessel_Run); [DU timeline](https://defenseunicorns.com/company/) |
| **USAF** | **BESPIN** (Maxwell AFB) — mobile/desktop apps | software-factory ecosystem | [MFGS blog](https://blog.mfgsinc.com/7-dod-program-names-inspired-by-science-fiction) |
| **USAF / Cyber** | **Black Label** (software.af.mil) — EW/offensive cyber DevSecOps factory | DevSecOps factory | [software.af.mil](https://software.af.mil) |
| **USSF** | **Space CAMP** (later Space CAMP/CAMP, AFRL) — DU founders built it | direct ancestry | [DU timeline](https://defenseunicorns.com/company/); [software.af.mil](https://software.af.mil) |
| **Army** | **Army Software Factory** (Austin, TX) + **UDS Army** product | named DU product | [Bain Capital release](https://www.baincapital.com/news/defense-unicorns-raises-136-million-series-b-build-software-backbone-department-war); [Wikipedia: Kessel Run](https://en.wikipedia.org/wiki/Kessel_Run) |
| **Navy** | **Overmatch Software Armory (OSA)** — NIWC Pacific DevSecOps ecosystem; **Project Overmatch** (autonomy/USVs) | Navy DevSecOps + autonomy | [NIWC Pacific OSA](https://www.niwcpacific.navy.mil/Technology/Overmatch-Software-Armory/); [GovCIO — Project Overmatch autonomy](https://govciomedia.com/navy-seeks-speed-of-software-in-new-acquisition-push/) |
| **Navy** | **The Forge** (first Navy software factory, 2021) | software-factory ecosystem | [Wikipedia: Kessel Run](https://en.wikipedia.org/wiki/Kessel_Run) |
| **Navy** | **SUBMEPP / Cloud Program Manager** — submarine ("water-gapped") deployments | named UDS customer | [Defense Unicorns UDS Platform](https://defenseunicorns.com/platform/uds-platform/) |
| **Joint** | **Software Factory Coalition** (coalition.dso.mil) — 20 deployed platforms incl. **Sentinel (GBSD)** | shared ecosystem | [Software Factory Coalition](https://coalition.dso.mil/partners/) |

> Note: Kobayashi Maru (Space Force), Rogue Blue, Sonic, etc. are part of the broader DoD software-factory movement that Kessel Run spawned ([Wikipedia: Kessel Run](https://en.wikipedia.org/wiki/Kessel_Run)); their specific UDS adoption is not separately documented in public sources reviewed here. **Do not over-claim** — only Kessel Run/Space CAMP/Army (UDS Army)/Navy SUBMEPP have direct public DU links.

## 4. Civilian / cross-agency reach

- **CISA & DHS** are explicitly reachable via Defense Unicorns' **GSA SBIR Phase III IDIQ**, which accepts sole-source task orders from "DoD, DHS, and CISA" ([Defense Unicorns contracting](https://defenseunicorns.com/start-free/)).
- **GSA** schedule + **Navy SeaPort NxG** IDIQ + **AWS Marketplace** are the named acquisition vehicles ([Defense Unicorns contracting](https://defenseunicorns.com/start-free/)).

## 5. Implication for Killinchu

The fielded surface is **Air Force + Army (UDS Army) + Navy (SUBMEPP, Overmatch autonomy) + Space Force**, all reachable via GSA/SeaPort/AWS and the DU SBIR Phase III IDIQ. **Navy Project Overmatch (autonomous surface vessels)** and the autonomy-leaning factories are the closest fit to a drone/autonomy supply-chain-attestation play (see DOD_DRONE_UDS_OPPORTUNITY.md).

---
*Compiled by Yachay — SZL Holdings. 2026-06-01.*
