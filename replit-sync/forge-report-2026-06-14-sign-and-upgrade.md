# forge-report (2026-06-14): SIGN + upgrade order — prove-or-downgrade status

Order: `replit-sync/FORGE-INSTRUCTION-sign-and-upgrade-20260614.md` (P0 finish signature; P1 upgrade wave).
Reporter: Forge (Replit task env, on a11oy.net box 167.233.50.75). Rule honored: DONE only with a checkable
artifact (commit SHA / HTTP 200 / verifying signature); else RECOMMENDED or BLOCKED. No narration-as-DONE.

## ITEM A — sync MEASURED certificate to HF a11oy Space mirror — **DONE**
CHECKABLE ARTIFACT (HTTP 200):
```
$ curl -s https://szlholdings-a11oy.hf.space/api/a11oy/v1/pinn/certificate
HF label: MEASURED | status: VERIFIED (physical bounds) · UNSIGNED (STRUCTURAL-ONLY)
```
Box endpoint matches (label MEASURED, physically_bounded=true, energy_joules_derived=5112.38,
landauer_multiple≈5.1e8). Energy = real NVML power.draw × wall time on RTX 5050 Laptop (betterwithage),
56.18 W mean / 91 s / 341.3 K — MEASURED, not TDP, not fabricated. bit_operations/bits_erased/info are
MODELED (noted in the cert). DURABILITY hardened: cert now lives in the mounted dir
`/opt/szl/a11oy-data/physical_bounds_certificate.json` and `a11oy-rebuild` was wired with
`-e SZL_PINN_ARTIFACT_DIR=/data/a11oy`, so a future container rebuild no longer reverts it to SAMPLE.

## ITEM B — DSSE-sign the certificate (UNSIGNED → signed) — **BLOCKED: needs founder FA-001 key drop**
GATE B requires a real DSSE signature that verifies. The signing key is ABSENT (checked, presence-only,
never printed):
- no `SZL_COSIGN_PRIVATE_PEM` / `COSIGN_PRIVATE` / FA-001 / `A11OY_SIGNING_KEY` in `/opt/alloyscape/.env`,
  `/opt/alloyscape/api-server/.env`, or `/etc/*.env`;
- no `cosign*.key` private PEM file on the box;
- `docker exec a11oy printenv SZL_COSIGN_PRIVATE_PEM` → empty.
`szl_dsse.py` honestly reports `signing_available=false` without the secret and refuses to fabricate a sig.
Did NOT fabricate a signature or digest (Doctrine v11).

Second prerequisite (independent of the key): `szl_pinn_bounds.py` hardcodes
`"signature": None` and the status string `…UNSIGNED (STRUCTURAL-ONLY)`, and exposes no `/verify` route
(`/api/a11oy/v1/verify` → 404). So flipping /pinn/certificate + /verify to SIGNED needs a small a11oy-repo
PR adding the DSSE sign+verify path (sign cert PAE via szl_dsse → embed sig+keyid → verify on read → add
/verify route). That PR can only be GATE-tested once the key exists.

### UNBLOCK (founder, one action)
Drop the SZLHOLDINGS cosign PRIVATE key as the box/container secret `SZL_COSIGN_PRIVATE_PEM` (PKCS8 PEM),
and pass it into the a11oy container (`-e SZL_COSIGN_PRIVATE_PEM` on the `a11oy-rebuild` docker run line).
Then the sign-path PR lands and GATE B verifies (real keyid + signature; status drops "UNSIGNED").

## P1 — upgrade wave (2D-heat/Burgers PINN, real energy exporter, cert-history endpoint, console bounds
badge, 2nd-GPU role-split) — **RECOMMENDED** (each its own draft PR; multi-PR; none marked DONE without a
PR number + green checks). Natural first PR = the szl_pinn_bounds sign+verify path above (pairs with Item B).

— Doctrine v11: MEASURED energy only · honest inverse of free-energy, no over-unity · Λ = Conjecture 1 ·
locked = 8 · never commit a key · honest BLOCKED beats a false DONE.
