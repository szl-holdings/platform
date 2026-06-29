# FORGE-RESULT — counter-UAS / unified deploy alignment (2026-06-11)

**From:** Forge (Replit task agent) → CTO (Computer) / founder Stephen P. Lutar Jr.
**Re:** `FORGE-CUAS-DEPLOY-ALL-ENDS-20260611.md` §2 (UDS payload + mesh) and
`FORGE-INSTRUCTIONS-gated-only-20260611.md` (the two env-gated Forge items).
**Bottom line:** both Forge-actionable UDS items are **satisfied by inheritance / N-A** —
verified from source + CI + image state, **no fabricated deploy**. No risky source edit to a
flagship repo was required on the eve of Warhacker. Details + the genuinely founder-gated list
below.

---

## 1. UDS payload — counter-UAS + unified endpoints already ship (INHERITED) ✅

The air-gapped payload deploys the a11oy/killinchu apps **via their UDS Package CRs that pull
the prebuilt GHCR image** (`szl-fleet-overlay/zarf.yaml` → `configs/packages/package-*.yaml`);
the bundle YAML does **not** re-embed or re-pin the app image, so it cannot drift from the image.
Therefore the payload inherits whatever the GHCR image contains.

Verified the GHCR image contains the modules at the source:
- `a11oy/Dockerfile` line **535** `COPY szl_unified_formulas.py szl_cuas_formulas.py … ./`
- `killinchu/Dockerfile` line **87** `COPY … szl_unified_formulas.py szl_cuas_formulas.py … ./`

Verified the images are freshly rebuilt + signed:
- `ghcr.io/szl-holdings/a11oy` digest `sha256:d52a4fc3…` rebuilt + cosign `.sig`/`.att`
  published **2026-06-11 19:23Z** (keyless OIDC via repo-native `GITHUB_TOKEN`, self-healing on push).

Verified the bundle build/sign CI is green on a **push** event (the only red is the credential-less
scheduled cron, not a real failure):
- `uds-bundles`: **`Zarf Package Build + Sign (Keyless)` = success (push)**, plus Doctrine, Trivy+Grype,
  SBOM, gitleaks, OpenSSF Scorecard all green.
- `szl-uds-deployment` main: all push-event checks green (Doctrine, Pin Check, Verify Signed Assets,
  Clean Deploy Guard, Cosign Identity Pin Guard, Receipts Image Digest Guard, …).

**Conclusion:** the counter-UAS (`szl_cuas_formulas.py`) + unified (`szl_unified_formulas.py`) endpoints
are in the packaged image and therefore in the air-gapped payload. No bundle source change made
(none needed — making one would risk the digest pins for zero benefit).

## 2. UDS mesh — no per-route service map exists (N/A, matches qbio precedent) ✅

The mesh overlay does **not** advertise per-endpoint routes. The canonical fleet-overlay
`uds-packages/a11oy.yaml` (UDS Package CR) exposes the **whole service on port 8080** via the tenant
gateway (`spec.network.expose`) and declares network/SSO/monitor only — there is **no route list** to
register `/v1/cuas/*` or `/v1/unified/*` into. Confirmed org-wide: a search for `v1/qbio` across
`szl-mesh` + `szl-fleet-overlay` returns **0** — i.e. when the qbio routes were added earlier they were
likewise never registered in any mesh service map, establishing the precedent. The new cuas/unified
routes are reachable through the already-exposed service exactly as qbio is.

**Conclusion:** the §2 condition ("**IF** the mesh overlay advertises app capabilities/endpoints…") is
not met; nothing to register. Effector remains **SIMULATED** across the mesh (unchanged).

## 3. Honesty caveat (what I did NOT do, by design)

I am one Replit task agent with **no Docker / zarf / k3d / Lean** in the sandbox. I did **not** run
`uds create` / `uds deploy`, did not build the multi-GB bundle artifact, and did not touch a live
cluster — those are box/CI operations. I verified **source (Dockerfile COPY), image (GHCR digest +
signatures), and CI (push-event green)** and the mesh CR shape. No deploy was faked.

## 4. Founder-gated — exactly what still needs a human secret/approval

1. **Hetzner root redeploy** (167.233.50.75) — pull the fresh signed a11oy image so a-11-oy.com serves
   `/api/a11oy/v1/{cuas,unified,qbio}/*`. Command: `sudo /opt/.../ops/install-a11oy-autodeploy.sh`
   (founder runs sudo; do not auto). Verify a-11-oy.com `/api/a11oy/v1/cuas/summary` 200 after.
2. **Zenodo DOI token** — mint v8 canonical thesis DOI (`szl-papers/papers/SZL_THESIS_v8.md`;
   `CITATION.cff` + `.zenodo.json` staged).
3. **oqs-python PQ keys** — flip PQ Provenance tab signature PROXY → real ML-DSA-65 (NIST FIPS 203/204/205).
4. **cosign/Rekor (uds-v0.3.0 re-sign)** incl. bundle-level cosign **FA-002**; **SZL_LOCAL_LLM_URL**
   (Chaski stub→live); any **MAJOR dep bump** → STOP, founder.

## 5. Doctrine preserved

locked-8 EXACT {F1,F4,F7,F11,F12,F18,F19,F22} @ c7c0ba17 (new tabs EXPERIMENTAL-tier, never joined) ·
Λ=Conjecture 1 · Khipu=Conjecture 2 · effector SIMULATED · 0 runtime CDN · trust never 100% · no
user-visible codenames (agent=Chaski) · GitHub↔HF byte-identical shared modules · no fabricated data.
No gate weakened, no key committed, no Lean self-merge.

— Forge
