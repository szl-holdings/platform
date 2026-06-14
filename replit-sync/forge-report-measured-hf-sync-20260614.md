# Forge report — MEASURED energy proof: HF mirror SYNCED (real, no half-state)

**Order:** `replit-sync/NEXT_ORDER.md` top order (sha 21450a57) — finish the MEASURED energy proof:
(1) sync MEASURED cert to the HF a11oy Space mirror; (2) DSSE-sign the certificate.

## What was actually true on arrival (order premises corrected against live reality)
- a11oy.net `/api/a11oy/v1/pinn/certificate` → **MEASURED** (real NVML, sovereign GPU betterwithage / RTX 5050 Laptop: 9.39 W × 8.62 s, Δ80.967 J / 3 live samples). REAL.
- GitHub `szl-holdings/a11oy` main → cert **MEASURED** + **real on-metal Ed25519 DSSE** envelope (`physical_bounds_certificate.dsse.json`, keyid `sha256:80a0cfc7…`, signed with `/root/ed25519.pem` via openssl, self-verified). Already committed (8054ee9, ancestor of main). REAL — not faked.
- HF Space `szlholdings-a11oy.hf.space` → **SAMPLE** (the gap).
- Order said run `hf-sync.yml`; that workflow mirrors only README + front-door HTML/JS. `hf-sync-backend.yml` mirrors only **.py + Dockerfile** (derived from Dockerfile COPY sources, filtered to `.py`). **Neither mirrors the cert JSON data files.** So the Space Dockerfile had the `COPY physical_bounds_certificate.json …` line but the **cert JSONs were never uploaded to the Space repo** → it built/served SAMPLE. (Verified: `list_repo_files` → cert files = NONE.)

## What I executed (real, additive, honest)
1. Uploaded the three real artifacts from GitHub main (authoritative source of truth) to the Space repo via `huggingface_hub.create_commit` (git-free path, same as hf-sync): `physical_bounds_certificate.json` (MEASURED), `physical_bounds_certificate.dsse.json` (real Ed25519 DSSE), `agentic_decision_trail.json`. HF commit `b48d9c19`.
2. Triggered a factory rebuild. Space rebuilt (RUNNING_BUILDING → RUNNING) and **flipped to MEASURED**.

## Verified end state (all three surfaces consistent)
- a11oy.net → **MEASURED** (5/5 consecutive hits; earlier flap gone).
- HF Space → **MEASURED** + DSSE envelope live (keyid `sha256:80a0cfc7…`).
- GitHub main → **MEASURED** + DSSE.

## Honest residual (NOT faked, founder-gated)
Item 2 is **already real** as an on-metal Ed25519 DSSE signature (published on all three surfaces). The ONLY unfinished piece is **public transparency-log anchoring** (Sigstore-keyless / Rekor — the CI/FA-001 path), which the cert's own `_transparency_note` honestly states is separate and not yet claimed. That requires the FA-001 / Sigstore identity (founder-gated) and was **not fabricated**. UNSIGNED-at-transparency-layer stays honestly labeled.

## Durability note
Cert JSONs now persist in the Space repo (the backend delete-sweep only removes `.py`), and the Dockerfile COPY re-bakes them on every rebuild → MEASURED survives future factory rebuilds. Optional hardening (follow-up, not done): add the cert artifacts to `hf_sync_backend.py`'s mirror set so future cert *updates* on GitHub auto-propagate to the Space.

The agentic-evolution wave (lower section of NEXT_ORDER) remains **report-only / founder-gated / freeze-staged** — untouched.

— Forge
