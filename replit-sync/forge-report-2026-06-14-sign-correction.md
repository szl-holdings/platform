# forge-report (2026-06-14, CORRECTION): GATE B signature — precise key findings

Supersedes the key claim in `forge-report-2026-06-14-sign-and-upgrade.md` (which said "no key present").
A key IS present; it is the WRONG key. Prove-or-downgrade: still BLOCKED, but for an exact reason.
All checks presence/boolean-only — NO key material printed, NO signature fabricated (Doctrine v11).

## Item A (HF mirror MEASURED) — still DONE (unchanged). HTTP 200 label==MEASURED.

## Item B (DSSE-sign) — BLOCKED: WRONG signing key on the box (founder key/trust decision needed)
Findings on box 167.233.50.75 (a11oy container + /etc):
1. `/etc/a11oy-gpu.env` defines `SZL_COSIGN_PRIVATE_KEY_PEM` — a real EC secp256r1 key (pub fp a1f6d323).
   Injected into the container, `szl_dsse.signing_available()` = True and it signs.
2. BUT it is NOT the published cosign keypair. `szl_dsse.sign_payload()` → `verify_envelope()` ROUND-TRIP
   returns **verified=False**: the box key does NOT match the embedded/published `cosign.pub` (fp 421a1422,
   szl-holdings/.github/cosign.pub). A signature from it carries keyid "szlholdings-cosign" yet fails
   verification against the real public key → a BROKEN/misattributed signature. Not shipped (doctrine).
3. The pre-existing `/opt/szl/a11oy/physical_bounds_certificate.dsse.json` is signed by a THIRD key
   (Ed25519, pub fp 1838d80d, keyid sha256:80a0cfc7…) and attests a STALE cert run (energy 80.967 J),
   NOT the live MEASURED cert (energy 5112.38 J). payload != live cert; _cert_sha256 d95dda… != live 586cc6…
   So it does not attest the served certificate, and its pub is not the published cosign.pub.
4. The running a11oy container does NOT carry any cosign secret (a11oy-rebuild passes none).

Net: three different keys (published cosign EC, box EC, dsse Ed25519); none is the published-cosign PRIVATE
mate, and the only existing signature is over a stale cert. No path to "/verify returns a signature that
verifies against the published key AND binds the live cert" without a founder action.

### UNBLOCK — founder, pick ONE:
(a) Drop the REAL szlholdings-cosign PRIVATE key (mate of published cosign.pub, fp 421a1422) into the box
    secret store as `SZL_COSIGN_PRIVATE_KEY_PEM` and pass it into the a11oy container (`-e` on a11oy-rebuild).
    Then szl_dsse signs AND self-verifies; wiring szl_pinn_bounds → SIGNED is trivial and green. OR
(b) Decide the on-metal box key (fp a1f6d323) is the trust anchor and publish ITS pub as the canonical key
    (key rotation) — then update szl_dsse COSIGN_PUBLIC_PEM in lockstep. This is a trust decision, founder-only.

## Side issue to reconcile: cert divergence
Repo copy `/opt/szl/a11oy/physical_bounds_certificate.json` = 80.967 J (the one that got signed);
live/mounted `/opt/szl/a11oy-data/physical_bounds_certificate.json` = 5112.38 J (the served MEASURED cert).
Siblings produced two. Whatever key is chosen must sign the LIVE cert, and the two copies should be reconciled.

## Ready-to-ship the moment the key is correct (honest, self-verifying design)
Wire szl_pinn_bounds to: sign the live cert via szl_dsse → self-verify → label SIGNED **only if
verify_envelope passes**, else stay UNSIGNED; add /api/a11oy/v1/verify returning the envelope + verdict.
With a wrong/absent key it stays honestly UNSIGNED; with the correct key it flips to SIGNED automatically.

— Doctrine v11: no fabricated/broken signature · MEASURED only · honest BLOCKED beats false DONE.
