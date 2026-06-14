# SZL Forge — ORDER: close ALL 6 gaps (mesh + deploy + GPU) — full-stack team output incoming

A 6-dev Opus-4.8 team is building all 6 gap-closures NOW (SZL-native, real-data, doctrine-honest); the
parent agent commits the engine files to a11oy main as each lands. YOUR job: mesh them into serve.py,
COPY into the Dockerfile, deploy box+HF, and run the GPU/box-only real-data pieces. PROVE-OR-DOWNGRADE in
force (DONE only with a pushed SHA / HTTP 200 from a named endpoint / a verifying signature; else RECOMMENDED
or BLOCKED). Doctrine v11, clean-room, 0 CDN, sovereign, MEASURED/MODELED labels, no fabrication.

## GAP 1 — Behavioural artifact monitor (signature != safety)
Mesh artifact_behaviour_monitor.py; expose /api/a11oy/v1/assurance/artifact (deny-by-default behavioural
verdict over our OWN build/deploy artifacts). RUN IT INWARD on real a11oy/killinchu image builds — flag
size-anomaly, unexpected-file injection, unexpected egress, signed-but-unauthorized. GATE: route 200 +
verdict on a real artifact; a valid-signature-on-bad-artifact case is DENY'd behaviourally.

## GAP 2 — C2PA Content Credentials (EU AI Act Art.50, Aug 2 2026)
Mesh content_credentials.py; expose /api/a11oy/v1/credential. WIRE c2patool (or the c2pa rust SDK) on the
box so EVERY generated asset (charts, holographic renders, AI outputs) gets a signed C2PA manifest at
generation time, using our cosign identity. GATE: a real generated asset carries a verifiable Content
Credential (ai_generated flag, sha256, signed); tamper fails verify; self-signed honestly lower-trust.

## GAP 3 — Compliance crosswalk (NIST AI RMF / ISO 42001 / EU AI Act)
Commit COMPLIANCE.md to a11oy + platform docs; expose /api/a11oy/v1/compliance from compliance.json.
GATE: /compliance 200; coverage scores honest (IMPLEMENTED/PARTIAL/ROADMAP — no framework claimed 100%
unless every mapped control is truly IMPLEMENTED).

## GAP 4 — Runtime attestation + model-weight hash
Mesh runtime_attestation.py; expose /api/a11oy/v1/attest. On the GPU box: compute the REAL sha256 of the
self-run qwen2.5-coder weights + system prompt (fill the model axis), issue short-validity runtime receipts
bound to a live probe. GATE: /attest returns build+model+runtime axes; expired receipt invalid; model-hash
is REAL (from the box), not a stand-in. If weights unreachable -> MODEL axis BLOCKED honestly.

## GAP 5 — Forge replayable ledger + kill switch
Adopt forge_governance.py as Forge's OWN governance: every Forge action goes through pre_action (deny-by-
default, privilege rings, kill switch) and post_action (hash-chained append-only ledger). Expose
/api/a11oy/v1/forge/ledger (replayable, tamper-evident) + a founder kill switch. GATE: ledger 200, replay
reproduces recent actions, forbidden actions (keystone merge / key commit) structurally DENY'd. THIS MAKES
FORGE AUDITABLE.

## GAP 6 — Post-quantum signature seam (ML-DSA / FIPS 204)
Mesh pq_signing.py; install a real ML-DSA lib on the box so the DSSE signer can do hybrid Ed25519+ML-DSA.
GATE: a cert signed in hybrid mode verifies (both algs); the ml-dsa path uses a REAL PQ lib on the box (the
sandbox stub is STRUCTURAL-ONLY — replace it). If no PQ lib installable -> BLOCKED honestly, keep Ed25519.

## CONSOLIDATE
Keep copy-sync lockstep GREEN + GitHub<->HF byte-identical across all new files. Fold the new assurance/
credential/compliance/attest/ledger routes into /anatomy/loop + the self-describing /estate index.

## P3 [FOUNDER] (report BLOCKED, never fake): RTX-4000 rig tailnet IP · VAST_API_KEY · killinchu domain · FA-001.

## DOCTRINE v11 (HARD)
A signature is NOT proof of safety. No fabricated DONE/numbers/signatures/geometry. MEASURED only via real
run/exporter. Λ = Conjecture 1 (advisory). Honest inverse of free-energy. Clean-room, cite-never-plagiarize.
0 CDN, sovereign. Never commit a key. Never merge a lutar-lean keystone PR. Honest BLOCKED beats a false DONE.

— Sign-off: Stephen P. Lutar Jr. <stephenlutar2@gmail.com> · Doctrine v11 LOCKED · Λ = Conjecture 1
