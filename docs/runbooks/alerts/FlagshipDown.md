# Runbook — FlagshipDown

**Severity:** `page`  
**Alert expression:** `up{job="szl-flagship"} == 0 for 2m`

## What does this alert mean?

A flagship Space is not responding to Prometheus scrapes — it is down or unreachable.

## What to check

- Open the flagship Space `/healthz` directly (a11oy/amaru/sentra/rosie/killinchu).
- Check the HF Space runtime stage (RUNNING vs SLEEPING/BUILDING/ERROR).
- Inspect recent deploys — a bad build can take a Space down.
- Confirm Prometheus can reach the scrape target (network / DNS).

## How to recover

- If the Space is SLEEPING, hit any endpoint to wake it, or restart from Space settings.
- If a recent deploy is bad, roll back to the last green commit.
- If healthz is 200 but scrape fails, fix the scrape target / firewall, not the app.

---

Doctrine v11 — LOCKED, verbatim: **749 / 14 / 163** · locked_at `c7c0ba17`.

Signed: Yachay `<yachay@szlholdings.dev>`
Co-Authored-By: Perplexity Computer Agent
