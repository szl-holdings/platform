# Yuyay Axis 14 — Ayni Reciprocity Coefficient (yuyay_v4)

**Author:** Yachay (CTO) · **Date:** 2026-06-01 · **Status:** ADDITIVE

---

## Why a new axis, and why it does NOT disturb yuyay_v3

Doctrine v11 ships **yuyay_v3** with **13 canonical axes** (2 sacred ≥ 0.95, 7
structural ≥ 0.90, 4 introspection cross-linked to HUKLLA T03/T04/T09/T10) and a
LOCKED replay hash:

```
yuyay_v3 replay hash = bacf54434f1a3bf2d758b27a62d5fd580ca4c8d3b180693573eeebcaea631fc5
```

This hash is computed over the **v3 axis vector and its replay receipts only**. We do
**not** modify, reorder, or re-weight any v3 axis. Instead we define a **superset**
schema `yuyay_v4` that appends a 14th axis and gets **its own, separate replay hash**.
Any consumer pinned to v3 keeps reading the first 13 components and recomputes the
identical v3 hash; v4-aware consumers read 14 and compute the v4 hash. This is the
same additive-schema discipline used for HUKLLA T24 (append, never mutate).

```
yuyay_v3  = [ x1 .. x13 ]                      hash = bacf5443...631fc5   (LOCKED, UNTOUCHED)
yuyay_v4  = [ x1 .. x13, alpha_14 ]            hash = sha256(v4 vector ⧺ v4 receipts)  (NEW)
```

## Axis 14 definition

| field            | value |
|------------------|-------|
| index            | 14 |
| name             | `ayni_reciprocity` |
| symbol           | \(\alpha_o\) |
| class            | structural (reciprocity), **not** sacred, **not** mystical |
| range            | \([0,1]\) |
| balanced point   | \(0.5\) (In = Out) |
| gate / threshold | \(\alpha_{\min} = 0.45\); below ⇒ HUKLLA **T24** fires |
| source primitive | Axelrod–Hamilton 1981 direct reciprocity; Trivers 1971 reciprocal altruism |
| formula          | \(\alpha_o = \mathrm{In}_o / (\mathrm{In}_o + \mathrm{Out}_o)\) |
| computed by      | `ayni_os/reciprocity_monitor.py` per organ per window |

## Cross-links (no new coupling into v3)

- Axis 14 is **read-only** w.r.t. the 13 v3 axes; it neither feeds nor reweights them.
- It cross-links to **HUKLLA T24** (additive tripwire) exactly as the 4 introspection
  axes cross-link to T03/T04/T09/T10 — same pattern, new wire, no v3 mutation.
- It composes into Puriq master formula as an extra bounded factor
  \(\le 1\) (`Yuyay_14(a)`), preserving Λ-monotonicity (a factor in \([0,1]\) cannot
  increase a positive-homogeneous bounded aggregator past its existing bound).

## Hash discipline (verifiable)

`reciprocity_monitor.py` exposes `yuyay_v4_hash(state)` which:
1. serializes the 14-vector canonically (v3 13-vector ⧺ alpha_14),
2. concatenates v4 replay receipts,
3. sha256 → **v4 hash** (distinct from v3).
A regression test asserts the **v3 hash is byte-identical** to
`bacf5443...631fc5` when alpha_14 is dropped — proving non-disturbance.

— Signed, **Yachay**
