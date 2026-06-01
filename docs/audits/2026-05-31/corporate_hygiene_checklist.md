# Corporate Hygiene Checklist — SZL Holdings

**Prepared:** 2026-06-01
**Author:** Yachay (via Perplexity Computer Agent)
**Status convention:** ✅ VERIFIED · ⚠️ UNVERIFIED · ❌ MISSING/NOT DONE · 🔲 DECISION REQUIRED
**Scope:** Pre-Series-A corporate readiness for SZL Holdings.

> **HONESTY NOTE:** Almost every item below is **UNVERIFIED** or **MISSING** from the agent's vantage point. The agent has no access to the company's legal binder, cap table, or state filings. This checklist is a *gap map and action list*, not an attestation. Items marked ⚠️ require the founder to confirm against primary documents. Do **not** represent any ⚠️/❌ item to investors or counterparties as complete until verified.

---

## 0. Known Facts (anchors)

| Item | Value | Source |
|---|---|---|
| Org (HF / GitHub handle) | `SZLHOLDINGS` | Platform handles in use |
| Founder | Stephen P. Lutar | Founder of record |
| Founder ORCID | `0009-0001-0110-4173` | https://orcid.org/0009-0001-0110-4173 |
| Archive / corporate email | corporate@szlholdings.com | Used in repo metadata |
| Apparent home base | Shrub Oak / NYC, New York, US | Founder profile |

These are the only independently anchored facts. Everything in the formation section below must be confirmed against the actual Articles of Organization / Certificate.

---

## 1. Entity Formation & Standing

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 1.1 | **NYS LLC formed** — "SZL Holdings LLC" Articles of Organization filed with NY Dept. of State | ⚠️ UNVERIFIED | Verify entity name + DOS ID at the [NYS Corporation & Business Entity Database](https://dos.ny.gov/corporation-and-business-entity-search-database). Search is interactive/robots-blocked, so the founder must run it manually. Capture the DOS ID, filing date, and exact legal name (LLC vs Inc.). |
| 1.2 | **NY LLC Publication Requirement** (NY LLC Law §206 — publish in 2 newspapers within 120 days of formation; file Certificate of Publication) | ⚠️ UNVERIFIED | NY is one of the few states requiring this. Missing it can suspend the LLC's ability to sue. Confirm the Certificate of Publication was filed. |
| 1.3 | **Registered agent** of record | ⚠️ UNVERIFIED | Confirm whether the founder, a commercial agent (e.g., CT/Cogency/Northwest), or the NY Secretary of State (default) is the agent. A commercial agent is strongly recommended before fundraising. |
| 1.4 | **Biennial Statement** (NY LLCs file every 2 years, $9) | ⚠️ UNVERIFIED | Confirm current; lapsed filings cause "past due" standing. |
| 1.5 | **Certificate of Good Standing** obtainable | ❌ NOT OBTAINED | Order one from NY DOS before any diligence; investors will request it. |
| 1.6 | **Foreign qualifications** in states where the company has employees/nexus | ⚠️ UNVERIFIED | Likely none needed yet if NY-only. Re-assess if hiring out of state or contracting with non-NY government entities. |

---

## 2. Federal Tax & Reporting

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 2.1 | **EIN** issued by IRS | ⚠️ UNVERIFIED | Confirm the EIN exists and matches the legal name. Required for banking, payroll, SAM.gov, and any government contracting. |
| 2.2 | **FinCEN Beneficial Ownership Information (BOI) report** | 🔲 DECISION REQUIRED | The Corporate Transparency Act BOI regime was repeatedly litigated and narrowed in 2024–2025; FinCEN's interim rule exempted U.S. domestic companies. **Verify current FinCEN guidance at filing time** at https://www.fincen.gov/boi — do not assume an obligation either way. If a domestic-entity exemption applies, document the basis; if not, file within the deadline. |
| 2.3 | **State tax registration** (NY DTF, sales tax if applicable) | ⚠️ UNVERIFIED | Confirm if any taxable sales occur. |
| 2.4 | **Annual federal return** (Form 1065 partnership / Schedule C single-member / 1120 if C-Corp) | ⚠️ UNVERIFIED | Depends on entity election (see §6). |

---

## 3. Governance Documents

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 3.1 | **Operating Agreement (OA)** executed | ⚠️ UNVERIFIED | A signed OA is mandatory under NY LLC Law §417 (NY technically requires LLCs to adopt a written OA). If none exists, draft and execute immediately. Must address: membership %, capital accounts, management (member- vs manager-managed), transfer restrictions, drag/tag, vesting. |
| 3.2 | **Bylaws** (if/when C-Corp) | 🔲 N/A until conversion | Adopt at conversion (see §6). |
| 3.3 | **Cap table** maintained | ❌ LIKELY INFORMAL | Stand up a real cap table (Carta / Pulley / AngelList / spreadsheet-of-record). Capture founder units, any advisor grants, option pool reservation. |
| 3.4 | **Board / member consent + minutes** practice | ❌ LIKELY MISSING | Adopt a minute book. Document every material action (option grants, IP assignment, bank account, key contracts) by written consent. Template in §8. |
| 3.5 | **Founder equity vesting** | 🔲 DECISION REQUIRED | Single-founder companies often skip vesting; investors typically require founder vesting (e.g., 4-yr / 1-yr cliff) at Series-A. Decide and paper it. |

---

## 4. IP Ownership Chain (CRITICAL for diligence)

> This is the single most important section for a software/AI company. Investors will trace every line of shipped code to a clean assignment.

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 4.1 | **Founder IP Assignment** — all pre-formation and ongoing IP assigned to the company | ❌ ASSUMED MISSING | Execute a Founder Confidential Information & Invention Assignment Agreement (CIIAA). Cover all code in the `SZLHOLDINGS` GitHub org and HF org, including PURIQ, Killinchu, Amaru, Sentra, Rosie, Khipu, Yuyay. |
| 4.2 | **Contractor / collaborator assignments** — every GitHub contributor outside the founder | ❌ ASSUMED MISSING | Any external contributor to org repos must sign a CIIAA or contributor assignment. Audit `git shortlog -sne` per repo for non-founder authors. Open-source contributions need a CLA or DCO. |
| 4.3 | **Open-source license hygiene** | ⚠️ UNVERIFIED | Confirm each public repo has a LICENSE, and that no copyleft (GPL/AGPL) dependency contaminates proprietary cores. Run a license scan (e.g., `pip-licenses`, ScanCode) before fundraising. |
| 4.4 | **Trademark** — "SZL", "PURIQ", "Killinchu", "Yachay", "Khipu", organ names | 🔲 DECISION REQUIRED | Run USPTO TESS clearance on the marks you intend to keep. The Quechua-derived names (Yachay, Khipu, Killinchu, Amaru, Yuyay, Wayra) have cultural-heritage and descriptiveness considerations; clear before spending on filings. |
| 4.5 | **Patent assignments** | 🔲 SEE PATENT PLAN | Any provisional filed (see `final_sweep/patent_strategy/PROVISIONAL_FILING_PLAN.md`) must list the company as assignee, with inventor assignment recorded at USPTO. |
| 4.6 | **Domain & handle ownership** | ⚠️ UNVERIFIED | Confirm szlholdings.com, GitHub org, HF org are owned by the company entity (not the founder personally) or assigned. |

---

## 5. Employment / Advisor / 83(b)

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 5.1 | **Founder employment / services agreement** | ❌ ASSUMED MISSING | Even single-founder, paper the relationship (or a member-services agreement for an LLC) to anchor IP assignment and at-will terms. |
| 5.2 | **Advisor agreement template** (e.g., for Greene / Defense Unicorns relationship) | ❌ MISSING | Adopt a FAST-style advisor agreement (Founder/Advisor Standard Template). Typical advisor grant 0.10%–1.00% over 1–2 yr depending on tier. Keep advisor equity in the option pool, not founder stock. **Note:** if Greene is being approached for defense GTM (see `final_sweep/gtm/REPLICATOR_AND_IQT.md`), keep advisory and any procurement-influence roles cleanly separated to avoid OCI (organizational conflict of interest) issues. |
| 5.3 | **83(b) election** — filed within **30 days** of any restricted equity grant subject to vesting | ❌ TIME-CRITICAL | If founder or advisor restricted units/stock vest, an 83(b) election must be mailed to the IRS within 30 days of grant — **the deadline is unforgiving and cannot be cured late.** For an LLC issuing profits interests, an 83(b) is commonly filed protectively. Confirm whether any grant has already triggered a (possibly missed) window. |
| 5.4 | **Option pool / equity incentive plan** | 🔲 DECISION REQUIRED | Establish a plan (cleaner post-C-Corp conversion). For an LLC, use profits interests or phantom equity. |

---

## 6. 🔲 Delaware C-Corp Conversion Decision Tree (LLC vs C-Corp for Series-A)

> **Bottom line for an institutionally-fundable AI/defense startup: nearly all priced-equity VC investors require a Delaware C-Corp.** The LLC is fine today; conversion should be timed to *just before* the first priced round.

```
START: Are you raising priced equity (Series Seed/A) from institutional VCs?
│
├── NO (bootstrapping / revenue-only / SBIR-grant-funded only)
│     └── STAY NY LLC. Keep OA, cap table, IP chain clean.
│         Revisit at first term sheet.
│
└── YES → Will the lead require Delaware C-Corp? (almost always YES)
      │
      ├── Using a SAFE / convertible note now, priced round later?
      │     └── You CAN raise a SAFE as an LLC, but most YC-style SAFEs
      │         assume C-Corp stock. Either:
      │           (a) convert to DE C-Corp BEFORE the SAFE, or
      │           (b) use an LLC-adapted SAFE and convert before the
      │               priced round that the SAFE converts into.
      │         RECOMMENDED: convert before taking institutional SAFEs.
      │
      └── Taking a priced round directly?
            └── CONVERT to Delaware C-Corp FIRST.
                Mechanics options:
                  1. Statutory conversion (DE allows NY LLC → DE C-Corp
                     conversion in one step; cleanest, preserves EIN).
                  2. Merger (LLC merges into newly-formed DE C-Corp).
                  3. Asset transfer / "F-reorg" (more complex).
                Tax: LLC→C-Corp is generally tax-free under IRC §351 if
                     structured correctly; CONFIRM WITH TAX COUNSEL —
                     negative capital accounts / liabilities>basis can
                     trigger gain.
```

**Additional conversion considerations for a DEFENSE-adjacent company:**
- **QSBS (§1202):** C-Corp stock issued at/after conversion can qualify for Qualified Small Business Stock gain exclusion — a major founder/investor benefit unavailable to LLCs. The 5-year holding clock starts at C-Corp issuance, so **earlier conversion can be advantageous** once a priced round is near-certain.
- **Government contracting / SAM.gov:** Either entity type can register, but contracting officers and primes are most familiar with corp structures. If pursuing DoD work (Replicator, DIU, SBIR), align entity decision with the contracting timeline.
- **CFIUS / foreign-ownership:** A C-Corp cap table makes foreign-investment screening (relevant for defense tech) far cleaner. Avoid foreign cap-table entries before clearing CFIUS posture.
- **Section 1202 + ITAR/EAR:** none of these change the conversion mechanics but all favor a clean DE C-Corp before bringing on outside capital.

**Recommended timeline:** Keep NY LLC now → clean up §§1–5 → convert to DE C-Corp at first credible term sheet / before institutional SAFEs.

---

## 7. Banking, Insurance, Contracts

| # | Item | Status | Action / Notes |
|---|---|---|---|
| 7.1 | Business bank account in entity name | ⚠️ UNVERIFIED | Confirm separation of personal/business funds (piercing-the-veil risk). |
| 7.2 | Commingling audit | ❌ ASSUMED RISK | Single-founder companies frequently commingle. Document and remediate. |
| 7.3 | Insurance (general liability, E&O / tech-E&O, cyber, D&O before board seats) | ❌ ASSUMED MISSING | D&O becomes important once investors take board seats. |
| 7.4 | Customer/vendor contract templates (MSA, DPA, EULA) | ⚠️ UNVERIFIED | Needed before first paying customer; DPA needed if processing personal data. |

---

## 8. Templates To Adopt (action items)

1. **Operating Agreement** (NY single-member or multi-member).
2. **Founder CIIAA** (Confidential Information & Invention Assignment).
3. **Contributor / Contractor IP Assignment** + **CLA/DCO** for OSS repos.
4. **FAST-style Advisor Agreement** (for Greene and future advisors).
5. **83(b) Election cover letter + USPS certified-mail tracking log.**
6. **Written Consent / Minute template** (board or member action).
7. **Cap Table** (Carta/Pulley or a maintained spreadsheet-of-record).
8. **Stock Plan / Profits-Interest Plan.**

---

## 9. Priority Order (what to do first)

1. **Verify entity exists & is in good standing** (§1.1, §1.5) — everything depends on this.
2. **Execute Founder IP Assignment** (§4.1) — closes the biggest diligence hole.
3. **Confirm/file any pending 83(b) windows** (§5.3) — time-critical, uncurable.
4. **Sign Operating Agreement** (§3.1) — NY legally requires it.
5. **Stand up cap table + minute book** (§3.3, §3.4).
6. **Clear trademarks & OSS licenses** (§4.3, §4.4).
7. **Plan DE C-Corp conversion** for first priced round (§6).

---

*This checklist is informational and not legal or tax advice. Engage Delaware/NY startup counsel and a tax advisor before acting on §§5–6. Verify all ⚠️ items against primary documents before representing them as complete.*

— Yachay
