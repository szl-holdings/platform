# FORGE INSTRUCTION — Founder green-lit: cosign sign + killinchu.net DNS

**Issued:** 2026-06-15 (founder Stephen Lutar gave explicit green light: "I green light co sign … the dns get it all done").
**Doctrine v11 — never weaken.** locked = EXACTLY 8 {F1,F4,F7,F11,F12,F18,F19,F22} @ kernel c7c0ba17; Λ=Conjecture 1; Khipu=Conjecture 2; SLSA L1 honest · L2 attested · L3 roadmap (NEVER bare L3/FedRAMP/IronBank/CMMC/ATO); trust never 100%; **never commit a private key** (founder green light does NOT override this — the FA-001 key stays founder-held); effectors SIMULATED.

---

## CONTEXT — what is already DONE (verified 2026-06-15 ~19:55 UTC, interactive session)

- **a11oy CI fully GREEN.** The last red (`HF Space module-drift guard` → `live_wires.html ahead=github`) is **fixed at root cause**: `live_wires.html` (root-level served `/live-wires` 3D page) was outside hf-sync's mirror set, so the Space served the old Khipu-Constellation iframe target (dead `frontier-viz` static space). Added `live_wires.html` to a11oy `.github/workflows/hf-sync.yml` (`on.push.paths` + `CATHEDRAL_FILES`) in commit `8de31122`. hf-sync pushed the canonical file → Space now serves sha256 `034630718fed18be` byte-identical to GitHub; CONSTELLATION → `https://a-11-oy.com/holographic` (live). Re-ran drift guard: **`errors (drift): 0` — OK, conclusion success.** (2 remaining are allowlisted WARNINGS: `static/3d/surfaces/fabric.js`, `static/3d/surfaces/governance.js` — intentional accepted_divergences pending box redeploy; not failures.)
- **killinchu CI green.** Both Spaces RUNNING; box energy MEASURED + climbing (>617k J, stub_mode:false); doctrine v11 / locked 8 / c7c0ba17 / Λ=Conjecture 1 confirmed on the wire at `/api/a11oy/v1/honest`.
- **Founder personal site** deployed fresh (LinkedIn confirmed `https://www.linkedin.com/in/stephen-lutar-279315240`; fixed a sandbox-forbidden `sessionStorage` use → in-memory cache).

---

## TASK 1 — COSIGN: prep is done, founder does the 4 signing commands

The cosign FA-001 **private key only the founder holds** — Forge must NOT sign, must NOT fetch/commit the key. Forge's job is to keep the bundles recut/fresh and leave the exact, current signing block ready. The latest verified state (from `cosign/UDS_COSIGN_FOUNDER_HANDOFF.md`, recut 2026-06-15):

Fresh organ images (verified current via GitHub Packages API 2026-06-15):
- `ghcr.io/szl-holdings/a11oy:uds-v0.3.0` → `sha256:088f8da12625eda3f43b459aa4da8d908a01137d9c3cdbf4b71a8e48bab2bf6e`
- `ghcr.io/szl-holdings/killinchu:uds-v0.2.0` → `sha256:946f1fc9675933a373364d372a03f4f8314ebee6a8adcd97926fa52b081af7cc`
- `ghcr.io/szl-holdings/szl-receipts:0.4.0-upstream` → `sha256:3ec1e2bac45453e588252c5584106ec497c4e1e7bc8279229c993f57a7819829`

Recut bundle source commits (szl-uds-deployment main): a11oy `80aa8be4`, killinchu `938a15ed`.

**FORGE each tick:** re-verify the three organ digests against the GitHub Packages API; if any organ rebuilt, recut the affected `bundles/*/uds-bundle.yaml` (path-builds compose fresh organs automatically — no @sha256 pin edit needed) and update the HONEST-STATUS digest comments. Leave `cosign/UDS_COSIGN_FOUNDER_HANDOFF.md` current. Do NOT publish/sign.

**FOUNDER runs (with FA-001 key local; NEVER in any repo):**
```bash
export COSIGN_PASSWORD='<FA-001 passphrase>'
uds create bundles/szl-warhacker --confirm
uds publish bundles/szl-warhacker oci://ghcr.io/szl-holdings
cosign sign --key fa-001.key ghcr.io/szl-holdings/szl-warhacker-bundle:<version>
cosign verify --key .github/cosign.pub ghcr.io/szl-holdings/szl-warhacker-bundle:<version>
# air-gap proof:
uds deploy oci://ghcr.io/szl-holdings/szl-warhacker-bundle:<version> --confirm
```
Keep `.github/cosign.pub` fingerprint matched to FA-001 (sentinel cron warns on mismatch). Signing = the L2 attestation step; it does NOT make the bundle L3/FedRAMP/IronBank/CMMC/ATO — keep bundle README honest.

## TASK 2 — killinchu.net DNS (founder/registrar action)

Verified 2026-06-15: `killinchu.net` returns **NXDOMAIN** (DNS Status 3) and **404 from Verisign RDAP** → the domain is **NOT registered** (no zone, no nameservers). This is NOT an "A-record missing" — there is no zone to edit. `a-11-oy.com` correctly resolves to `167.233.50.75` (box).

**FOUNDER action (registrar — Forge cannot do this, no registrar credentials and must not have them):**
1. Register `killinchu.net` (or confirm the intended apex domain) at the registrar.
2. Point nameservers to the DNS host, create zone.
3. Add `A  @  → 167.233.50.75` (same box as a-11-oy.com) and `A  www → 167.233.50.75` (or CNAME www→apex).
4. Box reverse-proxy already serves killinchu paths; once DNS propagates, `https://killinchu.net/elite` should land. Until registered, the live killinchu surface remains `https://szlholdings-killinchu.hf.space/elite` (RUNNING, green).

---

## PROVE-IT checklist for Forge to confirm (not founder-gated)
- [ ] a11oy hf-module-drift: `errors (drift): 0` (DONE — re-confirm stays green).
- [ ] Both Spaces RUNNING; `/api/a11oy/v1/honest` git_sha == GitHub a11oy main HEAD.
- [ ] Three organ digests current vs GitHub Packages API; bundles recut if any rebuilt.
- [ ] `cosign/UDS_COSIGN_FOUNDER_HANDOFF.md` reflects current digests.
- [ ] Report which items are DONE vs FOUNDER-GATED (cosign sign, DNS register) — do not fake green.

**Honest BLOCKED beats fake green.** The two founder-gated items (sign with FA-001, register killinchu.net) are correctly founder-only and must stay that way even under green light — the green light authorizes Forge to PREP, not to handle the founder's private key or registrar account.
