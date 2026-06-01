# CROSS_FLAGSHIP_LINK_PASS.md

**Goal (founder directive):** every flagship should point back to the a11oy hub so
founder/customer/judges/Greene have ONE front door. A "Powered by SZL · See the full
stack on a11oy →" backlink (→ `https://szlholdings-a11oy.hf.space/hub`) is added to each
flagship Space `README.md`.

**Method:** README-only edit (no runtime impact), idempotent, ADDITIVE, one
`HfApi.create_commit` per Space (NEVER GitHub Actions). Script:
`push_cross_flagship_links.py` (sentinel-guarded `<!-- szl-hub-backlink -->`).

---

## Target Spaces & status

| Flagship | repo_id | Backlink | Notes |
|----------|---------|----------|-------|
| amaru | `SZLHOLDINGS/amaru` | READY-TO-PUSH | script prepared; see status below |
| sentra | `SZLHOLDINGS/sentra` | READY-TO-PUSH | |
| vessels | `SZLHOLDINGS/vessels` | READY-TO-PUSH | was RUNNING_BUILDING at baseline |
| rosie | `SZLHOLDINGS/rosie` | READY-TO-PUSH | |
| anatomy-3d | `SZLHOLDINGS/anatomy-3d` | READY-TO-PUSH | |
| rosie-3d | `SZLHOLDINGS/rosie-3d` | READY-TO-PUSH | |
| uds-demo | `SZLHOLDINGS/uds-demo` | READY-TO-PUSH | |
| killinchu | `SZLHOLDINGS/killinchu` | DEFERRED | RED / spec-only / not deployed per gap report — do not surface a dead flagship; backlink it only once killinchu ships a v0 (or is reframed as "spec, Q3 2026"). |

> **a11oy itself** already links to every tab from its own `/hub` index page and nav bar,
> and to the founder's full stack — no self-backlink needed.

---

## ⚠️ Execution status — BLOCKED ON SANDBOX NETWORK (parent: please finish)

The link pass is **prepared and ready** but the final pushes were **not completed in this
session** because the sandbox entered a degraded state late in the run where outbound
network commands (HF downloads, even single `curl`s) were being **killed by the sandbox
resource limiter** (`signal: killed`). This is environmental, not a logic error — earlier
in the session the identical calls succeeded (the a11oy hub itself was pushed and verified
live).

**To finish (one command, or one flagship at a time to stay under resource limits):**

```bash
cd .../a11oy_hub_integration
# all at once (if sandbox network is healthy):
python3 push_cross_flagship_links.py
# or one at a time (resource-safe):
python3 push_cross_flagship_links.py amaru
python3 push_cross_flagship_links.py sentra
python3 push_cross_flagship_links.py vessels
python3 push_cross_flagship_links.py rosie
python3 push_cross_flagship_links.py anatomy-3d
python3 push_cross_flagship_links.py rosie-3d
python3 push_cross_flagship_links.py uds-demo
```

The script is **idempotent** — re-running skips any README that already carries the
`<!-- szl-hub-backlink -->` sentinel, so it is safe to run repeatedly and safe to run
after a sibling has touched the same README. Per-Space commit SHAs are appended to
`_cross_flagship_result.txt`.

---

## The exact backlink block appended to each README

```markdown
<!-- szl-hub-backlink -->
---

### Powered by SZL

**[Powered by SZL · See the full stack on a11oy →](https://szlholdings-a11oy.hf.space/hub)**

a11oy is the SZL Brand Orchestration Layer — the one place to see every cross-cutting
concern across the SZL flagships: docs, pricing, SDK, status, observability, security
posture, compliance path, cued-engagement (Yachay-Dome), UDS allies, counter-UAS, the
Khipu audit DAG, and the live gap report.

*Doctrine v12 (PURIQ) · 749 declarations · 14 axioms · 163 sorries · 13-axis yuyay_v3 ·
lutar-v18.0.0 @ c7c0ba17 · SLSA L1 (honest) · Khipu signature = DSSE/cosign PLACEHOLDER.
Signed: Yachay · Co-author: Perplexity Computer Agent.*
```

## Hard-rule compliance
- ✅ HfApi direct push only (one commit per Space). No GitHub Actions.
- ✅ ADDITIVE — README-only append; no runtime/route/code change; idempotent.
- ✅ LOCKED numbers cited verbatim in the block.
- ✅ IP-HOLD a11oy#57 untouched.
- ✅ Signed Yachay; commit trailer co-author Perplexity Computer Agent.
- ✅ NO BANDAID — real backlink to a real, live `/hub` page (verified 200).
