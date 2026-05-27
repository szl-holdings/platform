---
name: Vessels reseed protocol
description: How to wipe + reseed the vessels universe in dev when seed-vessels.ts constants change. Non-obvious because api-server does not auto-reseed on restart and the seed has a tail dependency that throws.
---

# Vessels reseed protocol

When you change constants/shape in `artifacts/api-server/src/lib/seed-vessels.ts`, the api-server does **not** auto-reseed on workflow restart. The seed only fires via:
- POST to the admin seed endpoint in `vessels-extended.ts` (requires auth), OR
- `tsx -e "import(...seed-vessels.ts).then(m => m.seedVesselsData())"` directly, OR
- the `seed-ecosystem.ts` script.

To force a clean reseed:
1. `TRUNCATE TABLE vessels_positions, vessel_voyage_economics, vessel_port_calls, fleet_exceptions, vessel_maintenance, vessel_sanctions_screening, vessels, vessels_fleets RESTART IDENTITY CASCADE;`
2. Invoke `seedVesselsData()` directly via tsx (faster than chasing the admin auth header).

**Why:** `seedVesselsData` has an existence-check guard (`if existingCount >= 50 && positionCount >= 50 …`) that early-returns when tables already hold seed-volume data — so simply restarting the api-server against a non-empty DB no-ops, and editing constants without truncating means none of the new values land.

**Important tail caveat:** `seedPscData` (called at the end of `seedVesselsData`) queries `vessels_psc_inspections`, which may not exist in every dev DB. The function will throw `relation "vessels_psc_inspections" does not exist`. This is **NOT** a failure of the main seed — vessels / fleets / voyages / port_calls / exceptions all populated successfully before that line. Verify with a `SELECT count(*) FROM vessels` after the apparent failure; if it's 55, the seed worked.
