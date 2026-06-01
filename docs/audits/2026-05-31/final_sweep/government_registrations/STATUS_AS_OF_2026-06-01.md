# Government Registrations — Real Status as of 2026-06-01

**Author:** Yachay (via Perplexity Computer Agent)
**Subject:** Actual federal contracting / export-control registration status for SZL Holdings.

> **HEADLINE — HONEST FINDING:** **SZL Holdings has NO federal awardee, SAM.gov, CAGE, or UEI record that the agent could locate.** Every government-contracting registration below is **NOT REGISTERED / MISSING.** Do not represent the company as "SAM-registered" or "CAGE-coded" in any proposal, capability statement, or investor material until the registrations actually exist. The work to obtain them is real and takes weeks.

---

## 1. Findings Table

| Registration | Status | Evidence / Notes |
|---|---|---|
| **SAM.gov entity registration** | ❌ NOT REGISTERED | No SZL Holdings entity found. Registration is the prerequisite for all federal awards. |
| **UEI (Unique Entity ID)** | ❌ NONE | UEI is assigned during SAM.gov registration; none exists for SZL. |
| **CAGE Code** | ❌ NONE | No CAGE code for SZL Holdings. (See name-collision warning below.) |
| **DUNS** | ⚠️ DEPRECATED | DUNS was retired by the U.S. Government in April 2022 and replaced by the UEI. Do not pursue DUNS; pursue UEI via SAM.gov. |
| **ITAR / DDTC registration** | ❌ NOT REGISTERED | No State Dept. Directorate of Defense Trade Controls (DDTC) registration in DECCS. Required only if manufacturing/exporting USML-listed defense articles. |
| **NAICS codes selected** | ❌ NOT SET | NAICS codes are chosen during SAM.gov registration; none on file. Candidate codes listed in §4. |
| **SBIR/STTR (SBA) registration** | ❌ NOT REGISTERED | Requires SAM.gov + SBA Company Registry first. |

---

## 2. ⚠️ CRITICAL Name-Collision Warning

A **different** entity with a confusingly similar name **does** have federal records — this is NOT SZL Holdings:

- **SZY Holdings, LLC** — UEI `NPFJW3S382W4`, CAGE `0AG09`, Brooklyn, NY.
  - Awardee page: https://www.highergov.com/awardee/szy-holdings-llc-10002270/
  - CAGE record: https://aerobasegroup.com/cage-code/0ag09

**Do not** cite SZY Holdings' UEI/CAGE as if it belonged to SZL Holdings. They are unrelated entities. This collision is exactly the kind of error a diligence reviewer will catch, so it is flagged here explicitly.

---

## 3. How to Actually Get Registered (action plan)

Order matters — each step gates the next:

1. **Prerequisites (from `corporate_hygiene_checklist.md`):**
   - Entity must legally exist and be in good standing (NY DOS).
   - **EIN required** before SAM.gov.
   - A physical (non-PO-box) business address required.
   - Open a business bank account (banking info entered in SAM).

2. **Get a UEI + register in SAM.gov** (free):
   - Start at https://sam.gov/entity-registration
   - SAM.gov now issues the UEI directly (no more separate DUNS step).
   - Validate entity against the legal-business-name + address on file with the IRS/state. Mismatches are the #1 cause of registration delays.
   - Typical timeline: entity validation + registration can take **2–6+ weeks** if documentation review is triggered.

3. **CAGE Code** is auto-assigned by DLA during SAM.gov registration for U.S. entities — no separate action, but confirm it issues.

4. **Select NAICS codes** during SAM registration (see §4).

5. **SBA Company Registry** (if pursuing SBIR/STTR): register at https://www.sbir.gov/ after SAM.

6. **DDTC/ITAR** (only if handling USML defense articles/technical data): register in DECCS at https://www.pmddtc.state.gov/ — annual fee applies. **Determine first whether the company's software is ITAR-controlled vs EAR-controlled (Commerce/BIS) vs not export-controlled at all.** Most pure-software AI tooling is EAR (or EAR99), not ITAR; mis-registering wastes money and creates compliance burden. Get an export-classification opinion before registering.

---

## 4. Candidate NAICS Codes (to select at SAM registration)

| NAICS | Title | Relevance |
|---|---|---|
| 541511 | Custom Computer Programming Services | Core software build |
| 541512 | Computer Systems Design Services | Solutions architecture |
| 541715 | R&D in Physical, Engineering & Life Sciences (except biotech/nanotech) | SBIR/IRAD AI R&D |
| 541330 | Engineering Services | Drone/autonomy systems engineering |
| 518210 | Computing Infrastructure / Data Processing / Hosting | Hosted AI services |
| 511210 | Software Publishers | Productized software |

Pick a **primary** NAICS that matches the dominant revenue line; list the rest as secondary. The primary NAICS also sets the small-business size standard.

---

## 5. Primary-Source References

- SAM.gov: https://sam.gov
- SAM entity registration: https://sam.gov/entity-registration
- NYS Corporation & Business Entity search: https://dos.ny.gov/corporation-and-business-entity-search-database
- SZY Holdings (collision, NOT SZL): https://www.highergov.com/awardee/szy-holdings-llc-10002270/ ; https://aerobasegroup.com/cage-code/0ag09
- DDTC/ITAR (DECCS): https://www.pmddtc.state.gov/
- SBIR/STTR: https://www.sbir.gov/

---

## 6. Bottom Line

SZL Holdings is **not** in any federal contracting system today. For the defense GTM described in `final_sweep/gtm/REPLICATOR_AND_IQT.md`, **SAM.gov + UEI + CAGE registration is the gating first step** and should begin immediately once the entity/EIN are confirmed (see corporate hygiene checklist §1–§2). Budget 4–8 weeks of lead time and do not put defense customers on a timeline that assumes registration is already done.

— Yachay
