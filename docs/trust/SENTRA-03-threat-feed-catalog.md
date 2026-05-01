# Sentra — Threat Feed Catalog

**Document ID:** SENTRA-COMP-TF-001
**Version:** 1.0
**Owner:** Stephen P. Lutar Jr., SZL Holdings
**Last reviewed:** 2026-04-30
**Audience:** NYSTEC, customer security teams, federal sponsors
**Classification:** Public (catalog); per-feed contractual terms private

---

## 1. Purpose

NYSTEC and most government / regulated buyers expect a documented, current, formal catalog of the threat-intelligence feeds their security product consumes — not a marketing claim. This document is that catalog.

It lists every feed Sentra ingests, what tier it occupies, what the licensing posture is, and how Sentra reconciles overlapping signals.

## 2. Feed tiering

Feeds are tiered by trust, not by vendor relationship.

| Tier | Definition | Example signal trust | Action posture |
|---|---|---|---|
| **T1 — Authoritative** | First-party government or named-author research; primary-source-anchored | Auto-anchor to evidence ledger; trigger high-severity playbooks where IOC matched | Sentra may take automated reversible actions (per §4) |
| **T2 — Vendor-enriched** | Commercial threat-intel vendors with documented sourcing | Trigger medium-severity playbooks; require correlation with at least one other tier-2 feed for high severity | Sentra recommends; human approves |
| **T3 — Open community** | Open-source feeds, community lists, social-network signals | Used for enrichment and context only; never sole basis for an action | Display only |
| **T4 — Customer-private** | Customer-supplied IOCs and detections | Trusted at the customer's risk posture | Per customer policy |

## 3. Tier 1 — Authoritative feeds (default-on)

| Feed | Source | Update cadence | Use |
|---|---|---|---|
| CISA Known Exploited Vulnerabilities (KEV) | cisa.gov | Daily | Trigger SP-007 against customer SBOM |
| CISA Cybersecurity Advisories | cisa.gov | As-published | Trigger SP-007 / SP-013 |
| US-CERT alerts | us-cert.gov | As-published | General awareness; correlate with other tiers |
| NIST National Vulnerability Database (NVD) | nvd.nist.gov | Daily | CVSS / CWE enrichment of CVEs |
| MITRE ATT&CK | attack.mitre.org | Major-version | Tactic/technique tagging on every alert |
| MITRE CWE | cwe.mitre.org | Major-version | Weakness classification on every finding |
| MITRE D3FEND | d3fend.mitre.org | Major-version | Defensive-action tagging on every recommendation |
| OpenSSF Vulnerability Disclosures | github.com/ossf | As-published | Open-source ecosystem advisories |
| EPSS (Exploit Prediction Scoring System) | first.org/epss | Daily | Prioritization signal |
| Sigstore Rekor transparency log | rekor.sigstore.dev | Continuous | Supply-chain integrity verification |

These feeds are sourced via Katzilla (SZL Holdings' primary-source ingestion fabric) and are hash-anchored on ingest, so a Sentra alert can be traced to the exact authoritative bulletin that produced it.

## 4. Tier 2 — Vendor-enriched feeds (configurable per customer)

Sentra integrates with the following vendor feeds where the customer has an active license. SZL does not resell these licenses; the customer brings their own:

| Vendor / feed | Type | Customer-license required |
|---|---|---|
| Mandiant Threat Intelligence | Commercial | Yes |
| Recorded Future | Commercial | Yes |
| CrowdStrike Falcon Intelligence | Commercial | Yes |
| Microsoft Defender Threat Intelligence | Commercial | Yes (or M365 E5) |
| Cisco Talos | Commercial | Yes (or Cisco Secure license) |
| GreyNoise | Commercial / freemium | Yes |
| Censys | Commercial / freemium | Yes |
| Shodan | Commercial / freemium | Yes |
| VirusTotal Enterprise | Commercial | Yes |

When a vendor feed is enabled, Sentra normalizes its signals into the same internal `signal-event` schema used by tier-1, but tags the source so the operator always sees the provenance.

## 5. Tier 3 — Open community feeds (default-off, opt-in)

| Feed | Source | Why it's tier 3 |
|---|---|---|
| AbuseIPDB | abuseipdb.com | Community-sourced; high noise |
| FireHOL IP lists | iplists.firehol.org | Aggregator; sourcing varies |
| Spamhaus public DROP/EDROP | spamhaus.org | High signal but limited scope |
| Emerging Threats open ruleset | rules.emergingthreats.net | Quality varies by ruleset |
| MISP community communities | misp-project.org | Trust depends on the community joined |
| TweetFeed / OSINT lists | various | Volatile; for enrichment only |

Tier-3 feeds are off by default. Customers may enable them for enrichment only; they cannot trigger automated actions.

## 6. Tier 4 — Customer-private feeds

Customers may upload their own IOC sets, YARA rules, and detection content. These are tenant-scoped, never shared, and follow the customer's defined retention policy per `AMARU-02-retention-deletion.md`.

## 7. Reconciliation, deduplication, decay

- **Deduplication:** A single IOC observed across multiple feeds is collapsed into one canonical IOC with a per-feed sources list, so an alert says "matched on KEV + Mandiant + customer-private," not three separate alerts.
- **Decay:** Each IOC has a half-life. Tier-1 IOCs decay slowly (180 days default unless re-confirmed); tier-2 per vendor recommendation; tier-3 fast (30 days unless re-observed); tier-4 per customer policy.
- **Reconciliation:** When two feeds disagree on attribution or severity, Sentra surfaces the disagreement to the operator rather than picking a winner silently. The disagreement itself is logged.

## 8. Quality metrics per feed

Every feed has a per-customer quality score updated weekly:

- **Hit rate** — IOCs from this feed that matched in the customer environment in the last 90 days
- **Confirmed-true-positive rate** — of those hits, how many were confirmed actionable
- **False-positive rate** — of those hits, how many were dismissed or rolled back
- **Time-to-publish vs. competitors** — for major events, who saw it first

Quality scores feed back into prioritization. A feed with a chronically low confirmed-TP rate at a customer is auto-deprioritized for that customer.

## 9. Sub-processor implications

When a customer enables a vendor feed, the vendor becomes a sub-processor for the customer's data. SZL maintains the sub-processor list at `docs/security/subprocessors.md` and notifies customers in advance of additions.

## 10. Honest disclosures

- **No proprietary research lab.** SZL Holdings does not employ in-house threat researchers today. Sentra's analytic value comes from *combining* feeds, not from generating original intel. Buyers expecting in-house research should look elsewhere or wait for SZL's planned 2027 research function.
- **No "AI-generated threats" claim.** Where Sentra surfaces a "predicted" or "modeled" adversary action via `adversary-engine`, that prediction is clearly tagged as model-generated and is never treated as feed-grade signal.
- **Vendor neutrality.** SZL is not paid by any tier-2 vendor for placement. The catalog evolves on customer demand and feed quality, not partner economics.

## 11. Change log

| Date | Change |
|---|---|
| 2026-04-30 | Initial publication. |

## 12. Contact

Stephen P. Lutar Jr. · `security@szlholdings.com` · `inquiries@szlholdings.com`
