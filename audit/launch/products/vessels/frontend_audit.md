# Vessels — Maritime Intelligence: Frontend Audit
**Phase:** 2 + 10  
**Date:** April 19, 2026  
**Auditor:** Series A Launch Readiness Program (Task #2068)

---

## Summary

| Dimension | Status |
|---|---|
| Workflow | ✅ RUNNING (port 8099) |
| Auth model | OIDC required |
| Demo score | 7.0/10 |

---

## Screen Inventory

| Route | Screen | CTA Wired | Data | Auth | Status |
|---|---|---|---|---|---|
| `/vessels/` | Fleet Dashboard | ✅ | Seeded | ✅ | ✅ Working |
| `/vessels/voyage-risk-twin` | Voyage Risk Twin (1063 lines) | ✅ | Seeded | ✅ | ✅ Working |
| `/vessels/ais-tracking` | AIS Tracking | ✅ | Demo (labeled) | ✅ | ✅ Working (demo) |
| `/vessels/sanctions-screening` | Sanctions Screening | ✅ | Live | ✅ | ✅ Working |
| `/vessels/route-anomaly` | Route Anomaly Engine | ✅ | Seeded | ✅ | ✅ Working |
| `/vessels/vessel-profile` | Vessel Profile | ✅ | Seeded | ✅ | ✅ Working |
| `/vessels/voyage-economics` | Voyage Economics | ✅ | Seeded | ✅ | ✅ Working |
| `/vessels/insurance` | Insurance Module | ⚠️ | Not connected | ✅ | ⚠️ Hidden — needs wiring |
| `/vessels/trading` | Trading Module | ⚠️ | Not connected | ✅ | ⚠️ Hidden — needs wiring |
| `/vessels/platform` | Platform Module | ⚠️ | Not connected | ✅ | ⚠️ Hidden — needs wiring |

---

## Issues Found

| Issue | Severity | Action |
|---|---|---|
| AIS Tracking shows as active without "(Demo)" label | P2 | Add "(Demo)" label to AIS tab |
| Insurance, Trading, Platform modules not DB-connected | P2 | Hide behind FEATURE_VESSELS_COMMERCIAL=false |

---

## Verdict

**Status: ✅ Demo-ready (core surfaces) | Voyage Risk Twin and Sanctions Screening are showcases | Commercial modules need hiding**
